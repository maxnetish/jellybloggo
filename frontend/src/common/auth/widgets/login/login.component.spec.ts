import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TuiNotificationService, TuiRoot } from '@taiga-ui/core';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../auth.service';

const VALID_LOGIN = 'alice';
// Uppercase + lowercase + digit + special character, as required by the form validator
const VALID_PASSWORD = 'Abc' + 'defg1!';

type AuthMock = {
  login: ReturnType<typeof vi.fn>;
  register: ReturnType<typeof vi.fn>;
};

function createMockAuthService(overrides: Partial<AuthMock> = {}): AuthMock {
  return {
    login: vi.fn(() => of({ user: { id: '1', login: 'alice', roles: [] } })),
    register: vi.fn(() => of({ user: { id: '2', login: 'bob', roles: [] } })),
    ...overrides,
  } as AuthMock;
}

function setup(path: string, options: { token?: string | null; auth?: Partial<AuthMock> } = {}) {
  const { token, auth = {} } = options;
  const queryParams: Record<string, string> = {};

  if (token !== undefined && token !== null) {
    queryParams['token'] = token;
  }

  const mockActivatedRoute = {
    snapshot: {
      routeConfig: { path },
      queryParamMap: { get: (key: string) => queryParams[key] ?? null },
    },
  };
  const mockRouter = { navigateByUrl: vi.fn(() => Promise.resolve(true)) };
  const mockAuthService = createMockAuthService(auth);

  TestBed.configureTestingModule({
    imports: [TuiRoot, LoginComponent],
    providers: [
      provideRouter([]),
      provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: mockActivatedRoute },
      { provide: Router, useValue: mockRouter },
      { provide: AuthService, useValue: mockAuthService },
      { provide: TuiNotificationService, useValue: { open: vi.fn(() => of(undefined)) } },
    ],
  });

  const fixture = TestBed.createComponent(LoginComponent);
  fixture.detectChanges();

  return { fixture, mockAuthService, mockRouter };
}

function submitButton(fixture: ComponentFixture<LoginComponent>): HTMLButtonElement {
  const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement | null;

  if (!button) {
    throw new Error('Submit button was not rendered');
  }

  return button;
}

function warnText(fixture: ComponentFixture<LoginComponent>): string | null {
  const notification = fixture.nativeElement.querySelector('[tuiNotification]') as HTMLElement | null;

  return notification?.textContent?.trim() ?? null;
}

function setInputValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function fillForm(fixture: ComponentFixture<LoginComponent>, login = VALID_LOGIN, password = VALID_PASSWORD): void {
  const inputs = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
  const loginInput = inputs.find((input) => input.type !== 'password');
  const passwordInput = inputs.find((input) => input.type === 'password');

  if (!loginInput || !passwordInput) {
    throw new Error('Login form inputs were not rendered');
  }

  setInputValue(loginInput, login);
  setInputValue(passwordInput, password);
  fixture.detectChanges();
}

function submit(fixture: ComponentFixture<LoginComponent>): void {
  const form = fixture.nativeElement.querySelector('form') as HTMLFormElement | null;

  if (!form) {
    throw new Error('Login form was not rendered');
  }

  form.dispatchEvent(new Event('submit', { cancelable: true }));
  fixture.detectChanges();
}

describe('LoginComponent', () => {
  it('should create', () => {
    const { fixture } = setup('login');

    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('route mode', () => {
    it('shows the Login submit button on /login', () => {
      const { fixture } = setup('login');

      expect(submitButton(fixture).textContent?.trim()).toBe('Login');
    });

    it('shows the Register submit button on /register', () => {
      const { fixture } = setup('register');

      expect(submitButton(fixture).textContent?.trim()).toBe('Register');
    });
  });

  describe('login mode', () => {
    it('submit calls authService.login with the form value', () => {
      const { fixture, mockAuthService } = setup('login');

      fillForm(fixture);
      submit(fixture);

      expect(mockAuthService.login).toHaveBeenCalledWith({
        login: VALID_LOGIN,
        password: VALID_PASSWORD,
      });
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('navigates to the default url on success', () => {
      const { fixture, mockRouter } = setup('login');

      fillForm(fixture);
      submit(fixture);

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('does not call authService.login when the form is invalid', () => {
      const { fixture, mockAuthService } = setup('login');

      submit(fixture);

      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('warns on invalid credentials', () => {
      const { fixture } = setup('login', {
        auth: { login: vi.fn(() => throwError(() => ({ status: 401 }))) },
      });

      fillForm(fixture);
      submit(fixture);

      expect(warnText(fixture)).toBe('Invalid credentials');
    });
  });

  describe('register mode', () => {
    it('submit calls authService.register with invitation_token from query param', () => {
      const { fixture, mockAuthService } = setup('register', { token: 'my-token-abc' });

      fillForm(fixture);
      submit(fixture);

      expect(mockAuthService.register).toHaveBeenCalledWith({
        login: VALID_LOGIN,
        password: VALID_PASSWORD,
        invitation_token: 'my-token-abc',
      });
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('warns and does not call register when token is missing', () => {
      const { fixture, mockAuthService } = setup('register', { token: null });

      fillForm(fixture);
      submit(fixture);

      expect(warnText(fixture)).toBe('Invitation token is missing');
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('sets warn on server error', () => {
      const { fixture } = setup('register', {
        token: 'valid-token',
        auth: {
          register: vi.fn(() => throwError(() => ({ error: { error: 'DUPLICATE_LOGIN' } }))),
        },
      });

      fillForm(fixture);
      submit(fixture);

      expect(warnText(fixture)).toBe('DUPLICATE_LOGIN');
    });
  });
});
