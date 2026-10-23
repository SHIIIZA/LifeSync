import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButton,
  IonInput,
  IonItem,
  IonModal,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { FirestoreDataService } from '../data/firestore-data.service';
import { StudyBlock } from '../models/lifesync.models';
import { sanitizeText } from '../shared/sanitize';
import { HeaderActionsComponent } from '../shared/header-actions.component';
import { ErrorBannerComponent } from '../shared/error-banner.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButton,
    IonInput,
    IonItem,
    IonModal,
    IonSelect,
    IonSelectOption,
    HeaderActionsComponent,
    ErrorBannerComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './planner.page.html',
  styleUrl: './planner.page.scss',
})
export class PlannerPage {
  private readonly wheelRowHeight = 48;
  private readonly wheelRepeatCount = 5;

  readonly hourOptions = Array.from({ length: 12 * this.wheelRepeatCount }, (_, index) => ({
    index,
    value: (index % 12) + 1,
  }));
  readonly minuteOptions = Array.from({ length: 60 * this.wheelRepeatCount }, (_, index) => ({
    index,
    value: index % 60,
  }));
  readonly periodOptions = Array.from({ length: 2 * this.wheelRepeatCount }, (_, index) => ({
    index,
    value: index % 2 === 0 ? 'AM' : 'PM',
  }));
  readonly weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  form = this.fb.group({
    course: ['', [Validators.required, Validators.pattern(/\S/), Validators.minLength(2), Validators.maxLength(80)]],
    scheduledAt: ['', [Validators.required]],
    durationMin: ['', [Validators.required, Validators.pattern(/^\d{1,4}$/), Validators.min(1), Validators.max(1440)]],
    priority: ['soon' as StudyBlock['priority'], [Validators.required]],
  });

  editingId: string | null = null;
  dateTimeOpen = false;
  pickerValue = this.toLocalDateTimeValue(new Date());
  selectedDate = this.startOfDay(new Date());
  visibleMonth = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
  activeHourIndex = 24 + 11;
  activeMinuteIndex = 120;
  activePeriodIndex = 10;

  @ViewChild('hourWheel') private hourWheel?: ElementRef<HTMLDivElement>;
  @ViewChild('minuteWheel') private minuteWheel?: ElementRef<HTMLDivElement>;
  @ViewChild('periodWheel') private periodWheel?: ElementRef<HTMLDivElement>;

  constructor(
    public data: FirestoreDataService,
    private fb: FormBuilder,
  ) {}

  byPriority(priority: StudyBlock['priority']) {
    return this.data.studyBlocks().filter((b) => b.priority === priority);
  }

  editBlock(block: StudyBlock) {
    this.editingId = block.id;
    this.form.reset({
      course: block.course,
      scheduledAt: this.toPickerValue(block),
      durationMin: String(block.durationMin),
      priority: block.priority,
    });
  }

  cancelEdit() {
    this.editingId = null;
    this.form.reset({ course: '', scheduledAt: '', durationMin: '', priority: 'soon' });
    this.dateTimeOpen = false;
  }

  openDateTimePicker() {
    this.pickerValue = this.form.controls.scheduledAt.value || this.toLocalDateTimeValue(new Date());
    const selected = new Date(this.pickerValue);
    if (!Number.isNaN(selected.getTime())) {
      this.selectedDate = this.startOfDay(selected);
      this.visibleMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
      const hour = selected.getHours();
      const hour12 = hour % 12 || 12;
      this.activeHourIndex = 24 + hour12 - 1;
      this.activeMinuteIndex = 120 + selected.getMinutes();
      this.activePeriodIndex = 10 + (hour >= 12 ? 1 : 0);
    }
    this.dateTimeOpen = true;
  }

  initializeWheelPositions() {
    this.hourWheel?.nativeElement.scrollTo({ top: this.activeHourIndex * this.wheelRowHeight });
    this.minuteWheel?.nativeElement.scrollTo({ top: this.activeMinuteIndex * this.wheelRowHeight });
    this.periodWheel?.nativeElement.scrollTo({ top: this.activePeriodIndex * this.wheelRowHeight });
  }

  onWheelScroll(kind: 'hour' | 'minute' | 'period', event: Event) {
    const wheel = event.currentTarget as HTMLDivElement;
    const count = kind === 'hour' ? 12 : kind === 'minute' ? 60 : 2;
    const rawIndex = Math.round(wheel.scrollTop / this.wheelRowHeight);
    let index = rawIndex;

    if (rawIndex < count || rawIndex >= count * (this.wheelRepeatCount - 1)) {
      index = (rawIndex % count) + count * 2;
      wheel.scrollTop = index * this.wheelRowHeight;
    }

    if (kind === 'hour') this.activeHourIndex = index;
    if (kind === 'minute') this.activeMinuteIndex = index;
    if (kind === 'period') this.activePeriodIndex = index;
    this.updatePickerValue();
  }

