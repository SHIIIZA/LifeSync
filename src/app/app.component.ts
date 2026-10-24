import { Component, effect, signal } from '@angular/core';
import { IonApp, IonIcon, IonRouterOutlet, IonToast } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, warningOutline } from 'ionicons/icons';
import { FirestoreDataService } from './data/firestore-data.service';
import { ThemeService } from './shared/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonIcon, IonRouterOutlet, IonToast],
  template: `
    <ion-app>
      @if (!data.isOnline()) {
        <div class="offline-banner" role="status" aria-live="polite">
          <ion-icon name="warning-outline" aria-hidden="true"></ion-icon>
          <span><strong>Offline mode</strong> — You’re using saved data. Reconnect to sync your changes.</span>
        </div>
      }
      <ion-router-outlet></ion-router-outlet>
      <ion-toast
        [isOpen]="connectivityToast() !== null"
        [message]="connectivityToast() === 'offline'
          ? 'No internet connection. Your changes will sync when you reconnect.'
          : 'You’re back online. LifeSync is syncing your changes.'"
        [icon]="connectivityToast() === 'offline' ? 'warning-outline' : 'checkmark-circle-outline'"
        position="bottom"
        [color]="connectivityToast() === 'offline' ? 'warning' : 'success'"
        [duration]="5000"
        (ionToastDidDismiss)="connectivityToast.set(null)"
      ></ion-toast>
    </ion-app>
  `,
  styles: [`
    .offline-banner {
      position: fixed;
      z-index: 10000;
      top: max(8px, env(safe-area-inset-top));
      inset-inline: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 12px 16px;
      border: 1px solid var(--ls-alert);
      border-radius: 14px;
      background: var(--ls-alert-tint);
      color: var(--ls-ink);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 4px 18px rgba(45, 29, 77, 0.16);
      font-size: 0.9rem;
      font-weight: 500;
      text-align: center;
    }

    .offline-banner ion-icon {
      flex: 0 0 auto;
      color: var(--ls-alert);
      font-size: 1.25rem;
    }
  `],
})
export class AppComponent {
  readonly connectivityToast = signal<'offline' | 'online' | null>(null);

  constructor(
    _theme: ThemeService,
    readonly data: FirestoreDataService,
  ) {
    addIcons({ checkmarkCircleOutline, warningOutline });
    let previousOnline = this.data.isOnline();
    if (!previousOnline) this.connectivityToast.set('offline');
    effect(
      () => {
        const online = this.data.isOnline();
        if (online !== previousOnline) {
          previousOnline = online;
          this.connectivityToast.set(online ? 'online' : 'offline');
        }
      },
      { allowSignalWrites: true },
    );
  }
}
