import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FirestoreDataService } from './data/firestore-data.service';
import { AppComponent } from './app.component';
import { ThemeService } from './shared/theme.service';

describe('AppComponent connectivity notice', () => {
  let fixture: ComponentFixture<AppComponent>;
  const isOnline = signal(false);

  beforeEach(async () => {
    isOnline.set(false);
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: ThemeService, useValue: {} },
        { provide: FirestoreDataService, useValue: { isOnline } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
  });

  it('shows a persistent offline notice when disconnected', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('You’re offline.');
  });

  it('removes the persistent offline notice after reconnecting', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    isOnline.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('You’re offline.');
  });
});
