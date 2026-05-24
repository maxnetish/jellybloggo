import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { UserResponse } from './model/user-response';
import { LoginRequest } from './model/login-request';
import { Observable } from 'rxjs';

/**
 * Сервис для взаимодействия с auth-эндпоинтами бэкенда.
 *
 * Все токены хранятся в HTTP-only cookies (устанавливаются бэкендом).
 * Сервис не хранит токены в памяти или localStorage — cookies отправляются
 * браузером автоматически.
 *
 * @see backend/internal/auth/README_UI.md — полный контракт API
 */
@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly http = inject(HttpClient);

  /**
   * Аутентификация пользователя.
   *
   * Отправляет credentials бэкенду, который в случае успеха устанавливает
   * `access_token` и `refresh_token` в HTTP-only cookies.
   *
   * @param credentials — логин и пароль
   * @returns Observable с данными пользователя
   *
   * @see backend/internal/auth/README_UI.md — раздел "Login"
   * @see backend/internal/auth/handler.go — метод LoginHandler
   */
  login(credentials: LoginRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${environment.apiUrl}/auth/login`, credentials);
  }

  /**
   * Выход из системы.
   *
   * Инвалидирует сессию на бэкенде. Бэкенд отправляет `Set-Cookie`
   * заголовки для очистки `access_token` и `refresh_token`.
   *
   * @returns Observable<void>
   *
   * @see backend/internal/auth/README_UI.md — раздел "Logout"
   * @see backend/internal/auth/handler.go — метод LogoutHandler
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/logout`, null);
  }

  /**
   * Получение текущего авторизованного пользователя.
   *
   * Бэкенд читает `access_token` из cookie и возвращает данные пользователя.
   * Если токен отсутствует или просрочен — возвращает `{ user: null }`.
   *
   * @returns Observable с данными пользователя или `{ user: null }`
   *
   * @see backend/internal/auth/README_UI.md — раздел "Get Current User"
   * @see backend/internal/auth/handler.go — метод GetCurrentUserHandler
   */
  getCurrentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${environment.apiUrl}/auth/user`);
  }
}
