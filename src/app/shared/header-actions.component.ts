import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { statsChartOutline, personOutline, mailOutline } from 'ionicons/icons';
import { ThemeToggleComponent } from './theme-toggle.component';

// Persistent top-right actions shown on every tab page.
@Component({
  selector: 'app-header-actions',
  standalone: true,
  imports: [RouterLink, IonButton, IonButtons, IonIcon, ThemeToggleComponent],
  template: `
    <ion-buttons class="header-buttons">
      <app-theme-toggle></app-theme-toggle>
      <ion-button routerLink="/insights" fill="clear" title="Insights" aria-label="Insights">
        <ion-icon name="stats-chart-outline" slot="icon-only"></ion-icon>
      </ion-button>
      <ion-button routerLink="/account" fill="clear" title="Account" aria-label="Account">
        <ion-icon name="person-outline" slot="icon-only"></ion-icon>
      </ion-button>
      <ion-button routerLink="/contact" fill="clear" title="Contact support" aria-label="Contact support">
        <ion-icon name="mail-outline" slot="icon-only"></ion-icon>
      </ion-button>
    </ion-buttons>
  `,
  styles: [`
    :host {
      position: relative;
      z-index: 2;
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      pointer-events: auto;
    }

    .header-buttons {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      pointer-events: auto;
    }

    ion-button {
      flex: 0 0 48px;
      width: 48px;
      height: 48px;
      margin: 0;
      touch-action: manipulation;
      pointer-events: auto;
    }
  `],
})
export class HeaderActionsComponent {
  constructor() {
    addIcons({ statsChartOutline, personOutline, mailOutline });
  }
}
