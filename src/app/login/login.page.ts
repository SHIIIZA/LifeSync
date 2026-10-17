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
} from '@ionic/angular/standalone';
import { AuthService } from '../auth/auth.service';
import { ThemeToggleComponent } from '../shared/theme-toggle.component';

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
                type="password"
                [(ngModel)]="password"
                [attr.autocomplete]="mode === 'login' ? 'current-password' : 'new-password'"
                [disabled]="loading"
              ></ion-input>
            </ion-item>
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
      --background: rgba(255, 255, 255, 0.52);
      --border-color: var(--ls-line);
      --highlight-color-focused: var(--ls-sky);
      margin-bottom: 8px;
      border-radius: 14px;
    }

    ion-input {
      --placeholder-color: var(--ls-ink-60);
      --color: var(--ls-ink);
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
  email = '';
  password = '';
  mode: 'login' | 'signup' = 'login';
  error = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  toggleMode() {
    this.mode = this.mode === 'login' ? 'signup' : 'login';
    this.error = '';
  }

  async submit() {
    this.error = '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim()) || !this.password) {
      this.error = 'Enter a valid email address and password.';
      return;
    }
    if (this.mode === 'signup' && this.password.length < 6) {
      this.error = 'Choose a password with at least 6 characters.';
      return;
    }
    this.loading = true;
    try {
      if (this.mode === 'login') {
        await this.auth.login(this.email.trim(), this.password);
      } else {
        await this.auth.signup(this.email.trim(), this.password);
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
