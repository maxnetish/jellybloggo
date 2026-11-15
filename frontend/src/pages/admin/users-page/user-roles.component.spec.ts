import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTaiga, TuiRoot } from '@taiga-ui/core';
import { User } from '../../../common/auth/model/user';
import { Role } from '../../../common/auth/model/user-role';
import { UserRolesComponent } from './user-roles.component';

const user: User = {
  id: '1',
  login: 'alice',
  roles: [Role.admin],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

@Component({
  imports: [TuiRoot, UserRolesComponent],
  template: `
    <tui-root>
      <app-user-roles [user]="user" />
    </tui-root>
  `,
})
class Host {
  protected readonly user = user;
}

describe('UserRolesComponent', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideTaiga()],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  function component(): UserRolesComponent {
    return fixture.debugElement.query(By.directive(UserRolesComponent)).componentInstance;
  }

  function trigger(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('app-user-roles > button');
  }

  function checkbox(): HTMLInputElement | null {
    return document.querySelector<HTMLInputElement>('input[tuiCheckbox]');
  }

  it('renders interactive checkbox in the open dropdown', async () => {
    trigger().click();
    await fixture.whenStable();

    expect(checkbox()).toBeTruthy();
    expect(checkbox()?.disabled).toBe(false);
    expect(checkbox()?.checked).toBe(true);
  });

  it('keeps dropdown open and toggles state on label click', async () => {
    trigger().click();
    await fixture.whenStable();

    const input = checkbox();

    input?.closest('label')?.click();
    await fixture.whenStable();

    expect(checkbox()).toBeTruthy();
    expect(input?.checked).toBe(false);
  });

  it('emits new roles when the dropdown is closed', async () => {
    const emitted: Role[][] = [];
    component().rolesChange.subscribe((roles) => emitted.push(roles));

    trigger().click();
    await fixture.whenStable();

    checkbox()?.closest('label')?.click();
    await fixture.whenStable();

    trigger().click();
    await fixture.whenStable();

    expect(emitted).toEqual([[]]);
  });
});
