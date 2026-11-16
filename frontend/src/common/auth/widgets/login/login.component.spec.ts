import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TuiRoot } from '@taiga-ui/core';
import { LoginComponent } from './login.component';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AuthService } from '../../auth.service';
import { TuiNotificationService } from '@taiga-ui/core';

function createMockAuthService(overrides: Partial<{
  login: ReturnType<typeof vi.fn>;
  register: ReturnType<typeof vi.fn>;
}> = {}) {
  return {
    login: vi.fn(() => of({ user: { id: '1', login: 'alice', roles: [] } })),
    register: vi.fn(() => of({ user: { id: '2', login: 'bob', roles: [] } })),
    ...overrides,
  };
}

function createMockNotificationService() {
  return { open: vi.fn(() => of(undefined)) };
}

function setup(path: string, token?: string | null) {
  const queryParams: Record<string, string> = {};
  if (token !== undefined) queryParams['token'] = token as string;

  const mockActivatedRoute = { snapshot: { routeConfig: { path }, queryParamMap: { get: (key: string) => queryParams[key] ?? null } } };

  const mockAuthService = createMockAuthService();
  const mockNotificationService = createMockNotificationService();

  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;

  TestBed.configureTestingModule({
    imports: [TuiRoot, LoginComponent],
    providers: [
      provideRouter([]),
      provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: mockActivatedRoute },
      { provide: AuthService, useValue: mockAuthService },
      { provide: TuiNotificationService, useValue: mockNotificationService },
    ],
  }).compileComponents();

  fixture = TestBed.createComponent(LoginComponent);
  component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, mockAuthService };
}

describe('LoginComponent', () => {
  it('should create', () => {
    const { component } = setup('login');
    expect(component).toBeTruthy();
  });

  describe('route mode', () => {
    it('isRegister is false on /login', () => {
      const { component } = setup('login');
      expect(component.isRegister()).toBe(false);
    });

    it('isRegister is true on /register', () => {
      const { component } = setup('register');
      expect(component.isRegister()).toBe(true);
    });
  });

  describe('login mode', () => {
    it('submit calls authService.login', () => {
      const { fixture, mockAuthService } = setup('login');
      fixture.nativeElement.querySelector('button[type="submit"]').click();
      expect(mockAuthService.login).toHaveBeenCalled();
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });
  });

  describe('register mode', () => {
    it('submit calls authService.register with invitation_token from query param', () => {
      const { fixture, mockAuthService } = setup('register', 'my-token-abc');
      fixture.nativeElement.querySelector('button[type="submit"]').click();
      expect(mockAuthService.register).toHaveBeenCalledWith({
        login: '',
        password: '',
        invitation_token: 'my-token-abc',
      });
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('warns and does not call register when token is missing', () => {
      const { fixture, component, mockAuthService } = setup('register', null);
      fixture.nativeElement.querySelector('button[type="submit"]').click();
      fixture.detectChanges();
      expect(component.warn()).toBe('Invitation token is missing');
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('sets warn on server error', () => {
      const errorResponse = { error: { error: 'DUPLICATE_LOGIN' } };
      const mockAuthService = createMockAuthService({
        register: vi.fn(() => {
          throw errorResponse;
        }),
      });
      const mockActivatedRoute = {
        snapshot: {
          routeConfig: { path: 'register' },
          queryParamMap: { get: () => 'valid-token' },
        },
      };

      TestBed.configureTestingModule({
        imports: [TuiRoot, LoginComponent],
        providers: [
          provideRouter([]),
          provideHttpClientTesting(),
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
          { provide: AuthService, useValue: mockAuthService },
          { provide: TuiNotificationService, useValue: createMockNotificationService() },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(LoginComponent);
      fixture.detectChanges();
      fixture.nativeElement.querySelector('button[type="submit"]').click();
      fixture.detectChanges();

      const component = fixture.componentInstance;
      expect(component.warn()).toBe('DUPLICATE_LOGIN');
    });
  });
});
