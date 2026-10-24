import { Component, effect, signal } from '@angular/core';
import { IonApp, IonIcon, IonRouterOutlet, IonToast } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { warningOutline } from 'ionicons/icons';
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
          <span>You’re offline. LifeSync will keep working where possible; reconnect to sync your data.</span>
        </div>
      }
      <ion-router-outlet></ion-router-outlet>
      <ion-toast
        [isOpen]="offlineToastOpen()"
        message="You’re offline. Reconnect to sync your data and use online features."
        icon="warning-outline"
        position="bottom"
        color="warning"
        [duration]="5000"
        (ionToastDidDismiss)="offlineToastOpen.set(false)"
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
  readonly offlineToastOpen = signal(false);

  constructor(
    _theme: ThemeService,
    readonly data: FirestoreDataService,
  ) {
    addIcons({ warningOutline });
    effect(
      () => this.offlineToastOpen.set(!this.data.isOnline()),
      { allowSignalWrites: true },
    );
  }
}
