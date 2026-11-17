import {
  ChangeDetectionStrategy,
  Component,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiCheckbox, TuiDataList, TuiDropdown } from '@taiga-ui/core';
import { User } from '../../../common/auth/model/user';
import { Role } from '../../../common/auth/model/user-role';

const ALL_ROLES = Object.values(Role);

/**
 * Ячейка Roles: показывает роли пользователя и позволяет изменить их
 * через dropdown с чекбоксами.
 *
 * Выпадашка не закрывается при клике по опциям — можно отметить/снять
 * несколько ролей за раз. Новый набор отдаётся наружу только при закрытии
 * выпадашки и только если он отличается от текущего.
 */
@Component({
  selector: 'app-user-roles',
  imports: [FormsModule, TuiButton, TuiCheckbox, TuiDataList, TuiDropdown],
  template: `
    <button
      iconStart="@tui.user-round-pen"
      appearance="flat"
      size="s"
      tuiIconButton
      type="button"
      [tuiAppearanceState]="open() ? 'hover' : null"
      [tuiDropdown]="dropdown"
      [tuiDropdownMaxHeight]="320"
      [tuiDropdownOpen]="open()"
      (tuiDropdownOpenChange)="onOpenChange($event)"
      title="Edit roles"
    >
      Change roles
    </button>
    <span class="roles">{{ user().roles.join(', ') || '—' }}</span>

    <ng-template #dropdown>
      <tui-data-list [style.width.rem]="10">
        @for (role of roles; track role) {
          <label class="option" tuiOption>
            <input
              size="s"
              tuiCheckbox
              type="checkbox"
              [ngModel]="draft().has(role)"
              (ngModelChange)="onToggle(role, $event)"
            />
            {{ role }}
          </label>
        }
      </tui-data-list>
    </ng-template>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      min-inline-size: 0;
    }

    .roles {
      flex: 0 1 auto;
      min-inline-size: 0;
    }

    .option {
      gap: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserRolesComponent {
  readonly user = input.required<User>();
  readonly rolesChange = output<Role[]>();

  protected readonly roles = ALL_ROLES;
  protected readonly open = signal(false);
  protected readonly draft = linkedSignal(() => new Set(this.user().roles));

  protected onToggle(role: Role, checked: boolean): void {
    this.draft.update((draft) => {
      const next = new Set(draft);

      if (checked) {
        next.add(role);
      } else {
        next.delete(role);
      }

      return next;
    });
  }

  protected onOpenChange(open: boolean): void {
    this.open.set(open);

    if (open) {
      return;
    }

    const current = this.user().roles;
    // Порядок опций, а не порядок кликов — так набор стабилен
    const next = this.roles.filter((role) => this.draft().has(role));
    const changed = current.length !== next.length || next.some((role) => !current.includes(role));

    if (changed) {
      this.rolesChange.emit(next);
    }
  }
}
