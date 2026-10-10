import { Component } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { moonOutline, sunnyOutline } from 'ionicons/icons';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [IonButton, IonIcon],
  template: `
    <ion-button
      fill="clear"
      [attr.aria-label]="theme.darkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
      [attr.title]="theme.darkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
      (click)="theme.toggle()"
    >
      <ion-icon
        [name]="theme.darkMode() ? 'sunny-outline' : 'moon-outline'"
        slot="icon-only"
        aria-hidden="true"
      ></ion-icon>
    </ion-button>
  `,
  styles: [`
    :host { display: inline-flex; }
    ion-button {
      --background: var(--ls-surface);
      --color: var(--ls-ink);
      --border-radius: 14px;
      --padding-start: 0;
      --padding-end: 0;
      width: 44px;
      height: 44px;
      margin: 0;
      border: 1px solid var(--ls-line);
      border-radius: 14px;
    }
    ion-icon { font-size: 22px; }
  `],
})
export class ThemeToggleComponent {
  constructor(public theme: ThemeService) {
    addIcons({ moonOutline, sunnyOutline });
  }
}
