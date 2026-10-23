import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  logOutOutline,
  personOutline,
  keyOutline,
  checkmarkOutline,
  createOutline,
} from 'ionicons/icons';
import { AuthService } from '../auth/auth.service';
import { FirestoreDataService } from '../data/firestore-data.service';
import { ToastController } from '@ionic/angular/standalone';
import { sanitizeText } from '../shared/sanitize';
import { ErrorBannerComponent } from '../shared/error-banner.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner.component';
import { ThemeToggleComponent } from '../shared/theme-toggle.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonText,
    ErrorBannerComponent,
    LoadingSpinnerComponent,
    ThemeToggleComponent,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="back()">
            <ion-icon name="chevron-back-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <app-theme-toggle slot="end"></app-theme-toggle>
        <h1 class="ls-display">Account</h1>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding" [scrollY]="true">
      @if (data.loading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else if (data.lastError()) {
        <app-error-banner [message]="data.lastError()!" (onRetry)="data.retryConnection()"></app-error-banner>
      }

      <!-- Profile card -->
      <div class="ls-card">
        <p class="ls-eyebrow">Signed in as</p>
        <h2>{{ auth.email() }}</h2>
        <p class="uid-text">UID: {{ auth.uid() }}</p>
      </div>

      <!-- Display name editing -->
      <div class="ls-card">
        <p class="ls-eyebrow">Display name</p>
        @if (!editingName()) {
          <div class="name-row">
            @if (auth.displayName()) {
              <p class="name-value">{{ auth.displayName() }}</p>
            } @else {
              <p class="name-value empty-name">Not set</p>
            }
            <ion-button size="small" fill="outline" (click)="startEditName()">
              <ion-icon name="create-outline" slot="icon-only"></ion-icon>
              Edit
            </ion-button>
          </div>
        } @else {
          <ion-item>
            <ion-input
              label="Display name"
              labelPlacement="floating"
              [(ngModel)]="nameInput"
              placeholder="Your name"
            ></ion-input>
          </ion-item>
          <div class="name-actions">
            <ion-button size="small" (click)="saveName()" [disabled]="savingName()">
              <ion-icon name="checkmark-outline" slot="start"></ion-icon>
              Save
            </ion-button>
            <ion-button size="small" fill="clear" (click)="cancelEditName()">Cancel</ion-button>
          </div>
        }
        @if (nameStatus) {
          <p class="status-text">{{ nameStatus }}</p>
        }
      </div>

      <!-- Password reset -->
      <div class="ls-card">
        <p class="ls-eyebrow">Password</p>
        <p class="section-hint">Send a password reset link to your email.</p>
        <ion-button expand="block" fill="outline" shape="round" (click)="resetPassword()" [disabled]="resettingPassword()">
          <ion-icon name="key-outline" slot="start"></ion-icon>
          Reset password
        </ion-button>
        @if (resetStatus) {
          <p class="status-text">{{ resetStatus }}</p>
        }
      </div>

      <div class="ls-card">
        <p class="ls-eyebrow">Need help?</p>
        <p class="section-hint">Send a message to the LifeSync support team.</p>
        <ion-button expand="block" fill="outline" shape="round" routerLink="/contact">
          Contact support
        </ion-button>
      </div>

      <!-- Danger zone -->
      <ion-button expand="block" fill="outline" color="danger" shape="round" (click)="logout()">
        <ion-icon name="log-out-outline" slot="start"></ion-icon>
        Sign out
      </ion-button>

      <ion-button expand="block" fill="outline" color="danger" shape="round" (click)="clearData()">
        Clear all my data
      </ion-button>
      @if (clearStatus) {
        <p>{{ clearStatus }}</p>
      }
    </ion-content>
  `,
  styles: [`
    .uid-text { font-size: 12px; color: var(--ls-ink-60); word-break: break-all; }
    .name-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .name-value { margin: 0; font-size: 16px; font-weight: 500; }
    .empty-name { color: var(--ls-ink-60); }
    .name-actions { display: flex; gap: 8px; margin-top: 8px; }
    .section-hint { font-size: 13px; color: var(--ls-ink-60); margin: 0 0 10px; }
    .status-text { font-size: 13px; color: var(--ls-moss); margin: 8px 0 0; }
  `],
})
export class AccountPage {
  editingName = signal(false);
  nameInput = '';
  savingName = signal(false);
  nameStatus = '';
  resettingPassword = signal(false);
  resetStatus = '';
  clearStatus = '';

  constructor(
    public auth: AuthService,
    public data: FirestoreDataService,
    private router: Router,
    private location: Location,
    private toast: ToastController,
  ) {
    addIcons({ chevronBackOutline, logOutOutline, personOutline, keyOutline, checkmarkOutline, createOutline });
  }

  startEditName() {
    this.nameInput = this.auth.displayName() || '';
    this.editingName.set(true);
    this.nameStatus = '';
  }

  cancelEditName() {
    this.editingName.set(false);
    this.nameStatus = '';
  }

  async saveName() {
    const name = sanitizeText(this.nameInput);
    if (name.length < 2 || name.length > 60) {
      this.nameStatus = 'Enter a display name from 2 to 60 characters.';
      return;
    }
    this.savingName.set(true);
    try {
      await this.auth.updateDisplayName(name);
      this.nameStatus = 'Display name updated.';
      this.editingName.set(false);
    } catch {
      this.nameStatus = 'Unable to update your display name. Please try again.';
    } finally {
      this.savingName.set(false);
    }
  }

  async resetPassword() {
    const email = this.auth.email();
    if (!email) return;
    this.resettingPassword.set(true);
    this.resetStatus = '';
    try {
      await this.auth.resetPassword(email);
      this.resetStatus = `Password reset email sent to ${email}.`;
      const t = await this.toast.create({
        message: 'Check your inbox for a password reset link.',
        duration: 3000,
        color: 'success',
      });
      await t.present();
    } catch {
      this.resetStatus = 'Unable to send the reset email. Please try again.';
    } finally {
      this.resettingPassword.set(false);
    }
  }

  async clearData() {
    const ok = window.confirm('Delete ALL your LifeSync data? This cannot be undone.');
    if (!ok) return;
    this.clearStatus = 'Clearing...';
    try {
      await this.data.clearMyData();
      this.clearStatus = 'All data cleared.';
    } catch {
      this.clearStatus = 'Unable to clear your data. Please try again.';
    }
  }

  back() {
    this.location.back();
  }

  async logout() {
    await this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
