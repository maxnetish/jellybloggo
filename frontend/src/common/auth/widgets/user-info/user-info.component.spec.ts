import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { UserInfoComponent } from './user-info.component';
import { AuthService } from '../../auth.service';
import { TuiButton, TuiDropdown, TuiIcon, TuiLink } from '@taiga-ui/core';
import { RouterLink } from '@angular/router';

describe('UserInfoComponent', () => {
  function setup(currentUser: any) {
    const mockAuthService = {
      currentUser$: of(currentUser),
      logout: () => of(void 0),
    };

    TestBed.configureTestingModule({
      imports: [UserInfoComponent, TuiButton, TuiDropdown, TuiIcon, TuiLink, RouterLink],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    const fixture = TestBed.createComponent(UserInfoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    return { fixture, component };
  }

  it('should create', () => {
    const { component } = setup(null);
    expect(component).toBeTruthy();
  });

  it('should show Login button when user is not logged in', () => {
    const { fixture } = setup(null);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[routerLink="/login"]')).toBeTruthy();
  });

  it('should show user name when user is logged in with full_name', () => {
    const { fixture } = setup({ full_name: 'John Doe', login: 'john' });
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('John Doe');
  });

  it('should show login when user has no full_name', () => {
    const { fixture } = setup({ full_name: '', login: 'john' });
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('john');
  });

  it('should show dropdown button with user name when logged in', () => {
    const { fixture } = setup({ full_name: 'John', login: 'john' });
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('John');
    expect(compiled.querySelector('button')).toBeTruthy();
  });
});