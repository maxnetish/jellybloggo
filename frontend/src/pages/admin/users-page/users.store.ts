import { computed, inject } from '@angular/core';
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
import { pipe, switchMap, tap, catchError } from 'rxjs';
import { of } from 'rxjs';
import { PaginatedResponse } from '../../../common/api/paginated-response';
import { Paged } from '../../../common/api/paged';
import { User } from '../../../common/auth/model/user';
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
        page: { page: state.pageNumber, per_page: state.pageSize } satisfies Paged,
      });
    }

    function onError(error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      notificationService
        .open(message, { appearance: 'error', label: 'Error loading users' })
        .subscribe();
      patchState(store, { isLoading: false });
    }

    function reload() {
      patchState(store, { isLoading: true });
      const state = getState(store);
      loadUsers(state).pipe(
        tap({
          next: (users: PaginatedResponse<User>) =>
            patchState(store, { users, isLoading: false }),
        }),
        catchError((error: unknown) => {
          onError(error);
          return of(undefined);
        }),
      ).subscribe();
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