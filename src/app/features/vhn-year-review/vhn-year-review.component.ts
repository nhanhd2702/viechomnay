import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  HeatmapDay,
  VhnYearReviewService,
  YearKpis,
  YearReviewTask,
} from './vhn-year-review.service';
import { VhnHeatmapComponent } from './vhn-heatmap.component';
import { VhnExcelExportService } from './vhn-excel-export.service';
import { SnackService } from '../../core/snack/snack.service';

@Component({
  selector: 'vhn-year-review',
  standalone: true,
  templateUrl: './vhn-year-review.component.html',
  styleUrls: ['./vhn-year-review.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButton,
    MatIcon,
    MatProgressSpinner,
    VhnHeatmapComponent,
    DecimalPipe,
  ],
})
export class VhnYearReviewComponent {
  private readonly _yearReviewService = inject(VhnYearReviewService);
  private readonly _excelExportService = inject(VhnExcelExportService);
  private readonly _snackService = inject(SnackService);

  readonly currentYear = new Date().getFullYear();
  readonly selectedYear = signal(this.currentYear);
  readonly availableYears = [
    this.currentYear,
    this.currentYear - 1,
    this.currentYear - 2,
  ];

  readonly isExporting = signal(false);
  readonly days = signal<HeatmapDay[]>([]);
  readonly kpis = signal<YearKpis>({
    totalDone: 0,
    activeDays: 0,
    longestStreak: 0,
    totalTrackedMs: 0,
  });
  readonly tasks = signal<YearReviewTask[]>([]);
  readonly isLoading = signal(true);

  constructor() {
    this._loadData(this.selectedYear());
  }

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this._loadData(year);
  }

  private _loadData(year: number): void {
    this.isLoading.set(true);
    this._yearReviewService.getYearReviewData$(year).subscribe({
      next: (res) => {
        this.days.set(res.days);
        this.kpis.set(res.kpis);
        this.tasks.set(res.tasks);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('VHN Year Review: Lỗi tải dữ liệu', err);
        this.isLoading.set(false);
      },
    });
  }

  formatHours(ms: number): string {
    const hours = ms / (1000 * 60 * 60);
    return hours.toFixed(1);
  }

  async exportExcel(): Promise<void> {
    if (this.isExporting()) {
      return;
    }
    this.isExporting.set(true);
    try {
      await this._excelExportService.exportYearToExcel(
        this.selectedYear(),
        this.kpis(),
        this.tasks(),
      );
      this._snackService.open({
        msg: `Đã xuất thành công file Excel cho năm ${this.selectedYear()}!`,
        type: 'SUCCESS',
      });
    } catch (err) {
      console.error('VHN Year Review: Lỗi xuất Excel', err);
      this._snackService.open({
        msg: 'Có lỗi xảy ra khi xuất file Excel. Vui lòng thử lại!',
        type: 'ERROR',
      });
    } finally {
      this.isExporting.set(false);
    }
  }
}
