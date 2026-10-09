import { Component } from '@angular/core';
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
  form = this.fb.group({
    course: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    time: ['', [Validators.required, Validators.pattern(/^(Today|Tomorrow), .+/i)]],
    durationMin: ['', [Validators.required, Validators.pattern(/^\d{1,3}$/)]],
    priority: ['soon' as StudyBlock['priority'], [Validators.required]],
  });

  editingId: string | null = null;

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
      time: block.time,
      durationMin: String(block.durationMin),
      priority: block.priority,
    });
  }

  cancelEdit() {
    this.editingId = null;
    this.form.reset({ course: '', time: '', durationMin: '', priority: 'soon' });
  }

  async addBlock() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { course, time, durationMin, priority } = this.form.getRawValue();

    if (this.editingId) {
      await this.data.updateStudyBlock(this.editingId, {
        course: sanitizeText(course!),
        time: sanitizeText(time!),
        durationMin: parseInt(durationMin!, 10),
        priority: priority!,
      });
      this.editingId = null;
    } else {
      await this.data.addStudyBlock({
        course: sanitizeText(course!),
        time: sanitizeText(time!),
        durationMin: parseInt(durationMin!, 10),
        priority: priority!,
      });
    }
    this.form.reset({ course: '', time: '', durationMin: '', priority: 'soon' });
  }

  remove(id: string) {
    this.data.deleteStudyBlock(id);
  }
}
