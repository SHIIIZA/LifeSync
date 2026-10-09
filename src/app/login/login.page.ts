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
    this.loading = true;
    try {
      if (this.mode === 'login') {
        await this.auth.login(this.email, this.password);
      } else {
        await this.auth.signup(this.email, this.password);
      }
      this.router.navigateByUrl('/tabs/dashboard');
    } catch (e: any) {
      this.error = e?.message ?? 'Authentication failed';
    } finally {
      this.loading = false;
    }
  }
}
