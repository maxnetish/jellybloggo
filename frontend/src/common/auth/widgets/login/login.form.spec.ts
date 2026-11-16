import { TestBed } from '@angular/core/testing';
import { FieldState } from '@angular/forms/signals';
import { createLoginForm } from './login.form';

describe('createLoginForm', () => {
  let loginForm: ReturnType<typeof createLoginForm>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    loginForm = TestBed.runInInjectionContext(() => createLoginForm());
  });

  function errorKinds(field: FieldState<string>): string[] {
    return field.errors().map((error) => error.kind);
  }

  describe('login', () => {
    it('is required', () => {
      expect(errorKinds(loginForm.login())).toContain('required');
    });

    it('requires at least 3 characters', () => {
      loginForm.login().value.set('ab');

      expect(errorKinds(loginForm.login())).toContain('minLength');
    });

    it('accepts a valid login', () => {
      loginForm.login().value.set('alice');

      expect(errorKinds(loginForm.login())).toEqual([]);
    });
  });

  describe('password', () => {
    it('is required', () => {
      expect(errorKinds(loginForm.password())).toContain('required');
    });

    it('requires at least 8 characters', () => {
      loginForm.password().value.set('Ab1!');

      expect(errorKinds(loginForm.password())).toContain('minLength');
    });

    it('requires uppercase, lowercase, number and special character', () => {
      loginForm.password().value.set('abcdefgh');

      expect(errorKinds(loginForm.password())).toContain('password');
    });

    it('accepts a strong password', () => {
      loginForm.password().value.set('Abcdefg1!');

      expect(errorKinds(loginForm.password())).toEqual([]);
    });

    it('allows the default admin password', () => {
      loginForm.password().value.set('changeme');

      expect(errorKinds(loginForm.password())).toEqual([]);
    });
  });
});
