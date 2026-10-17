import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButton,
  IonInput,
  IonItem,
  IonList,
  IonText,
  IonSpinner,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { AuthService } from '../auth/auth.service';
import { ThemeToggleComponent } from '../shared/theme-toggle.component';
import { sanitizeText } from '../shared/sanitize';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButton,
    IonInput,
    IonItem,
    IonList,
    IonText,
    IonSpinner,
    IonIcon,
    ThemeToggleComponent,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <app-theme-toggle slot="end"></app-theme-toggle>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="login-shell">
        <div class="login-module">
          <div class="brand-badge">
            <img src="assets/lifesync-logo.png" alt="LifeSync logo" />
          </div>

          <h1 class="ls-display">{{ mode === 'login' ? 'Welcome back' : 'Create account' }}</h1>

          <ion-list>
            @if (mode === 'signup') {
              <ion-item>
                <ion-input
                  label="Username"
                  labelPlacement="floating"
                  type="text"
                  [(ngModel)]="username"
                  autocomplete="username"
                  [disabled]="loading"
                ></ion-input>
              </ion-item>
            }
            <ion-item>
              <ion-input
                label="Email"
                labelPlacement="floating"
                type="email"
                [(ngModel)]="email"
                autocomplete="email"
                [disabled]="loading"
              ></ion-input>
            </ion-item>
            <ion-item>
              <ion-input
                label="Password"
                labelPlacement="floating"
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                [attr.autocomplete]="mode === 'login' ? 'current-password' : 'new-password'"
                [disabled]="loading"
              ></ion-input>
              <ion-button
                fill="clear"
                slot="end"
                type="button"
                [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
                [attr.title]="showPassword ? 'Hide password' : 'Show password'"
                (click)="showPassword = !showPassword"
              >
                <ion-icon
                  [name]="showPassword ? 'eye-off-outline' : 'eye-outline'"
                  slot="icon-only"
                  aria-hidden="true"
                ></ion-icon>
              </ion-button>
            </ion-item>
            @if (mode === 'signup') {
              <ion-item>
                <ion-input
                  label="Confirm password"
                  labelPlacement="floating"
                  [type]="showConfirmPassword ? 'text' : 'password'"
                  [(ngModel)]="confirmPassword"
                  autocomplete="new-password"
                  [disabled]="loading"
                ></ion-input>
                <ion-button
                  fill="clear"
                  slot="end"
                  type="button"
                  [attr.aria-label]="showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'"
                  [attr.title]="showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'"
                  (click)="showConfirmPassword = !showConfirmPassword"
                >
                  <ion-icon
                    [name]="showConfirmPassword ? 'eye-off-outline' : 'eye-outline'"
                    slot="icon-only"
                    aria-hidden="true"
                  ></ion-icon>
                </ion-button>
              </ion-item>
            }
          </ion-list>

          @if (error) {
            <ion-text color="danger"><p role="alert" aria-live="assertive">{{ error }}</p></ion-text>
          }

          <ion-button
            expand="block"
            shape="round"
            (click)="submit()"
            [disabled]="loading"
            [attr.aria-busy]="loading"
          >
            @if (loading) {
              <ion-spinner name="crescent" slot="start"></ion-spinner>
              {{ mode === 'login' ? 'Signing in…' : 'Creating account…' }}
            } @else {
              {{ mode === 'login' ? 'Sign in' : 'Sign up' }}
            }
          </ion-button>

          <ion-button expand="block" fill="clear" (click)="toggleMode()" [disabled]="loading">
            {{ mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Sign in' }}
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-shell {
      min-height: 100%;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-block: clamp(16px, 4vh, 32px);
    }

    .login-module {
      width: min(100%, 480px);
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }

    .brand-badge {
      width: min(72vw, 35vh, 320px);
      margin: 0 auto 4px;
      filter: drop-shadow(0 18px 32px rgba(45, 29, 77, 0.14));
    }

    .brand-badge img {
      display: block;
      width: 100%;
      aspect-ratio: 1;
      object-fit: contain;
    }

    .login-module h1 {
      margin: 0;
      text-align: center;
      font-size: clamp(2rem, 4vw, 2.6rem);
    }

    ion-list {
      background: transparent;
      margin: 0;
      border-radius: 20px;
      overflow: hidden;
    }

    ion-item {
      --background: var(--ls-surface);
      --color: var(--ls-ink);
      --border-color: var(--ls-line);
      --highlight-color-focused: var(--ls-ink);
      margin-bottom: 8px;
      border-radius: 14px;
    }

    ion-input {
      --color: var(--ls-ink);
      --placeholder-color: var(--ls-ink-60);
      --placeholder-opacity: 1;
      --highlight-color-focused: var(--ls-ink);
      --highlight-color-valid: var(--ls-ink);
      --highlight-color-invalid: var(--ls-alert);
    }

    ion-item ion-button {
      --color: var(--ls-ink-60);
    }

    ion-button:first-of-type {
      --min-height: 52px;
      --border-radius: 999px;
      margin-top: 8px;
    }

    ion-text p {
      margin: 0;
      text-align: center;
      font-size: 0.92rem;
    }
  `],
})
export class LoginPage {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  mode: 'login' | 'signup' = 'login';
  showPassword = false;
  showConfirmPassword = false;
  error = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  toggleMode() {
    this.mode = this.mode === 'login' ? 'signup' : 'login';
    this.error = '';
  }

  async submit() {
    this.error = '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.error = 'Enter a valid email address.';
      return;
    }
    if (!this.password) {
      this.error = 'Enter a valid email address and password.';
      return;
    }
    const displayName = sanitizeText(this.username);
    if (this.mode === 'signup' && (displayName.length < 2 || displayName.length > 60)) {
      this.error = 'Choose a username from 2 to 60 characters.';
      return;
    }
    if (this.mode === 'signup' && this.password.length < 6) {
      this.error = 'Choose a password with at least 6 characters.';
      return;
    }
    if (this.mode === 'signup' && this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }
    this.loading = true;
    try {
      if (this.mode === 'login') {
        await this.auth.login(this.email.trim(), this.password);
      } else {
        await this.auth.signup(this.email.trim(), this.password, displayName);
      }
      this.router.navigateByUrl('/tabs/dashboard');
    } catch (error: unknown) {
      this.error = this.authErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  private authErrorMessage(error: unknown): string {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined;
    switch (code) {
      case 'auth/invalid-email':
        return 'Enter a valid email address.';
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'The email or password is incorrect.';
      case 'auth/email-already-in-use':
        return 'An account already exists for this email.';
      case 'auth/weak-password':
        return 'Choose a stronger password with at least 6 characters.';
      case 'auth/network-request-failed':
        return 'Unable to connect. Check your internet connection and try again.';
      default:
        return 'Unable to sign in right now. Please try again.';
    }
  }
}
