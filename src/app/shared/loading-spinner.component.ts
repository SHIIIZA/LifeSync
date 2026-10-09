import { Component } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [IonSpinner],
  template: `
    <div class="loading-container">
      <ion-spinner name="crescent" color="primary"></ion-spinner>
      <p>Loading...</p>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      color: var(--ls-ink-60);
      p { margin: 8px 0 0; font-size: 13px; }
    }
  `],
})
export class LoadingSpinnerComponent {}
