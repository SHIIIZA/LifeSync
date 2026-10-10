import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { statsChartOutline, personOutline } from 'ionicons/icons';
import { ThemeToggleComponent } from './theme-toggle.component';

// Persistent top-right actions shown on every tab page.
@Component({
  selector: 'app-header-actions',
  standalone: true,
  imports: [RouterLink, IonButton, IonButtons, IonIcon, ThemeToggleComponent],
  template: `
    <ion-buttons>
      <app-theme-toggle></app-theme-toggle>
      <ion-button routerLink="/insights" fill="clear" title="Insights">
        <ion-icon name="stats-chart-outline" slot="icon-only"></ion-icon>
      </ion-button>
      <ion-button routerLink="/account" fill="clear" title="Account">
        <ion-icon name="person-outline" slot="icon-only"></ion-icon>
      </ion-button>
    </ion-buttons>
  `,
})
export class HeaderActionsComponent {
  constructor() {
    addIcons({ statsChartOutline, personOutline });
  }
}