  selectWheelValue(kind: 'hour' | 'minute' | 'period', value: number | string) {
    if (kind === 'hour' && typeof value === 'number') this.activeHourIndex = 24 + value - 1;
    if (kind === 'minute' && typeof value === 'number') this.activeMinuteIndex = 120 + value;
    if (kind === 'period' && typeof value === 'string') this.activePeriodIndex = 10 + (value === 'PM' ? 1 : 0);
    this.initializeWheelPositions();
    this.updatePickerValue();
  }

  previousMonth() {
    this.visibleMonth = new Date(this.visibleMonth.getFullYear(), this.visibleMonth.getMonth() - 1, 1);
  }

  nextMonth() {
    this.visibleMonth = new Date(this.visibleMonth.getFullYear(), this.visibleMonth.getMonth() + 1, 1);
  }

  calendarDays() {
    const first = new Date(this.visibleMonth.getFullYear(), this.visibleMonth.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }

  selectDate(date: Date) {
    this.selectedDate = this.startOfDay(date);
    this.updatePickerValue();
  }

  isSelectedDate(date: Date) {
    return this.toISODate(date) === this.toISODate(this.selectedDate);
  }

  isVisibleMonth(date: Date) {
    return date.getMonth() === this.visibleMonth.getMonth();
  }

  monthLabel() {
    return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(this.visibleMonth);
  }

  selectedDateLabel() {
    const today = this.startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const prefix = this.toISODate(this.selectedDate) === this.toISODate(today)
      ? 'Today'
      : this.toISODate(this.selectedDate) === this.toISODate(tomorrow)
        ? 'Tomorrow'
        : this.selectedDate.toLocaleDateString(undefined, { weekday: 'short' });
    return `${prefix} · ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(this.selectedDate)}`;
  }

  saveDateTime() {
    this.updatePickerValue();
    this.form.controls.scheduledAt.setValue(this.pickerValue);
    this.form.controls.scheduledAt.markAsTouched();
    this.dateTimeOpen = false;
  }

  dateTimeLabel(value: string | null) {
    if (!value) return 'Choose date and time';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Choose date and time';
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  formatBlockDate(value: string) {
    const date = new Date(`${value}T00:00:00`);
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  async addBlock() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { course, scheduledAt, durationMin, priority } = this.form.getRawValue();
    const dateTime = new Date(scheduledAt!);
    const date = this.toISODate(dateTime);
    const time = this.toDisplayTime(dateTime);

    if (this.editingId) {
      await this.data.updateStudyBlock(this.editingId, {
        course: sanitizeText(course!),
        time,
        date,
        durationMin: parseInt(durationMin!, 10),
        priority: priority!,
      });
      this.editingId = null;
    } else {
      await this.data.addStudyBlock({
        course: sanitizeText(course!),
        time,
        date,
        durationMin: parseInt(durationMin!, 10),
        priority: priority!,
      });
    }
    this.form.reset({ course: '', scheduledAt: '', durationMin: '', priority: 'soon' });
  }

  remove(id: string) {
    this.data.deleteStudyBlock(id);
  }

  private toPickerValue(block: StudyBlock) {
    const date = block.date ? new Date(`${block.date}T00:00:00`) : new Date();
    const match = block.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hours = Number(match[1]) % 12;
      if (match[3].toUpperCase() === 'PM') hours += 12;
      date.setHours(hours, Number(match[2]), 0, 0);
    }
    if (!block.date && /^tomorrow,/i.test(block.time)) {
      date.setDate(date.getDate() + 1);
    }
    return this.toLocalDateTimeValue(date);
  }

  private toLocalDateTimeValue(date: Date) {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
  }

  private toISODate(date: Date) {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  private toDisplayTime(date: Date) {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  private updatePickerValue() {
    const hour12 = (this.activeHourIndex % 12) + 1;
    const minute = this.activeMinuteIndex % 60;
    const isPm = this.activePeriodIndex % 2 === 1;
    const hour24 = (hour12 % 12) + (isPm ? 12 : 0);
    const date = new Date(this.selectedDate);
    date.setHours(hour24, minute, 0, 0);
    this.pickerValue = this.toLocalDateTimeValue(date);
  }

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
