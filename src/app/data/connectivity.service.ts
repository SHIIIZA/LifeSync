import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  readonly isOnline = signal<boolean>(
    typeof navigator === 'undefined' || navigator.onLine,
  );

  private activeCheck: AbortController | null = null;

  constructor() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', this.onNetworkAvailable);
    window.addEventListener('offline', this.onNetworkUnavailable);
    window.addEventListener('focus', this.onNetworkAvailable);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.setInterval(() => void this.checkConnection(), 10_000);

    if (navigator.onLine) {
      void this.checkConnection();
    } else {
      this.isOnline.set(false);
    }
  }

  async checkConnection(): Promise<void> {
    if (!navigator.onLine) {
      this.activeCheck?.abort();
      this.activeCheck = null;
      this.isOnline.set(false);
      return;
    }

    this.activeCheck?.abort();
    const controller = new AbortController();
    this.activeCheck = controller;
    const timeout = window.setTimeout(() => controller.abort(), 4000);

    try {
      await fetch('https://www.gstatic.com/generate_204', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (this.activeCheck === controller) this.isOnline.set(true);
    } catch (error: unknown) {
      if (this.activeCheck === controller) {
        this.isOnline.set(false);
        if (!controller.signal.aborted && !(error instanceof TypeError)) {
          console.error('Internet connectivity check failed.', error);
        }
      }
    } finally {
      window.clearTimeout(timeout);
      if (this.activeCheck === controller) this.activeCheck = null;
    }
  }

  private readonly onNetworkAvailable = () => {
    void this.checkConnection();
  };

  private readonly onNetworkUnavailable = () => {
    this.activeCheck?.abort();
    this.activeCheck = null;
    this.isOnline.set(false);
  };

  private readonly onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void this.checkConnection();
    }
  };
}
