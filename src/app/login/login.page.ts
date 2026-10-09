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
} from '@ionic/angular/standalone';
import { AuthService } from '../auth/auth.service';

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
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar></ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p class="ls-eyebrow">LifeSync</p>
      <h1 class="ls-display">{{ mode === 'login' ? 'Welcome back' : 'Create account' }}</h1>

      <ion-list>
        <ion-item>
          <ion-input
            label="Email"
            labelPlacement="floating"
            type="email"
            [(ngModel)]="email"
            autocomplete="email"
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-input
            label="Password"
            labelPlacement="floating"
            type="password"
            [(ngModel)]="password"
            [attr.autocomplete]="mode === 'login' ? 'current-password' : 'new-password'"
          ></ion-input>
        </ion-item>
      </ion-list>

      @if (error) {
        <ion-text color="danger"><p>{{ error }}</p></ion-text>
      }

      <ion-button expand="block" shape="round" (click)="submit()" [disabled]="loading">
        {{ mode === 'login' ? 'Sign in' : 'Sign up' }}
      </ion-button>

      <ion-button expand="block" fill="clear" (click)="toggleMode()">
        {{ mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Sign in' }}
      </ion-button>
    </ion-content>
  `,
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
