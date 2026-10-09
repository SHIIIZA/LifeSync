import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

// Lightweight SVG bar chart — no external library needed.
@Component({
  selector: 'app-svg-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="svg-chart">
      @if (data.length === 0) {
        <p class="chart-empty">{{ emptyMessage }}</p>
      } @else {
        <div class="chart-bars">
          @for (point of data; track point.label) {
            <div class="chart-col">
              <div class="chart-bar-wrapper">
                <div
                  class="chart-bar"
                  [style.height.%]="heightPct(point.value)"
                  [style.background]="point.color || 'var(--ls-moss)'"
                >
                  <span class="chart-value">{{ point.value }}</span>
                </div>
              </div>
              <span class="chart-label">{{ point.label }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .svg-chart { width: 100%; }
    .chart-empty {
      text-align: center;
      color: var(--ls-ink-60);
      font-size: 13px;
      padding: 20px 0;
      margin: 0;
    }
    .chart-bars {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      height: 160px;
      padding-top: 20px;
    }
    .chart-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
    }
    .chart-bar-wrapper {
      flex: 1;
      width: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .chart-bar {
      width: 70%;
      max-width: 40px;
      border-radius: 6px 6px 0 0;
      min-height: 4px;
      position: relative;
      transition: height 0.3s ease;
    }
    .chart-value {
      position: absolute;
      top: -18px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 11px;
      font-weight: 600;
      color: var(--ls-ink-60);
    }
    .chart-label {
      font-size: 11px;
      color: var(--ls-ink-60);
      margin-top: 6px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
  `],
})
export class SvgChartComponent implements OnChanges {
  @Input() data: ChartDataPoint[] = [];
  @Input() emptyMessage = 'No data to display.';
  @Input() maxValue?: number;

  ngOnChanges() {
    // Clamp values for display
    if (this.data.length) {
      const max = this.maxValue ?? Math.max(...this.data.map((d) => d.value), 1);
      this.data = this.data.map((d) => ({
        ...d,
        value: Math.min(d.value, max),
      }));
    }
  }

  heightPct(value: number): number {
    if (!this.data.length) return 0;
    const max = this.maxValue ?? Math.max(...this.data.map((d) => d.value), 1);
    return Math.max(2, Math.round((value / max) * 100));
  }
}
