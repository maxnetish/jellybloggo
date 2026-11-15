import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TuiNotificationService } from '@taiga-ui/core';
import {
  getState,
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, concatMap } from 'rxjs';
import { of } from 'rxjs';
import { PaginatedResponse } from '../../../common/api/paginated-response';
import { Paged } from '../../../common/api/paged';
import { User } from '../../../common/auth/model/user';
import { UpdateRolesRequest } from '../../../common/users/model/update-roles-request';
import { UsersService } from '../../../common/users/users.service';

type UsersState = {
  users: PaginatedResponse<User> | null;
  pageSize: number;
  pageNumber: number;
  isLoading: boolean;
};

const initialState: UsersState = {
  users: null,
  pageSize: 10,
  pageNumber: 0,
  isLoading: false,
};

export const UsersStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    totalPages: computed(() => store.users()?.pagination.total_pages ?? 0),
    total: computed(() => store.users()?.pagination.total ?? 0),
    content: computed(() => store.users()?.content ?? []),
  })),
  withMethods((store) => {
    const usersService = inject(UsersService);
    const notificationService = inject(TuiNotificationService);

    function loadUsers(state: UsersState) {
      return usersService.getUsers({
        // API is 1-based, while pageNumber in the store is 0-based (UI semantics)
        page: { page: state.pageNumber + 1, per_page: state.pageSize } satisfies Paged,
      });
    }

    function onError(error: unknown, label = 'Error loading users') {
      // Для HttpErrorResponse показываем текст, пришедший от сервера
      // (например, "cannot remove the last admin"), а не generic-сообщение.
      let message = 'An error occurred';

      if (error instanceof HttpErrorResponse) {
        message = error.error?.error ?? error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      notificationService.open(message, { appearance: 'negative', label }).subscribe();
      patchState(store, { isLoading: false });
    }

    function reload() {
      patchState(store, { isLoading: true });
      const state = getState(store);
      loadUsers(state)
        .pipe(
          tap({
            next: (users: PaginatedResponse<User>) =>
              patchState(store, { users, isLoading: false }),
          }),
          catchError((error: unknown) => {
            onError(error);
            return of(undefined);
          }),
        )
        .subscribe();
    }

    // После удаления единственной строки на непустой странице переходим
    // на предыдущую — иначе пользователь останется на пустой таблице.
    function reloadAfterDelete() {
      const { pageNumber } = getState(store);

      if (pageNumber > 0 && store.content().length === 1) {
        patchState(store, { pageNumber: pageNumber - 1 });
      }

      reload();
    }

    return {
      loadPage: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(() => {
            const state = getState(store);
            return loadUsers(state).pipe(
              tap({
                next: (users: PaginatedResponse<User>) =>
                  patchState(store, { users, isLoading: false }),
              }),
              catchError((error: unknown) => {
                onError(error);
                return of(undefined);
              }),
            );
          }),
        ),
      ),
      updateRoles: rxMethod<UpdateRolesRequest>(
        pipe(
          // concatMap: правки разных строк уходят на сервер по очереди, без гонок
          concatMap((request) =>
            usersService.setRoles(request).pipe(
              tap(() => {
                notificationService
                  .open(`Roles updated for ${request.login}`, { appearance: 'positive' })
                  .subscribe();
                reload();
              }),
              catchError((error: unknown) => {
                onError(error, 'Failed to update roles');
                return of(undefined);
              }),
            ),
          ),
        ),
      ),
      deleteUser: rxMethod<string>(
        pipe(
          // concatMap: удаления уходят на сервер по очереди — важно для
          // инварианта "последний админ", чтобы не было гонок между запросами
          concatMap((login) =>
            usersService.deleteUser(login).pipe(
              tap(() => {
                notificationService
                  .open(`User ${login} deleted`, { appearance: 'positive' })
                  .subscribe();
                reloadAfterDelete();
              }),
              catchError((error: unknown) => {
                onError(error, 'Failed to delete user');
                return of(undefined);
              }),
            ),
          ),
        ),
      ),
      setPageNumber: (pageNumber: number) => {
        patchState(store, { pageNumber });
        reload();
      },
      setPageSize: (pageSize: number) => {
        patchState(store, { pageSize, pageNumber: 0 });
        reload();
      },
    };
  }),
);
