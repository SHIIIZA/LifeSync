import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './shared/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
})
export class AppComponent {
  constructor(_theme: ThemeService) {}
}
