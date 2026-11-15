import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from '../api/paginated-response';
import { User } from '../auth/model/user';
import { UpdateRolesRequest } from './model/update-roles-request';
import { UsersRequest } from './model/users-request';
import { Sort } from '../api/sort';
import { Paged } from '../api/paged';
import { UsersSortKeys } from './model/users-sort-keys';

/**
 * Сервис для управления пользователями (только для админов).
 *
 * Позволяет получать список пользователей, изменять их роли и удалять аккаунты.
 */
@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Возвращает пагинированный список пользователей.
   *
   * @param params — фильтры и пагинация
   * @returns Observable<PaginatedResponse<User>>
   *
   * @see backend/internal/users/handler.go — метод ListUsers
   * @see GET /api/users
   */
  getUsers({request, page, sort}: {
    request?: UsersRequest;
    page?: Paged;
    sort?: Sort<UsersSortKeys>;
  }) {
    return this.http.get<PaginatedResponse<User>>(
      `${this.baseUrl}/users`,
      {
        params: {
          ...request,
          ...page,
          ...sort,
        },
      }
    );
  }

  /**
   * Устанавливает роли для пользователя.
   *
   * @param request — логин целевого пользователя и список ролей (может быть пустым)
   * @returns Observable<void>
   *
   * @see backend/internal/auth/handler.go — метод SetRoles
   * @see POST /api/auth/roles
   */
  setRoles(request: UpdateRolesRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/roles`, request);
  }

  /**
   * Удаляет пользователя.
   *
   * @param login — логин пользователя для удаления
   * @returns Observable<void>
   *
   * @see backend/internal/auth/handler.go — метод DeleteUser
   * @see DELETE /api/auth/user
   */
  deleteUser(login: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/auth/user`, {body: {login}});
  }
}
