import { Component, Input } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refreshOutline, alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  imports: [IonButton, IonIcon],
  template: `
    <div class="error-banner">
      <ion-icon name="alert-circle-outline" class="error-icon"></ion-icon>
      <p class="error-text">{{ message }}</p>
      @if (showRetry) {
        <ion-button size="small" fill="outline" (click)="onRetry()">
          <ion-icon name="refresh-outline" slot="start"></ion-icon>
          Retry
        </ion-button>
      }
    </div>
  `,
  styles: [`
    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: #fff5f5;
      border: 1px solid var(--ls-alert);
      border-radius: var(--ls-radius-md);
      margin-bottom: 14px;
    }
    .error-icon { color: var(--ls-alert); font-size: 20px; flex-shrink: 0; }
    .error-text { flex: 1; margin: 0; font-size: 13px; color: var(--ls-alert); }
  `],
})
export class ErrorBannerComponent {
  @Input() message = 'Something went wrong.';
  @Input() showRetry = true;

  constructor() {
    addIcons({ refreshOutline, alertCircleOutline });
  }

  onRetry() {
    window.location.reload();
  }
}
