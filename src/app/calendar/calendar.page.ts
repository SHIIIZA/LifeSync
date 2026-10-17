import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonModal,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTitle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  chevronForwardOutline,
  calendarOutline,
  createOutline,
  trashOutline,
} from 'ionicons/icons';
import { FirestoreDataService } from '../data/firestore-data.service';
import { StudyBlock } from '../models/lifesync.models';
import { sanitizeText } from '../shared/sanitize';
import { isValidStudyBlockDraft } from '../shared/validation';
import { ErrorBannerComponent } from '../shared/error-banner.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import { ThemeToggleComponent } from '../shared/theme-toggle.component';

// Weekly calendar/schedule view of study blocks. Supports arbitrary dates
// via the `date` field on StudyBlock, plus "Today, ..." / "Tomorrow, ..." strings.
@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonModal,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTitle,
    ErrorBannerComponent,
    LoadingSpinnerComponent,
    ThemeToggleComponent,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" (click)="back()">
            <ion-icon name="chevron-back-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <app-theme-toggle slot="end"></app-theme-toggle>
        <p class="ls-eyebrow">Schedule</p>
        <h1 class="ls-display page-title">Calendar</h1>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" [scrollY]="true">
      <!-- Week navigation -->
      <div class="week-nav">
        <ion-button fill="clear" size="small" (click)="prevWeek()">
          <ion-icon name="chevron-back-outline" slot="icon-only"></ion-icon>
        </ion-button>
        <div class="week-label">
          <p class="week-range">{{ weekRangeLabel() }}</p>
          <ion-button fill="clear" size="small" (click)="goToToday()">Today</ion-button>
        </div>
        <ion-button fill="clear" size="small" (click)="nextWeek()">
          <ion-icon name="chevron-forward-outline" slot="icon-only"></ion-icon>
        </ion-button>
      </div>

      @if (data.loading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else if (data.lastError()) {
        <app-error-banner [message]="data.lastError()!" (onRetry)="data.retryConnection()"></app-error-banner>
      } @else if (data.studyBlocks().length === 0) {
        <div class="ls-empty ls-card">
          <ion-icon name="calendar-outline" class="ls-empty-icon"></ion-icon>
          <p class="ls-empty-title">No study blocks yet</p>
          <p class="ls-empty-hint">Add a block in Planner to see your schedule here.</p>
        </div>
      } @else {
      <!-- Day list -->
      <div class="week-list ls-card" style="padding:0">
        @for (d of days; track d.label) {
          <div class="day-row" [class.today]="d.isToday">
            <div class="day-label">
              <p>{{ dayName(d) }}</p>
              <span>{{ d.date.getDate() }}</span>
            </div>
            <div class="day-body">
              @if (blocksFor(d).length === 0) {
                <p class="day-empty">No blocks</p>
              }
              @for (b of blocksFor(d); track b.id) {
                <div class="cal-block" [class]="b.priority" (click)="openEdit(b)">
                  <div class="cal-block-info">
                    <p>{{ b.course }}</p>
                    <span>{{ timePart(b.time) }} · {{ b.durationMin }}m</span>
                  </div>
                  <ion-icon name="create-outline" class="cal-edit-icon"></ion-icon>
                </div>
              }
            </div>
          </div>
        }
      </div>

      @if (unscheduled().length) {
        <div class="ls-section-title"><h2>Unscheduled</h2></div>
        <div class="ls-card">
          @for (b of unscheduled(); track b.id) {
            <p class="unscheduled-item">{{ b.course }} — {{ b.time }}</p>
          }
        </div>
      }
      }

      <!-- Edit modal -->
      <ion-modal [isOpen]="editingBlock()" (didDismiss)="closeEdit()">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Edit study block</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeEdit()">Close</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding" [scrollY]="true">
            @if (editingBlock()) {
              <ion-item>
                <ion-input label="Course" labelPlacement="floating" [(ngModel)]="editForm.course"></ion-input>
              </ion-item>
              <ion-item>
                <ion-input label="Time" labelPlacement="floating" [(ngModel)]="editForm.time"></ion-input>
              </ion-item>
              <ion-item>
                <ion-input label="Duration (min)" labelPlacement="floating" type="number" [(ngModel)]="editForm.durationMin"></ion-input>
              </ion-item>
              <ion-item>
                <ion-select label="Priority" labelPlacement="floating" [(ngModel)]="editForm.priority">
                  <ion-select-option value="urgent">Urgent</ion-select-option>
                  <ion-select-option value="soon">Soon</ion-select-option>
                  <ion-select-option value="later">Later</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-input label="Date (YYYY-MM-DD, optional)" labelPlacement="floating" [(ngModel)]="editForm.date"></ion-input>
              </ion-item>
              @if (editError) {
                <p class="form-error" role="alert">{{ editError }}</p>
              }
              <ion-button expand="block" shape="round" (click)="saveEdit()">Save changes</ion-button>
              <ion-button expand="block" fill="clear" color="danger" shape="round" (click)="deleteBlock()">
                <ion-icon name="trash-outline" slot="start"></ion-icon>
                Delete block
              </ion-button>
            }
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    .page-title { padding: 6px 8px 10px; font-size: 24px; margin: 0; }
    .week-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .week-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .week-range {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
    }
    .week-list { border-radius: var(--ls-radius-md); overflow: hidden; }
    .day-row {
      display: flex;
      gap: 12px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--ls-line);
      min-height: 64px;
    }
    .day-row:last-child { border-bottom: none; }
    .day-row.today { background: var(--ls-moss-tint); }
    .day-label {
      flex: 0 0 64px;
      border-right: 1px solid var(--ls-line);
      padding-right: 10px;
      p { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; }
      span { font-size: 11px; color: var(--ls-ink-60); }
    }
    .day-body { flex: 1; }
    .day-empty { margin: 4px 0; color: var(--ls-ink-60); font-size: 12px; }
    .cal-block {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-left: 3px solid var(--ls-sky);
      background: var(--ls-paper);
      border-radius: 8px;
      padding: 6px 8px;
      margin-bottom: 6px;
      cursor: pointer;
      p { margin: 0; font-size: 12px; font-weight: 500; }
      span { font-size: 11px; color: var(--ls-ink-60); }
      &.urgent { border-left-color: var(--ls-alert); }
      &.soon { border-left-color: var(--ls-clay); }
      &.later { border-left-color: var(--ls-moss); }
    }
    .cal-block-info { flex: 1; }
    .cal-edit-icon { font-size: 14px; color: var(--ls-ink-60); opacity: 0.5; }
    .unscheduled-item { margin: 4px 0; font-size: 13px; }
    .form-error { margin: 8px 0; font-size: 13px; color: var(--ls-alert); }
  `],
})
export class CalendarPage {
  days: Array<{ label: string; isToday: boolean; date: Date }> = [];
  weekOffset = signal(0);
  editingBlock = signal<StudyBlock | null>(null);
  editForm = {
    course: '',
    time: '',
    durationMin: 0,
    priority: 'soon' as StudyBlock['priority'],
    date: '',
  };
  editError = '';

  constructor(
    public data: FirestoreDataService,
    private location: Location,
  ) {
    addIcons({ chevronBackOutline, chevronForwardOutline, calendarOutline, createOutline, trashOutline });
    this.buildWeek();
  }

  back() {
    this.location.back();
  }

  weekRangeLabel(): string {
    const week = this.getWeekDates();
    const start = week[0];
    const end = week[6];
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  }

  prevWeek() {
    this.weekOffset.update((v) => v - 1);
    this.buildWeek();
  }

  nextWeek() {
    this.weekOffset.update((v) => v + 1);
    this.buildWeek();
  }

  goToToday() {
    this.weekOffset.set(0);
    this.buildWeek();
  }

  timePart(time: string) {
    const m = time.match(/,\s*(.+)$/);
    return m ? m[1] : time;
  }

  dayName(d: { date: Date }) {
    return d.date.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
  }

  private getWeekDates(): Date[] {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + this.weekOffset() * 7);
    monday.setHours(0, 0, 0, 0);

    const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return names.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }

  private buildWeek() {
    const now = new Date();
    const weekDates = this.getWeekDates();
    const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    this.days = weekDates.map((d, i) => ({
      label: `${names[i]} ${d.getDate()}`,
      isToday: d.toDateString() === now.toDateString(),
      date: d,
    }));
  }

  blocksFor(day: { isToday: boolean; date: Date }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayStr = this.toISODate(day.date);
    const todayStr = this.toISODate(today);
    const tomorrowStr = this.toISODate(tomorrow);

    return this.data.studyBlocks().filter((b) => {
      // Match by explicit date field
      if (b.date) {
        return b.date === dayStr;
      }
      // Match by "Today, ..." / "Tomorrow, ..." prefix
      const t = b.time.trim();
      if (day.isToday && /^today,/i.test(t)) return true;
      if (day.date.toDateString() === tomorrow.toDateString() && /^tomorrow,/i.test(t)) return true;
      return false;
    });
  }

  unscheduled() {
    return this.data.studyBlocks().filter((b) => {
      if (b.date) return false;
      return !/^(today|tomorrow),/i.test(b.time.trim());
    });
  }

  openEdit(block: StudyBlock) {
    this.editingBlock.set(block);
    this.editError = '';
    this.editForm = {
      course: block.course,
      time: block.time,
      durationMin: block.durationMin,
      priority: block.priority,
      date: block.date ?? '',
    };
  }

  closeEdit() {
    this.editingBlock.set(null);
    this.editError = '';
  }

  async saveEdit() {
    const block = this.editingBlock();
    if (!block) return;
    const course = sanitizeText(this.editForm.course);
    const time = sanitizeText(this.editForm.time);
    const durationMin = Number(this.editForm.durationMin);
    const date = this.editForm.date.trim();
    const draft = { ...this.editForm, course, time, durationMin, date };
    if (!isValidStudyBlockDraft(draft)) {
      this.editError = 'Check the course, time, duration (1–1440 minutes), priority, and date.';
      return;
    }
    await this.data.updateStudyBlock(block.id, {
      course,
      time,
      durationMin,
      priority: this.editForm.priority,
      date: date || undefined,
    });
    this.closeEdit();
  }

  async deleteBlock() {
    const block = this.editingBlock();
    if (!block) return;
    await this.data.deleteStudyBlock(block.id);
    this.closeEdit();
  }

  private toISODate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
