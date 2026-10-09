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
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="back()">
            <ion-icon name="chevron-back-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <h1 class="ls-display">Account</h1>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
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
            <p class="name-value">{{ auth.displayName() || 'Not set' }}</p>
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
    const name = this.nameInput.trim();
    if (!name) {
      this.nameStatus = 'Name cannot be empty.';
      return;
    }
    this.savingName.set(true);
    try {
      await this.auth.updateDisplayName(name);
      this.nameStatus = 'Display name updated.';
      this.editingName.set(false);
    } catch (e: any) {
      this.nameStatus = e?.message ?? 'Failed to update name.';
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
    } catch (e: any) {
      this.resetStatus = e?.message ?? 'Failed to send reset email.';
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
    } catch (e: any) {
      this.clearStatus = e?.message ?? 'Failed to clear data.';
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
