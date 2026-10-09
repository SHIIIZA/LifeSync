import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { RoutineItem } from '../models/lifesync.models';

// Schedules local reminders for medication items. On native platforms
// this fires OS notifications; on web it falls back to the Notification API.
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private webNotificationsEnabled = false;

  async requestPermission(): Promise<boolean> {
    // Try native first
    try {
      const res = await LocalNotifications.requestPermissions();
      if (res.display === 'granted') return true;
    } catch {
      // Fall through to web
    }

    // Web fallback: use the Notification API
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.webNotificationsEnabled = permission === 'granted';
      return this.webNotificationsEnabled;
    }

    return false;
  }

  async scheduleMedicationReminders(items: RoutineItem[]) {
    const meds = items.filter((i) => i.category === 'medication');
    if (!meds.length) return 0;

    // Try native first
    try {
      const notifications = meds.map((item, i) => ({
        id: 1000 + i,
        title: 'LifeSync reminder',
        body: item.title,
        schedule: { at: this.nextOccurrence(item.time) },
      }));
      await LocalNotifications.schedule({ notifications });
      return notifications.length;
    } catch (e) {
      console.warn('Native notifications unavailable, trying web fallback', e);
    }

    // Web fallback: schedule via Notification API
    if (this.webNotificationsEnabled || 'Notification' in window) {
      const granted =
        this.webNotificationsEnabled ||
        (await Notification.requestPermission()) === 'granted';
      if (granted) {
        this.webNotificationsEnabled = true;
        for (const item of meds) {
          this.scheduleWebNotification(item);
        }
        return meds.length;
      }
    }

    return 0;
  }

  private scheduleWebNotification(item: RoutineItem) {
    const at = this.nextOccurrence(item.time);
    const delay = at.getTime() - Date.now();
    setTimeout(() => {
      new Notification('LifeSync reminder', {
        body: item.title,
        icon: '/favicon.ico',
        tag: `med-${item.id}`,
      });
    }, Math.max(0, delay));
  }

  // "7:30 AM" -> next Date that time occurs (tomorrow if it already passed)
  private nextOccurrence(time: string): Date {
    const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    const now = new Date();
    if (!match) return new Date(now.getTime() + 60_000);
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (/pm/i.test(match[3]) && h !== 12) h += 12;
    if (/am/i.test(match[3]) && h === 12) h = 0;
    const at = new Date(now);
    at.setHours(h, m, 0, 0);
    if (at <= now) at.setDate(at.getDate() + 1);
    return at;
  }
}
