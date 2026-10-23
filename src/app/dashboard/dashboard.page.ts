import { Component, OnInit } from '@angular/core';
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
  IonButtons,
  IonButton,
  IonIcon,
  IonCheckbox,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  statsChartOutline,
  medicalOutline,
  bookOutline,
  homeOutline,
  personOutline,
  checkmarkCircle,
} from 'ionicons/icons';
import { FirestoreDataService } from '../data/firestore-data.service';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../notifications/notification.service';
import { ApiService } from '../api/api.service';
import { HeaderActionsComponent } from '../shared/header-actions.component';
import { ErrorBannerComponent } from '../shared/error-banner.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import { RoutineCategory } from '../models/lifesync.models';
import { sanitizeText } from '../shared/sanitize';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonCheckbox,
    IonInput,
    IonItem,
    IonSelect,
    IonSelectOption,
    HeaderActionsComponent,
    ErrorBannerComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage implements OnInit {
  private readonly categoryIcon: Record<RoutineCategory, string> = {
    medication: 'medical-outline',
    study: 'book-outline',
    chore: 'home-outline',
    personal: 'person-outline',
  };

  private readonly categoryAccent: Record<RoutineCategory, string> = {
    medication: 'accent-alert',
    study: 'accent-sky',
    chore: 'accent-moss',
    personal: 'accent-clay',
  };

  form = this.fb.group({
    title: ['', [Validators.required, Validators.pattern(/\S/), Validators.minLength(2), Validators.maxLength(80)]],
    time: ['', [Validators.required, Validators.pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/)]],
    category: ['personal' as RoutineCategory, [Validators.required]],
    recurring: ['none' as 'none' | 'daily' | 'weekly', [Validators.required]],
  });

  reminderStatus = '';

  ngOnInit() {
    this.api.loadDailyQuote();
  }

  constructor(
    public data: FirestoreDataService,
    public auth: AuthService,
    public api: ApiService,
    private notifications: NotificationService,
    private fb: FormBuilder,
  ) {
    addIcons({
      statsChartOutline,
      medicalOutline,
      bookOutline,
      homeOutline,
      personOutline,
      checkmarkCircle,
    });
  }

  iconFor(category: RoutineCategory) {
    return this.categoryIcon[category];
  }

  accentFor(category: RoutineCategory) {
    return this.categoryAccent[category];
  }

  toggle(id: string) {
    const item = this.data.routine().find((i) => i.id === id);
    if (item?.requiresConfirmation && !item.done) {
      const ok = window.confirm(`Confirm: ${item.title}?`);
      if (!ok) return;
    }
    this.data.toggleRoutineItem(id);
  }

  async addItem() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { title, time, category, recurring } = this.form.getRawValue();
    await this.data.addRoutineItem({
      title: sanitizeText(title!),
      time: this.formatRoutineTime(time!),
      category: category!,
      done: false,
      recurring: recurring!,
      requiresConfirmation: category === 'medication',
    });
    this.form.reset({ title: '', time: '', category: 'personal', recurring: 'none' });
  }

  private formatRoutineTime(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  async enableReminders() {
    const granted = await this.notifications.requestPermission();
    if (!granted) {
      this.reminderStatus = 'Notification permission denied.';
      return;
    }
    const count = await this.notifications.scheduleMedicationReminders(this.data.routine());
    this.reminderStatus = count
      ? `Scheduled ${count} medication reminder(s).`
      : 'No medication items to schedule.';
  }
}
