import { Component, TemplateRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TuiDialogService, provideTaiga, TuiRoot, TuiNotificationService } from '@taiga-ui/core';
import { EMPTY, Observable, of } from 'rxjs';
import { PaginatedResponse } from '../../../common/api/paginated-response';
import { AuthService } from '../../../common/auth/auth.service';
import { Role } from '../../../common/auth/model/user-role';
import { User } from '../../../common/auth/model/user';
import { UsersService } from '../../../common/users/users.service';
import { UsersPageComponent } from './users-page.component';

const user: User = {
  id: '1',
  login: 'alice',
  roles: [Role.reader],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const response: PaginatedResponse<User> = {
  content: [user],
  pagination: {
    page: 1,
    per_page: 10,
    total: 1,
    total_pages: 1,
    sort_by: '',
    sort_dir: '',
  },
};

@Component({
  imports: [TuiRoot, UsersPageComponent],
  template: `
    <tui-root>
      <app-users-page />
    </tui-root>
  `,
})
class Host {}

describe('UsersPageComponent delete', () => {
  let fixture: ComponentFixture<Host>;
  let open: ReturnType<typeof vi.fn>;
  let deleteUser: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    open = vi.fn((): Observable<boolean> => of(true));
    deleteUser = vi.fn((): Observable<void> => of(undefined));

    const usersService = {
      getUsers: () => of(response),
      setRoles: () => of(undefined),
      deleteUser,
    };

    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideTaiga(),
        { provide: UsersService, useValue: usersService },
        { provide: TuiDialogService, useValue: { open } },
        { provide: TuiNotificationService, useValue: { open: () => EMPTY } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  function page(): UsersPageComponent {
    return fixture.debugElement.query(By.directive(UsersPageComponent)).componentInstance;
  }

  function deleteButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[title="Delete user"]');
  }

  it('renders a destructive delete button in the last column', () => {
    const button = deleteButton();

    expect(button).toBeTruthy();
    expect(button.getAttribute('appearance')).toBe('flat-destructive');
  });

  it('deletes the user after confirmation', async () => {
    deleteButton().click();
    await fixture.whenStable();

    const [, options] = open.mock.calls[0];

    expect(options.label).toBe('Delete user');
    expect(options.data.yes).toBe('Delete');
    expect(options.data.no).toBe('Cancel');
    expect(options.data.appearance).toBe('primary-destructive');
    expect(deleteUser).toHaveBeenCalledWith('alice');
  });

  it('does not delete the user when confirmation is cancelled', async () => {
    open.mockReturnValue(of(false));

    deleteButton().click();
    await fixture.whenStable();

    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('escapes the login before rendering confirm content as HTML', () => {
    const unsafeLogin = '<img src=x onerror="alert(1)">';

    (page() as unknown as { onDelete(login: string): void }).onDelete(unsafeLogin);

    const [, options] = open.mock.calls[0];

    expect(options.data.content).toContain('&#60;img');
    expect(options.data.content).not.toContain('<img');
  });
});

describe('UsersPageComponent invite', () => {
  let fixture: ComponentFixture<Host>;
  let openDialog: ReturnType<typeof vi.fn>;
  let openNotification: ReturnType<typeof vi.fn>;
  let createInvite: ReturnType<typeof vi.fn>;

  const inviteResponse = { token: 'test-token-abc', expires_at: '2026-11-18T12:00:00Z' };

  beforeEach(async () => {
    openDialog = vi.fn((): Observable<unknown> => of(undefined));
    openNotification = vi.fn((): Observable<unknown> => of(undefined));
    createInvite = vi.fn((): Observable<{ token: string; expires_at: string }> => of(inviteResponse));

    const usersService = { getUsers: () => of(response), setRoles: () => of(undefined), deleteUser: vi.fn() };
    const authService = { createInvite };

    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideTaiga(),
        { provide: UsersService, useValue: usersService },
        { provide: AuthService, useValue: authService },
        { provide: TuiDialogService, useValue: { open: openDialog } },
        { provide: TuiNotificationService, useValue: { open: openNotification } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  function inviteButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[title="Invite"]') as HTMLButtonElement;
  }

  it('renders an Invite button in the header', () => {
    const button = inviteButton();
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toBe('Invite');
  });

  it('creates invite and opens dialog with invite link', async () => {
    inviteButton().click();
    await fixture.whenStable();

    expect(createInvite).toHaveBeenCalled();
    const [template, options] = openDialog.mock.calls[0];
    expect(options.label).toBe('Invite link');
    expect(options.size).toBe('s');
    expect((template as unknown as TemplateRef<unknown>)).toBeTruthy();
  });

  it('shows notification on invite error', async () => {
    createInvite.mockReturnValue(
      new Observable((subscriber) => {
        subscriber.error({ message: 'Forbidden' });
      }),
    );

    inviteButton().click();
    await fixture.whenStable();

    expect(openNotification).toHaveBeenCalled();
    const [message, opts] = openNotification.mock.calls[0];
    expect(message).toBe('Forbidden');
    expect(opts.appearance).toBe('negative');
    expect(openDialog).not.toHaveBeenCalled();
  });
});
