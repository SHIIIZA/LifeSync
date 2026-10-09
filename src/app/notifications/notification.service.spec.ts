import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { RoutineItem } from '../models/lifesync.models';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have requestPermission method', () => {
    expect(typeof service.requestPermission).toBe('function');
  });

  it('should have scheduleMedicationReminders method', () => {
    expect(typeof service.scheduleMedicationReminders).toBe('function');
  });

  it('should return 0 for empty items', async () => {
    const result = await service.scheduleMedicationReminders([]);
    expect(result).toBe(0);
  });

  it('should return 0 for non-medication items', async () => {
    const items: RoutineItem[] = [
      { id: '1', title: 'Study', time: '8:00 AM', category: 'study', done: false },
    ];
    const result = await service.scheduleMedicationReminders(items);
    expect(result).toBe(0);
  });

  it('should handle medication items', async () => {
    const items: RoutineItem[] = [
      { id: '1', title: 'Take vitamins', time: '8:00 AM', category: 'medication', done: false },
    ];
    // Should not throw
    const result = await service.scheduleMedicationReminders(items);
    expect(typeof result).toBe('number');
  });
});
