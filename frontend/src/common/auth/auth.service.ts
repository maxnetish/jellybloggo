import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { UserResponse } from './model/user-response';
import { LoginRequest } from './model/login-request';
import { BehaviorSubject, Observable, shareReplay, Subject, tap } from 'rxjs';
import { User } from './model/user';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

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
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // ТОлько в браузере. На сервере пользак всегда будет null.
      // Т.к. непонятно, как в запрос из SSR подложить куки из запроса в express.
      // Нейронки добавили какие то костыли в server.js для этого, долго старались.
      // Но это толком не работает.
      this.loadCurrentUser();
    }
  }

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
    return this.http.post<UserResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        this.currentUserStream$.next(response.user);
      }),
    );
  }

  register(credentials: LoginRequest) {
    return this.http.post<UserResponse>(`${environment.apiUrl}/auth/register`, credentials).pipe(
      tap((response) => {
        this.currentUserStream$.next(response.user);
      }),
    );
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
    return this.http.post<void>(`${environment.apiUrl}/auth/logout`, null).pipe(
      tap(() => {
        this.currentUserStream$.next(null);
      }),
    );
  }

  /**
   * Делает эмит после явного next, то есть после того как полeчили с сервера currentUser.
   * После этого все подпичики currentUser$ получат пользака или null.
   */
  private readonly currentUserStream$ = new Subject<User | null>();

  /**
   * Emits after we receive info about user (possible null).
   */
  readonly currentUser$ = this.currentUserStream$.pipe(shareReplay(1));

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
  private loadCurrentUser() {
    // DEBUG
    console.log('Load current user...');
    this.http.get<UserResponse>(`${environment.apiUrl}/auth/user`).subscribe({
      next: (response) => {
        // DEBUG
        console.log('Get current user', response);
        this.currentUserStream$.next(response.user || null);
      },
    });
  }
}
