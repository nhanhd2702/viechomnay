import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VhnGoogleAuthService } from './vhn-google-auth.service';
import { GoogleCalendarEvent } from './vhn-google.model';
import { TaskService } from '../tasks/task.service';
import { SnackService } from '../../core/snack/snack.service';
import { TaskReminderOptionId } from '../tasks/task.model';
import { getDbDateStr } from '../../util/get-db-date-str';

const GCAL_API_BASE = 'https://www.googleapis.com/calendar/v3';
const GCAL_TAG_PREFIX = '[gcal:';

@Injectable({
  providedIn: 'root',
})
export class VhnGoogleCalendarService {
  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(VhnGoogleAuthService);
  private readonly _taskService = inject(TaskService);
  private readonly _snackService = inject(SnackService);

  readonly isSyncing = signal<boolean>(false);
  readonly lastSyncResult = signal<{ pulled: number; pushed: number } | null>(null);

  private _autoSyncTimer: number | null = null;

  constructor() {
    this._initAutoSync();
  }

  /**
   * Đồng bộ 2 chiều (Option A - Bidirectional Sync)
   */
  async syncBidirectional(): Promise<{ pulled: number; pushed: number }> {
    if (!this._auth.isLoggedIn()) {
      throw new Error('Vui lòng đăng nhập tài khoản Google trước khi đồng bộ.');
    }

    this.isSyncing.set(true);
    let pulledCount = 0;
    let pushedCount = 0;

    try {
      const token = await this._auth.getValidAccessToken();
      if (!token) {
        throw new Error('Không thể lấy mã xác thực Google (Token hết hạn).');
      }

      // Xác định khoảng thời gian: Từ 00:00 hôm nay đến 7 ngày tới
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const timeMax = new Date(timeMin.getTime() + 7 * 24 * 60 * 60 * 1000);

      // 1. CHIỀU PULL: Lấy sự kiện từ Google Calendar về Việc Hôm Nay
      const googleEvents = await this.fetchEvents(token, timeMin, timeMax);
      pulledCount = await this._importGoogleEventsToTasks(googleEvents);

      // 2. CHIỀU PUSH: Đẩy các Task có giờ hẹn từ Việc Hôm Nay lên Google Calendar
      pushedCount = await this._exportTasksToGoogleCalendar(token, timeMin, timeMax);

      // Cập nhật timestamp lần đồng bộ gần nhất
      const nowMs = Date.now();
      this._auth.updateConfig({ lastSyncTimestamp: nowMs });
      this.lastSyncResult.set({ pulled: pulledCount, pushed: pushedCount });

      this._snackService.open({
        type: 'SUCCESS',
        msg: `Đồng bộ Google Calendar thành công! (+${pulledCount} sự kiện về, ↑${pushedCount} công việc lên)`,
      });

      return { pulled: pulledCount, pushed: pushedCount };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đồng bộ thất bại';
      this._snackService.open({
        type: 'ERROR',
        msg: `Lỗi đồng bộ Google Calendar: ${msg}`,
      });
      throw err;
    } finally {
      this.isSyncing.set(false);
    }
  }

