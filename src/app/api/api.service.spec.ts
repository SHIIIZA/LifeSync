import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default quote values', () => {
    expect(service.quote()).toBe('Start where you are. Use what you have.');
    expect(service.quoteAuthor()).toBe('Arthur Ashe');
  });

  it('should have null exchange rate initially', () => {
    expect(service.usdToPhp()).toBeNull();
  });

  it('should handle fetch failure gracefully', async () => {
    // Mock fetch to throw
    spyOn(window, 'fetch').and.rejectValue(new Error('Network error'));
    await service.loadDailyQuote();
    // Should keep fallback values
    expect(service.quote()).toBe('Start where you are. Use what you have.');
  });

  it('should handle non-ok response gracefully', async () => {
    spyOn(window, 'fetch').and.resolveValue(new Response(null, { status: 500 }));
    await service.loadDailyQuote();
    expect(service.quote()).toBe('Start where you are. Use what you have.');
  });
});
