import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, walletOutline, pulseOutline, arrowForward } from 'ionicons/icons';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [IonContent, IonButton, IonIcon],
  templateUrl: './onboarding.page.html',
  styleUrl: './onboarding.page.scss',
})
export class OnboardingPage {
  constructor(private router: Router) {
    addIcons({ calendarOutline, walletOutline, pulseOutline, arrowForward });
  }

  enter() {
    this.router.navigateByUrl('/login');
  }
}
