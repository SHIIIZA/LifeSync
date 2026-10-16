import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
    RouterLink,
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
          <div class="brand-badge" aria-label="LifeSync logo">
            <svg viewBox="0 0 640 640" role="img" aria-hidden="true">
              <defs>
                <linearGradient id="life-sync-text" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stop-color="#f6eb9e" />
                  <stop offset="45%" stop-color="#f0d768" />
                  <stop offset="100%" stop-color="#f7b067" />
                </linearGradient>
              </defs>
              <circle cx="320" cy="320" r="286" fill="var(--ls-brand-plum)" stroke="var(--ls-brand-coral)" stroke-width="24" />
              <g fill="var(--ls-brand-gold)">
                <path d="M95 158 L108 185 L135 198 L108 211 L95 238 L82 211 L55 198 L82 185 Z"/>
                <path d="M520 158 L533 185 L560 198 L533 211 L520 238 L507 211 L480 198 L507 185 Z"/>
                <path d="M105 420 L118 447 L145 460 L118 473 L105 500 L92 473 L65 460 L92 447 Z"/>
                <path d="M512 436 L525 463 L552 476 L525 489 L512 516 L499 489 L472 476 L499 463 Z"/>
              </g>

              <text x="320" y="205" text-anchor="middle" fill="url(#life-sync-text)" font-size="116" font-family="Space Grotesk, sans-serif" font-weight="700" letter-spacing="6">LIFE</text>
              <text x="320" y="305" text-anchor="middle" fill="url(#life-sync-text)" font-size="110" font-family="Space Grotesk, sans-serif" font-weight="700" letter-spacing="2">SYNC</text>

              <g transform="translate(55 190)">
                <path d="M230 220 C245 140, 210 105, 180 105 C155 105, 120 124, 108 176 L78 208 C68 220, 58 235, 58 255 C58 295, 79 330, 116 346 L174 373 L220 420 C245 443, 288 447, 317 430 L358 404 C380 392, 393 365, 392 336 L390 292 C389 260, 369 234, 339 222 L230 220 Z" fill="var(--ls-brand-gold)"/>
                <path d="M160 156 C175 116, 218 115, 234 152 C239 165, 234 178, 220 183 C201 194, 176 190, 163 177 C153 167, 153 163, 160 156 Z" fill="var(--ls-brand-gold)"/>
                <rect x="132" y="244" width="220" height="118" rx="28" fill="var(--ls-brand-gold)"/>
                <rect x="154" y="266" width="174" height="76" rx="20" fill="#f7e6bf" opacity="0.55"/>
                <path d="M190 270 L250 270" stroke="#2d1d4d" stroke-width="8" stroke-linecap="round"/>
                <path d="M224 242 L224 290" stroke="#2d1d4d" stroke-width="6" stroke-linecap="round"/>
                <path d="M250 242 L250 290" stroke="#2d1d4d" stroke-width="6" stroke-linecap="round"/>
                <path d="M265 248 C292 255, 312 277, 309 302 C306 327, 282 342, 253 340" fill="none" stroke="#2d1d4d" stroke-width="7" stroke-linecap="round"/>
                <path d="M188 310 L224 310 L245 350 L271 300 L290 331 L316 310" fill="none" stroke="#2d1d4d" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
              </g>
            </svg>
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
      display: flex;
      align-items: center;
      justify-content: center;
      padding-block: 24px;
    }

    .login-module {
      width: min(100%, 480px);
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }

    .brand-badge {
      width: min(90vw, 520px);
      margin: 0 auto 4px;
      filter: drop-shadow(0 18px 32px rgba(45, 29, 77, 0.14));
    }

    .brand-badge svg {
      display: block;
      width: 100%;
      height: auto;
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
