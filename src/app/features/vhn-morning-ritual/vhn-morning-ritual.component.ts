import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { TaskService } from '../tasks/task.service';
import { TODAY_TAG } from '../tag/tag.const';
import { VhnMorningRitualService } from './vhn-morning-ritual.service';
import { SnackService } from '../../core/snack/snack.service';

export function parseTaskLines(input: string): string[] {
  return input
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

@Component({
  selector: 'vhn-morning-ritual',
  standalone: true,
  templateUrl: './vhn-morning-ritual.component.html',
  styleUrls: ['./vhn-morning-ritual.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatButton, MatIcon],
})
export class VhnMorningRitualComponent {
  private readonly _taskService = inject(TaskService);
  private readonly _ritualService = inject(VhnMorningRitualService);
  private readonly _snackService = inject(SnackService);
  private readonly _router = inject(Router);

  readonly isVisible = signal(this._ritualService.shouldShowToday());
  taskInput = '';
  readonly greeting = signal(this._getGreeting());

  private _getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Chào buổi sáng! ☀️';
    }
    if (hour < 18) {
      return 'Chào buổi chiều! 🌤️';
    }
    return 'Chào buổi tối! 🌙';
  }

  startDay(): void {
    const lines = parseTaskLines(this.taskInput);
    const todayStr = this._ritualService.getTodayVN();

    if (lines.length > 0) {
      try {
        lines.forEach((title) => {
          this._taskService.add(title, false, {
            dueDay: todayStr,
            tagIds: [TODAY_TAG.id],
          });
        });

        this._snackService.open({
          msg: `Đã thêm ${lines.length} công việc cho hôm nay! Chúc bạn ngày mới hiệu quả!`,
          type: 'SUCCESS',
        });
      } catch (err) {
        console.error('VHN Morning Ritual: Lỗi tạo task', err);
      }
    }

    this._ritualService.markShownToday();
    this.isVisible.set(false);
    this._router.navigate(['/boards']);
  }

  skip(): void {
    this._ritualService.markShownToday();
    this.isVisible.set(false);
  }
}
