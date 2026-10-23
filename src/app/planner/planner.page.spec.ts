/// <reference types="jasmine" />

import { FormBuilder } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { PlannerPage } from './planner.page';
import { FirestoreDataService } from '../data/firestore-data.service';

describe('PlannerPage date and time selection', () => {
  let component: PlannerPage;
  let data: jasmine.SpyObj<FirestoreDataService>;

  beforeEach(() => {
    data = jasmine.createSpyObj<FirestoreDataService>(
      'FirestoreDataService',
      ['addStudyBlock', 'updateStudyBlock', 'deleteStudyBlock'],
    );
    data.addStudyBlock.and.resolveTo();
    data.updateStudyBlock.and.resolveTo();

    TestBed.configureTestingModule({
      imports: [PlannerPage],
      providers: [
        { provide: FirestoreDataService, useValue: data },
        FormBuilder,
      ],
    }).overrideComponent(PlannerPage, { set: { template: '' } });

    component = TestBed.createComponent(PlannerPage).componentInstance;
  });

  it('opens the looping time wheels, selects a calendar date, and saves the selection', () => {
    component.form.controls.scheduledAt.setValue('2026-10-25T16:45:00');
    component.openDateTimePicker();
    expect(component.dateTimeOpen).toBeTrue();

    component.selectDate(new Date(2026, 9, 26));
    component.selectWheelValue('hour', 9);
    component.selectWheelValue('minute', 15);
    component.selectWheelValue('period', 'AM');
    component.saveDateTime();

    expect(component.dateTimeOpen).toBeFalse();
    expect(component.form.controls.scheduledAt.value).toBe('2026-10-26T09:15:00');
    expect(component.dateTimeLabel(component.form.controls.scheduledAt.value)).not.toBe('Choose date and time');
  });

  it('provides repeating wheel options and a six-week calendar grid', () => {
    expect(component.hourOptions.length).toBe(60);
    expect(component.minuteOptions.length).toBe(300);
    expect(component.periodOptions.length).toBe(10);
    expect(component.calendarDays().length).toBe(42);
  });

  it('saves the chosen date and time as separate planner fields', async () => {
    component.form.setValue({
      course: 'Biology',
      scheduledAt: '2026-10-25T16:45:00',
      durationMin: '60',
      priority: 'soon',
    });

    await component.addBlock();

    expect(data.addStudyBlock).toHaveBeenCalledWith(jasmine.objectContaining({
      course: 'Biology',
      date: '2026-10-25',
      time: jasmine.any(String),
      durationMin: 60,
      priority: 'soon',
    }));
    expect(component.form.controls.scheduledAt.value).toBe('');
  });

  it('converts older Today/Tomorrow planner entries when editing', () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    component.editBlock({
      id: 'today-block',
      course: 'Today task',
      time: 'Today, 4:00 PM',
      durationMin: 30,
      priority: 'soon',
    });
    expect(component.form.controls.scheduledAt.value).toBe(
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T16:00:00`,
    );

    component.editBlock({
      id: 'tomorrow-block',
      course: 'Tomorrow task',
      time: 'Tomorrow, 4:00 PM',
      durationMin: 30,
      priority: 'soon',
    });
    expect(component.form.controls.scheduledAt.value).toBe(
      `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}T16:00:00`,
    );
  });
});
