import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { IonButton, IonContent, IonSpinner, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [IonButton, IonContent, IonSpinner, IonText],
  template: `
    <ion-content [fullscreen]="true" [scrollY]="true" class="splash-content">
      <main class="splash">
        <img src="assets/lifesync-logo.png" alt="LifeSync logo" />
        <h1>LifeSync</h1>
        <p class="motto">Fitness at your Fingertips</p>
        @if (error()) {
          <ion-text color="danger">
            <p role="alert">{{ error() }}</p>
          </ion-text>
          <ion-button fill="clear" (click)="continueToApp()">Try again</ion-button>
        } @else {
          <ion-spinner name="crescent" aria-label="Loading LifeSync"></ion-spinner>
        }
      </main>
    </ion-content>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .splash-content {
      --background: #2e1f4f;
      --color: #fff9e8;
    }

    .splash {
      box-sizing: border-box;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom));
      text-align: center;
    }

    img {
      width: min(58vw, 240px);
      aspect-ratio: 1;
      object-fit: contain;
    }

    h1 {
      margin: 18px 0 4px;
      color: #fff9e8;
      font-family: var(--ls-font-display);
      font-size: clamp(2.25rem, 9vw, 3rem);
      font-weight: 700;
    }

    .motto {
      margin: 0;
      color: #f4e28d;
      font-family: var(--ls-font-body);
      font-size: 1rem;
    }

    ion-spinner {
      margin-top: 40px;
      color: #f4e28d;
    }

    ion-text p {
      margin: 28px 0 0;
      max-width: 32ch;
    }
  `],
})
export class SplashPage {
  readonly error = signal('');

  constructor(
    private auth: Auth,
    private router: Router,
  ) {}

  ngOnInit() {
    void this.continueToApp();
  }

  async continueToApp() {
    this.error.set('');
    try {
      await Promise.all([
        this.auth.authStateReady(),
        new Promise<void>((resolve) => window.setTimeout(resolve, 700)),
      ]);
      const destination = this.auth.currentUser
        ? '/tabs/dashboard'
        : '/onboarding';
      const navigated = await this.router.navigateByUrl(destination, { replaceUrl: true });
      if (!navigated) {
        this.error.set('LifeSync could not open. Please try again.');
      }
    } catch (error: unknown) {
      console.error('LifeSync startup failed', error);
      this.error.set('Unable to start LifeSync. Check your connection and try again.');
    }
  }
}
