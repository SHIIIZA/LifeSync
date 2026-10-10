import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';
import { FirestoreDataService } from '../data/firestore-data.service';
import { XmlReportService } from '../data/xml-report.service';
import { SvgChartComponent, ChartDataPoint } from '../shared/svg-chart.component';
import { ErrorBannerComponent } from '../shared/error-banner.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import { ThemeToggleComponent } from '../shared/theme-toggle.component';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    SvgChartComponent,
    ErrorBannerComponent,
    LoadingSpinnerComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './insights.page.html',
  styleUrl: './insights.page.scss',
})
export class InsightsPage {
  importStatus = '';

  // Derived, real insights from the current data (no hardcoded copy).
  notes = computed(() => {
    const out: string[] = [];
    if (!this.hasSourceData()) return out;

    const cats = this.data.budgetCategories();
    const over = cats.filter((c) => c.spent / Math.max(1, c.limit) >= 0.85);
    if (over.length) {
      out.push(
        `${over.map((c) => c.name).join(', ')} ${over.length === 1 ? 'is' : 'are'} at 85%+ of ${over.length === 1 ? 'its' : 'their'} monthly limit — ease off there or raise the limit.`,
      );
    }

    const urgent = this.data.studyBlocks().filter((b) => b.priority === 'urgent');
    const totalMin = this.data.studyBlocks().reduce((s, b) => s + b.durationMin, 0);
    if (urgent.length) {
      out.push(`${urgent.length} urgent study block(s) on the board, ${totalMin} min planned in total.`);
    } else if (this.data.studyBlocks().length) {
      out.push(`Nothing marked urgent — ${totalMin} min of study planned overall.`);
    }

    const best = [...this.data.habits()].sort((a, b) => b.streakDays - a.streakDays)[0];
    if (best && best.streakDays > 0) {
      out.push(`${best.name} has your longest streak at ${best.streakDays} day(s) — keep it alive.`);
    }

    const pct = this.data.routineProgress();
    if (this.data.routine().length) {
      out.push(
        pct >= 100
          ? 'Every routine item for today is done — great day.'
          : `Today's routine is ${pct}% complete (${this.data.routine().filter((r) => r.done).length}/${this.data.routine().length} items).`,
      );
    }

    const mealsCount = this.data.meals().length;
    out.push(
      mealsCount
        ? `${mealsCount} meal(s) planned this week.`
        : 'No meals planned yet — add some on the Meals tab to generate a grocery list.',
    );

    return out;
  });

  hasSourceData = computed(() =>
    this.data.budgetCategories().length > 0 ||
    this.data.studyBlocks().length > 0 ||
    this.data.habits().length > 0 ||
    this.data.routine().length > 0 ||
    this.data.meals().length > 0 ||
    this.data.expenses().length > 0 ||
    this.data.groceries().length > 0,
  );

  constructor(
    public data: FirestoreDataService,
    private xmlReports: XmlReportService,
    private location: Location,
  ) {
    addIcons({ chevronBackOutline });
  }

  pctOf(spent: number, limit: number) {
    return Math.min(100, Math.round((spent / Math.max(1, limit)) * 100));
  }

  streakPct(days: number) {
    return Math.min(100, Math.round((days / 30) * 100));
  }

  longestStreak(): number {
    const habits = this.data.habits();
    if (!habits.length) return 0;
    return Math.max(...habits.map((h) => h.streakDays));
  }

  // Chart data for budget usage
  budgetChartData = computed<ChartDataPoint[]>(() => {
    return this.data.budgetCategories().map((c) => ({
      label: c.name,
      value: this.pctOf(c.spent, c.limit),
      color: c.spent / Math.max(1, c.limit) >= 0.85 ? 'var(--ls-alert)' : 'var(--ls-moss)',
    }));
  });

  // Chart data for habit streaks
  habitChartData = computed<ChartDataPoint[]>(() => {
    return this.data.habits().map((h) => ({
      label: h.name,
      value: h.streakDays,
      color: 'var(--ls-sky)',
    }));
  });

  // Chart data for study blocks by priority
  studyChartData = computed<ChartDataPoint[]>(() => {
    const blocks = this.data.studyBlocks();
    const urgent = blocks.filter((b) => b.priority === 'urgent').length;
    const soon = blocks.filter((b) => b.priority === 'soon').length;
    const later = blocks.filter((b) => b.priority === 'later').length;
    return [
      { label: 'Urgent', value: urgent, color: 'var(--ls-alert)' },
      { label: 'Soon', value: soon, color: 'var(--ls-clay)' },
      { label: 'Later', value: later, color: 'var(--ls-moss)' },
    ].filter((d) => d.value > 0);
  });

  back() {
    this.location.back();
  }

  async onImportFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const items = this.xmlReports.parseRoutineXml(text);
      for (const item of items) await this.data.addRoutineItem(item);
      this.importStatus = `Imported ${items.length} routine item(s).`;
    } catch (e: any) {
      this.importStatus = e?.message ?? 'Import failed.';
    } finally {
      input.value = '';
    }
  }

  exportReport() {
    const xml = this.xmlReports.buildExpenseXml(this.data.expenses());
    const html = this.xmlReports.transformExpenseXmlToHtml(xml);
    const blob = new Blob([html], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  }
}
