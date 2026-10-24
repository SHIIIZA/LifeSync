import { bootstrapApplication } from '@angular/platform-browser';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, getApp, initializeApp } from '@angular/fire/app';
import {
  provideFirestore,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
} from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

function createFirestore() {
  const app = getApp();
  try {
    return initializeFirestore(app, { localCache: persistentLocalCache() });
  } catch (error: unknown) {
    console.error(
      'Persistent offline storage is unavailable. LifeSync will use temporary local caching.',
      error,
    );
    return getFirestore(app);
  }
}

bootstrapApplication(AppComponent, {
  providers: [
    provideIonicAngular({}),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(createFirestore),
    provideAuth(() => getAuth()),
  ],
}).catch((err) => console.error(err));
