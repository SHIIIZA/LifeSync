import { Injectable, signal } from '@angular/core';

// External web services (ILO 3): a daily quote and a live FX rate.
// Both degrade gracefully to baked-in fallbacks when offline.
@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly quote = signal<string>('Start where you are. Use what you have.');
  readonly quoteAuthor = signal<string>('Arthur Ashe');
  readonly usdToPhp = signal<number | null>(null);

  async loadDailyQuote() {
    try {
      const res = await fetch('https://api.quotable.io/random?maxLength=100');
      if (!res.ok) return;
      const data = await res.json();
      this.quote.set(data.content);
      this.quoteAuthor.set(data.author);
    } catch {
      /* keep fallback */
    }
  }

  async loadExchangeRate() {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!res.ok) return;
      const data = await res.json();
      const php = data?.rates?.PHP;
      if (typeof php === 'number') this.usdToPhp.set(Math.round(php * 100) / 100);
    } catch {
      /* keep fallback (null hides the rate) */
    }
  }
}
