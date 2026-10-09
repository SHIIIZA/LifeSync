import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have null initial values', () => {
    expect(service.uid()).toBeNull();
    expect(service.email()).toBeNull();
    expect(service.displayName()).toBeNull();
  });

  it('should have login method', () => {
    expect(typeof service.login).toBe('function');
  });

  it('should have signup method', () => {
    expect(typeof service.signup).toBe('function');
  });

  it('should have logout method', () => {
    expect(typeof service.logout).toBe('function');
  });

  it('should have resetPassword method', () => {
    expect(typeof service.resetPassword).toBe('function');
  });

  it('should have updateDisplayName method', () => {
    expect(typeof service.updateDisplayName).toBe('function');
  });
});
