import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { HeatmapDay } from './vhn-year-review.service';

@Component({
  selector: 'vhn-heatmap',
  standalone: true,
  templateUrl: './vhn-heatmap.component.html',
  styleUrls: ['./vhn-heatmap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTooltip],
})
export class VhnHeatmapComponent {
  readonly days = input<HeatmapDay[]>([]);

  readonly CELL_SIZE = 14;
  readonly GAP = 3;

  readonly weeks = computed(() => {
    const list = this.days();
    if (!list || list.length === 0) {
      return [];
    }

    const firstDate = new Date(list[0].date);
    // 0 is Sunday, 1 is Monday. Convert so Monday is 0
    const startDow = (firstDate.getDay() + 6) % 7;

    const padded: (HeatmapDay | null)[] = [
      ...Array(startDow).fill(null),
      ...list,
    ];

    const result: (HeatmapDay | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      result.push(padded.slice(i, i + 7));
    }
    return result;
  });

  readonly svgWidth = computed(() => {
    const w = this.weeks().length;
    return w * (this.CELL_SIZE + this.GAP) + 30;
  });

  readonly svgHeight = computed(() => {
    return 7 * (this.CELL_SIZE + this.GAP) + 20;
  });

  colorForCount(count: number): string {
    if (count <= 0) {
      return 'var(--surface-2, rgba(0,0,0,0.06))';
    }
    if (count <= 2) {
      return '#a7f3d0';
    }
    if (count <= 5) {
      return '#34d399';
    }
    if (count <= 9) {
      return '#10b981';
    }
    return '#047857';
  }
}
