import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonSelect,
  IonSelectOption,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pulseOutline } from 'ionicons/icons';
import { FirestoreDataService } from '../data/firestore-data.service';
import { ToastController } from '@ionic/angular/standalone';
import { sanitizeText } from '../shared/sanitize';
import { HeaderActionsComponent } from '../shared/header-actions.component';
import { ErrorBannerComponent } from '../shared/error-banner.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';

@Component({
  selector: 'app-habits',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButton,
    IonInput,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonIcon,
    HeaderActionsComponent,
    ErrorBannerComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './habits.page.html',
  styleUrl: './habits.page.scss',
})
export class HabitsPage {
  form = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.minLength(2), Validators.maxLength(40)]],
    target: ['', [Validators.required, Validators.pattern(/^\d{1,4}$/), Validators.min(1)]],
    unit: ['glasses', [Validators.required]],
  });

  editingId: string | null = null;

  constructor(
    public data: FirestoreDataService,
    private fb: FormBuilder,
    private toast: ToastController,
  ) {
    addIcons({ pulseOutline });
  }

  edit(h: { id: string; name: string; target: number; unit: string }) {
    this.editingId = h.id;
    this.form.reset({ name: h.name, target: String(h.target), unit: h.unit });
  }

  cancelEdit() {
    this.editingId = null;
    this.form.reset({ name: '', target: '', unit: 'glasses' });
  }

  async log(id: string) {
    const habit = this.data.habits().find((h) => h.id === id);
    if (!habit) return;
    const step = habit.unit === 'min' ? 5 : 1;
    const newProgress = Math.min(habit.target, habit.progress + step);
    await this.data.logHabitProgress(id, step);
    if (newProgress >= habit.target && habit.progress < habit.target) {
      const t = await this.toast.create({
        message: `${habit.name} goal met for today — streak kept alive!`,
        duration: 3000,
        color: 'success',
      });
      await t.present();
    }
  }

  pct(progress: number, target: number) {
    return Math.min(100, Math.round((progress / target) * 100));
  }

  async add() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, target, unit } = this.form.getRawValue();

    if (this.editingId) {
      // Update existing habit
      await this.data.updateHabit(this.editingId, {
        name: sanitizeText(name!),
        target: parseInt(target!, 10),
        unit: unit!,
      });
      this.editingId = null;
    } else {
      // Add new habit
      await this.data.addHabit({
        name: sanitizeText(name!),
        streakDays: 0,
        target: parseInt(target!, 10),
        progress: 0,
        unit: unit!,
      });
    }
    this.form.reset({ name: '', target: '', unit: 'glasses' });
  }

  remove(id: string) {
    this.data.deleteHabit(id);
  }
}
