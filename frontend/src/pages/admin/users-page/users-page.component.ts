import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { TuiTable, TuiTablePagination, TuiTablePaginationEvent } from '@taiga-ui/addon-table';
import {
  TuiButton,
  TuiDialogContext,
  TuiDialogService,
  TuiInputDirective,
  TuiLabel,
  TuiLoader,
  TuiNotificationService,
  TuiTextfield,
} from '@taiga-ui/core';
import { TUI_CONFIRM, TuiConfirmData, TuiCopy } from '@taiga-ui/kit';
import { TuiElasticContainer } from '@taiga-ui/layout';
import { catchError, filter, of, switchMap } from 'rxjs';
import { AuthService } from '../../../common/auth/auth.service';
import { Role } from '../../../common/auth/model/user-role';
import { UserRolesComponent } from './user-roles.component';
import { UsersStore } from './users.store';
import { FormsModule } from '@angular/forms';

/**
 * TuiConfirm рендерит content через innerHTML, поэтому данные пользователя
 * обязательно экранируются: логин на бэкенде ограничен только длиной.
 */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

@Component({
  selector: 'app-users-page',
  imports: [
    DatePipe,
    TuiButton,
    TuiElasticContainer,
    TuiInputDirective,
    TuiLabel,
    TuiLoader,
    TuiTable,
    TuiTablePagination,
    TuiTextfield,
    UserRolesComponent,
    TuiCopy,
    FormsModule,
  ],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UsersStore],
})
export class UsersPageComponent {
  @ViewChild('inviteDialog') inviteDialog!: TemplateRef<TuiDialogContext>;

  protected readonly store = inject(UsersStore);
  private readonly dialogs = inject(TuiDialogService);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(TuiNotificationService);

  protected inviteLink = '';

  protected readonly pageSizeOptions = [10, 20, 50] as const;

  constructor() {
    this.store.loadPage();
  }

  protected onInvite(): void {
    this.authService
      .createInvite()
      .pipe(
        switchMap((response) => {
          this.inviteLink = `${window.location.origin}/register?token=${response.token}`;
          return this.dialogs.open(this.inviteDialog, { label: 'Invite link', size: 's' });
        }),
        catchError((err) => {
          const message = err.error?.error ?? err.error?.code ?? err.message ?? 'Failed to create invite link';
          this.notifications.open(message, { appearance: 'negative', label: 'Invite error' }).subscribe();
          return of(undefined);
        }),
      )
      .subscribe();
  }

  protected onPagination({ page, size }: TuiTablePaginationEvent): void {
    if (size !== this.store.pageSize()) {
      // Changing page size resets the page number to the initial value
      this.store.setPageSize(size);
    } else if (page !== this.store.pageNumber()) {
      this.store.setPageNumber(page);
    }
  }

  protected onRolesChange(login: string, roles: Role[]): void {
    this.store.updateRoles({ login, roles });
  }

  protected onDelete(login: string): void {
    this.dialogs
      .open<boolean>(TUI_CONFIRM, {
        label: 'Delete user',
        size: 's',
        data: {
          content: `You are about to permanently delete user <strong>${escapeHtml(login)}</strong>. This action cannot be undone.`,
          yes: 'Delete',
          no: 'Cancel',
          appearance: 'primary-destructive',
        } satisfies TuiConfirmData,
      })
      .pipe(filter(Boolean))
      .subscribe(() => this.store.deleteUser(login));
  }
}
