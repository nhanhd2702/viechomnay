import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WorklogService } from '../worklog/worklog.service';
import { Worklog } from '../worklog/worklog.model';

export interface HeatmapDay {
  date: string;
  count: number;
  timeSpentMs: number;
}

export interface YearKpis {
  totalDone: number;
  activeDays: number;
  longestStreak: number;
  totalTrackedMs: number;
}

export interface YearReviewTask {
  title: string;
  timeSpent: number;
  doneOn: string;
}

export function buildHeatmapDays(
  year: number,
  dayMap: Map<string, { count: number; timeSpentMs: number }>,
): HeatmapDay[] {
  const days: HeatmapDay[] = [];
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const totalDays = isLeap ? 366 : 365;

  const cur = new Date(year, 0, 1);
  for (let i = 0; i < totalDays; i++) {
    const yearStr = cur.getFullYear();
    const monthStr = String(cur.getMonth() + 1).padStart(2, '0');
    const dateStr = String(cur.getDate()).padStart(2, '0');
    const dayKey = `${yearStr}-${monthStr}-${dateStr}`;

    const data = dayMap.get(dayKey) || { count: 0, timeSpentMs: 0 };
    days.push({
      date: dayKey,
      count: data.count,
      timeSpentMs: data.timeSpentMs,
    });

    cur.setDate(cur.getDate() + 1);
  }

  return days;
}

export function computeKpis(days: HeatmapDay[]): YearKpis {
  let totalDone = 0;
  let activeDays = 0;
  let longestStreak = 0;
  let currentStreak = 0;
  let totalTrackedMs = 0;

  for (const d of days) {
    totalDone += d.count;
    totalTrackedMs += d.timeSpentMs;

    if (d.count > 0 || d.timeSpentMs > 0) {
      activeDays++;
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return {
    totalDone,
    activeDays,
    longestStreak,
    totalTrackedMs,
  };
}

@Injectable({
  providedIn: 'root',
})
export class VhnYearReviewService {
  private readonly _worklogService = inject(WorklogService);

  getYearReviewData$(year: number): Observable<{
    days: HeatmapDay[];
    kpis: YearKpis;
    tasks: YearReviewTask[];
  }> {
    return this._worklogService.worklogData$.pipe(
      map(({ worklog }: { worklog: Worklog }) => {
        const dayMap = new Map<string, { count: number; timeSpentMs: number }>();
        const tasks: YearReviewTask[] = [];

        const yearData = worklog[year];
        if (yearData && yearData.ent) {
          for (const monthKey of Object.keys(yearData.ent)) {
            const monthData = yearData.ent[Number(monthKey)];
            if (monthData && monthData.ent) {
              for (const dayKey of Object.keys(monthData.ent)) {
                const dayData = monthData.ent[Number(dayKey)];
                if (dayData) {
                  const mStr = String(monthKey).padStart(2, '0');
                  const dStr = String(dayKey).padStart(2, '0');
                  const fullDateStr = `${year}-${mStr}-${dStr}`;

                  const taskCount = dayData.logEntries ? dayData.logEntries.length : 0;
                  dayMap.set(fullDateStr, {
                    count: taskCount,
                    timeSpentMs: dayData.timeSpent || 0,
                  });

                  if (dayData.logEntries) {
                    for (const entry of dayData.logEntries) {
                      if (entry.task) {
                        tasks.push({
                          title: entry.task.title,
                          timeSpent: entry.timeSpent || 0,
                          doneOn: fullDateStr,
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        }

        const days = buildHeatmapDays(year, dayMap);
        const kpis = computeKpis(days);

        return {
          days,
          kpis,
          tasks,
        };
      }),
    );
  }
}