  /**
   * Gọi API Google Calendar v3 lấy danh sách sự kiện
   */
  async fetchEvents(
    token: string,
    timeMin: Date,
    timeMax: Date,
  ): Promise<GoogleCalendarEvent[]> {
    const calendarId = encodeURIComponent(this._auth.config().calendarId || 'primary');
    const url = `${GCAL_API_BASE}/calendars/${calendarId}/events`;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });

    const params = {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    };

    const res = await firstValueFrom(
      this._http.get<{ items?: GoogleCalendarEvent[] }>(url, { headers, params }),
    );

    return res.items || [];
  }

  /**
   * Tạo sự kiện mới trên Google Calendar
   */
  async createEvent(
    token: string,
    eventPayload: {
      summary: string;
      description?: string;
      start: { dateTime?: string; date?: string };
      end: { dateTime?: string; date?: string };
    },
  ): Promise<GoogleCalendarEvent> {
    const calendarId = encodeURIComponent(this._auth.config().calendarId || 'primary');
    const url = `${GCAL_API_BASE}/calendars/${calendarId}/events`;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return await firstValueFrom(
      this._http.post<GoogleCalendarEvent>(url, eventPayload, { headers }),
    );
  }

  /**
   * Cập nhật sự kiện trên Google Calendar
   */
  async updateEvent(
    token: string,
    eventId: string,
    eventPayload: Partial<{
      summary: string;
      description: string;
      start: { dateTime?: string; date?: string };
      end: { dateTime?: string; date?: string };
    }>,
  ): Promise<GoogleCalendarEvent> {
    const calendarId = encodeURIComponent(this._auth.config().calendarId || 'primary');
    const url = `${GCAL_API_BASE}/calendars/${calendarId}/events/${encodeURIComponent(eventId)}`;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return await firstValueFrom(
      this._http.patch<GoogleCalendarEvent>(url, eventPayload, { headers }),
    );
  }

  /**
   * Kéo các sự kiện Google Calendar chưa có trong app về làm Task
   */
  private async _importGoogleEventsToTasks(
    events: GoogleCalendarEvent[],
  ): Promise<number> {
    let imported = 0;
    const allTasks = await firstValueFrom(this._taskService.allTasks$);

    for (const ev of events) {
      if (ev.status === 'cancelled') continue;
      if (!ev.id) continue;

      const gcalTag = `${GCAL_TAG_PREFIX}${ev.id}]`;
      const isAlreadyImported = allTasks.some(
        (t) => (t.notes && t.notes.includes(gcalTag)) || t.issueId === ev.id,
      );

      if (isAlreadyImported) continue;

      const title = ev.summary || '(Cuộc họp không có tên)';
      const description = ev.description ? `${ev.description}\n` : '';
      const notes = `${description}🔗 Lịch Google: ${ev.htmlLink || ''}\n${gcalTag}`;

      // Xử lý sự kiện có giờ cụ thể
      if (ev.start?.dateTime && ev.end?.dateTime) {
        const startMs = new Date(ev.start.dateTime).getTime();
        const endMs = new Date(ev.end.dateTime).getTime();
        const duration = Math.max(15 * 60 * 1000, endMs - startMs);

        const taskId = this._taskService.add(title, false, {
          notes,
          timeEstimate: duration,
          issueId: ev.id,
        });

        // Lên lịch giờ làm
        const task = await firstValueFrom(this._taskService.getByIdOnce$(taskId));
        if (task) {
          this._taskService.scheduleTask(task, startMs, TaskReminderOptionId.AtStart);
        }
        imported++;
      } else if (ev.start?.date) {
        // Sự kiện cả ngày
        this._taskService.add(title, false, {
          notes,
          dueDay: ev.start.date,
          issueId: ev.id,
        });
        imported++;
      }
    }

    return imported;
  }

  /**
   * Đẩy các Task có giờ hẹn từ Việc Hôm Nay lên Google Calendar
   */
  private async _exportTasksToGoogleCalendar(
    token: string,
    timeMin: Date,
    timeMax: Date,
  ): Promise<number> {
    let exported = 0;
    const allTasks = await firstValueFrom(this._taskService.allTasks$);

    const minMs = timeMin.getTime();
    const maxMs = timeMax.getTime();

    for (const task of allTasks) {
      // Chỉ đẩy các task có lịch hẹn cụ thể và nằm trong khoảng thời gian đồng bộ
      if (!task.dueWithTime || task.dueWithTime < minMs || task.dueWithTime > maxMs) {
        continue;
      }

      // Kiểm tra xem task đã được gắn thẻ Google Calendar chưa
      const hasGcalTag = task.notes && task.notes.includes(GCAL_TAG_PREFIX);
      if (hasGcalTag || task.issueId?.startsWith('gcal_')) {
        // Đã có trên Google Calendar -> Cập nhật nếu hoàn thành
        const match = task.notes?.match(/\[gcal:([^\]]+)\]/);
        if (match && match[1]) {
          const eventId = match[1];
          const summary = task.isDone ? `[✓ Xong] ${task.title}` : task.title;
          try {
            await this.updateEvent(token, eventId, { summary });
          } catch {
            // Sự kiện có thể đã bị xóa trên Google Calendar
          }
        }
        continue;
      }

      // Tạo mới sự kiện trên Google Calendar
      const startIso = new Date(task.dueWithTime).toISOString();
      const durationMs = task.timeEstimate || 30 * 60 * 1000;
      const endIso = new Date(task.dueWithTime + durationMs).toISOString();
      const summary = task.isDone ? `[✓ Xong] ${task.title}` : task.title;

      try {
        const createdEvent = await this.createEvent(token, {
          summary,
          description: task.notes
            ? `${task.notes}\n(Được tạo từ Việc Hôm Nay)`
            : 'Được tạo từ Việc Hôm Nay',
          start: { dateTime: startIso },
          end: { dateTime: endIso },
        });

        // Gắn tag ID vào ghi chú của Task để lần sau nhận biết
        const updatedNotes = task.notes
          ? `${task.notes}\n${GCAL_TAG_PREFIX}${createdEvent.id}]`
          : `${GCAL_TAG_PREFIX}${createdEvent.id}]`;

        this._taskService.update(task.id, {
          notes: updatedNotes,
        });

        exported++;
      } catch {
        // Tiếp tục với các task khác
      }
    }

    return exported;
  }

  private _initAutoSync(): void {
    const cfg = this._auth.config();
    if (cfg.isAutoSync && cfg.syncIntervalMinutes > 0) {
      const intervalMs = cfg.syncIntervalMinutes * 60 * 1000;
      this._autoSyncTimer = window.setInterval(() => {
        if (this._auth.isLoggedIn() && !this.isSyncing()) {
          this.syncBidirectional().catch(() => {
            // Silent error in background
          });
        }
      }, intervalMs);
    }
  }
}
