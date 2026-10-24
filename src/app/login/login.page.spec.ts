import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let page: LoginPage;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    page = new LoginPage(auth, router);
    page.loginIdentifier = 'person@example.com';
    page.password = 'password';
  });

  it('shows a plain-language message when sign-in fails', async () => {
    auth.login.and.rejectWith(Object.assign(new Error('Firebase failure'), {
      code: 'auth/invalid-credential',
    }));

    await page.submit();

    expect(page.error).toBe(
      'We couldn’t sign you in. Check your username or email and password, then try again.',
    );
    expect(page.error).not.toContain('Firebase');
  });

  it('does not expose unknown backend error codes', async () => {
    auth.login.and.rejectWith(Object.assign(new Error('Firebase failure'), {
      code: 'auth/some-unrecognized-code',
    }));

    await page.submit();

    expect(page.error).toBe('We couldn’t sign you in right now. Please try again later.');
    expect(page.error).not.toContain('auth/');
  });
});
