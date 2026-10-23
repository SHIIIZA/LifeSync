import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AuthService } from '../auth/auth.service';
import { ThemeToggleComponent } from '../shared/theme-toggle.component';
import { SupportRequestService, SupportRequest } from './support-request.service';

const SUPPORT_EMAIL = 'ianlancemgeronimo@gmail.com';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonTitle,
    IonToolbar,
    ThemeToggleComponent,
  ],
  templateUrl: './contact.page.html',
  styleUrl: './contact.page.scss',
})
export class ContactPage {
  readonly supportEmail = SUPPORT_EMAIL;
  readonly form = this.formBuilder.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.minLength(2),
        Validators.maxLength(80),
      ],
    ],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    topic: ['', Validators.required],
    reference: ['', Validators.maxLength(40)],
    message: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.minLength(12),
        Validators.maxLength(3000),
      ],
    ],
  });

  submitting = false;
  submitted = false;
  requestId: string | null = null;
  emailDraftUrl: string | null = null;
  statusMessage = '';
  statusType: 'success' | 'error' | 'info' = 'info';

  constructor(
    private formBuilder: FormBuilder,
    private supportRequestService: SupportRequestService,
    auth: AuthService,
  ) {
    addIcons({ arrowBackOutline });
    this.form.patchValue({
      name: auth.displayName() ?? '',
      email: auth.email() ?? '',
    });
    this.form.valueChanges.subscribe(() => {
      if (!this.submitting) {
        this.requestId = null;
        this.emailDraftUrl = null;
        this.statusMessage = '';
      }
    });
  }

  hasError(field: keyof ContactPage['form']['controls']): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted);
  }

  errorFor(field: keyof ContactPage['form']['controls']): string {
    const errors = this.form.controls[field].errors;
    if (!errors) return '';
    if (errors['required']) return 'This field is required.';
    if (errors['email']) return 'Enter a valid email address.';
    if (errors['pattern']) return 'This field cannot contain only spaces.';
    if (errors['minlength']) {
      return field === 'message'
        ? 'Please include at least 12 characters so we can understand the issue.'
        : 'Please enter at least 2 characters.';
    }
    if (errors['maxlength']) return 'This field is too long.';
    return 'Please check this field.';
  }

  async submit(): Promise<void> {
    this.submitted = true;
    this.statusMessage = '';
    this.emailDraftUrl = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.statusType = 'error';
      this.statusMessage = 'Please review the highlighted fields and try again.';
      return;
    }

    const values = this.form.getRawValue();
    const request: SupportRequest = {
      requestId: this.requestId ?? crypto.randomUUID(),
      name: values.name.trim(),
      email: values.email.trim(),
      topic: values.topic,
      reference: values.reference.trim(),
      message: values.message.trim(),
    };
    this.requestId = request.requestId;
    this.submitting = true;
    this.form.disable({ emitEvent: false });
    let emailDraftUrl: string | null = null;

    try {
      const result = await this.supportRequestService.save(request);
      if (!result.accepted) {
        throw new Error('The support request was not saved.');
      }
      this.statusType = 'success';
      this.statusMessage = 'Message received. Please be patient while we prepare our response.';
      this.emailDraftUrl = this.createEmailDraftUrl(request);
      emailDraftUrl = this.emailDraftUrl;
      this.form.reset({ name: '', email: '', topic: '', reference: '', message: '' });
      this.requestId = null;
      this.submitted = false;
    } catch (error: unknown) {
      this.statusType = 'error';
      this.statusMessage = this.sendErrorMessage(error);
    } finally {
      this.form.enable({ emitEvent: false });
      this.submitting = false;
    }

    if (emailDraftUrl) {
      window.location.href = emailDraftUrl;
    }
  }

  private createEmailDraftUrl(request: SupportRequest): string {
    const subject = `LifeSync support: ${request.topic}`;
    const body = [
      `Name: ${request.name}`,
      `Reply email: ${request.email}`,
      `Topic: ${request.topic}`,
      `Reference: ${request.reference || 'Not provided'}`,
      '',
      request.message,
    ].join('\n');

    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  private sendErrorMessage(error: unknown): string {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined;
    if (code === 'permission-denied') {
      return 'The support database did not allow this message. Please try again later or email ' +
        SUPPORT_EMAIL +
        ' directly.';
    }
    if (code === 'unavailable' || code === 'deadline-exceeded') {
      return 'We could not confirm that your message was saved. Your form is still here; retrying the unchanged message will not create a duplicate.';
    }
    return 'Unable to save your message right now. Your form is still here. Check your connection and try again, or email ' +
      SUPPORT_EMAIL +
      ' directly.';
  }
}
