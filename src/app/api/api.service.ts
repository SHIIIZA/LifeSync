import { Injectable, signal } from '@angular/core';

// External web service (ILO 3): a daily quote.
// It degrades gracefully to a baked-in fallback when offline.
@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly quote = signal<string>('Start where you are. Use what you have.');
  readonly quoteAuthor = signal<string>('Arthur Ashe');
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

}
