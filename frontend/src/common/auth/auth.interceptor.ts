import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { REQUEST, REQUEST_CONTEXT } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { BehaviorSubject, catchError, filter, from, switchMap, take, throwError } from 'rxjs';
import type { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

/**
 * Глобальный интерсептор для обработки 401 Unauthorized и автоматического
 * обновления access_token.
 *
 * **Браузер:**
 * При получении 401 вызывает `AuthService.refresh()`, дожидается результата
 * и ретраит оригинальный запрос. Если параллельно несколько запросов получили 401,
 * только первый запускает рефреш — остальные подписываются на общий
 * `refreshSubject` и ждут одного результата.
 *
 * **SSR:**
 * Использует нативный `fetch()` вместо `HttpClient`, потому что `fetch()`
 * даёт прямой доступ к `response.headers.getSetCookie()`. Это единственный
 * надёжный способ прочитать `Set-Cookie` заголовки в Node.js.
 * Новые cookies сохраняются в `REQUEST_CONTEXT`, чтобы Express мог
 * перенаправить их в ответ браузеру.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);
  const serverRequest = inject(REQUEST, { optional: true });
  const requestContext = inject(REQUEST_CONTEXT, { optional: true }) as
    | { setCookies: string[] }
    | null;

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      const url = req.url;
      // Пропускаем auth-эндпоинты, чтобы не уйти в бесконечный цикл:
      // если /auth/refresh сам вернул 401, повторный рефреш бессмысленен.
      if (
        url.includes('/auth/refresh') ||
        url.includes('/auth/login') ||
        url.includes('/auth/logout')
      ) {
        return throwError(() => error);
      }

      if (isPlatformBrowser(platformId)) {
        return handleBrowser401(req, next, authService, error);
      }

      if (isPlatformServer(platformId)) {
        return handleServer401(req, next, serverRequest, requestContext, error);
      }

      return throwError(() => error);
    }),
  );
};

/**
 * Модуль-уровневые переменные для координации параллельных запросов
 * при рефреше в браузере.
 *
 * `isRefreshing` — флаг, что рефRESH уже запущен.
 * `refreshSubject` — горячий Observable, на который подписываются
 * все параллельные запросы, получившие 401, чтобы дождаться одного
 * результата и не дублировать вызовы `/api/auth/refresh`.
 */
let isRefreshing = false;
let refreshSubject: BehaviorSubject<boolean | null> | null = null;

/**
 * Обработка 401 в браузере.
 *
 * Последовательность:
 * 1. Если рефреш ещё не запущен (`!isRefreshing`), запускаем
 *    `AuthService.refresh()` и создаём `refreshSubject`.
 * 2. Все параллельные запросы, независимо от того, кто первым получил 401,
 *    подписываются на `refreshSubject` и ждут `true` (успех) или `false` (неудача).
 * 3. При успехе ретраим оригинальный запрос через `next(req)`.
 *    При неудаче пробрасываем исходную ошибку 401 дальше.
 */
function handleBrowser401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  originalError: HttpErrorResponse,
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshSubject = new BehaviorSubject<boolean | null>(null);

    authService.refresh().subscribe({
      next: () => {
        isRefreshing = false;
        refreshSubject?.next(true);
        refreshSubject?.complete();
      },
      error: () => {
        isRefreshing = false;
        refreshSubject?.next(false);
        refreshSubject?.complete();
      },
    });
  }

  return refreshSubject!.pipe(
    filter((result): result is boolean => result !== null),
    take(1),
    switchMap((success) => {
      if (!success) {
        return throwError(() => originalError);
      }
      return next(req);
    }),
  );
}

/**
 * Обработка 401 в SSR.
 *
 * Делегирует всю логику `handleSsrRefresh()`, которая работает через
 * нативный `fetch()` и возвращает `Promise<HttpRequest>`.
 * `from()` конвертирует Promise в Observable, после чего делаем retry.
 */
function handleServer401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  serverRequest: Request | null,
  requestContext: { setCookies: string[] } | null,
  originalError: HttpErrorResponse,
): Observable<HttpEvent<unknown>> {
  return from(handleSsrRefresh(req, serverRequest, requestContext)).pipe(
    switchMap((newReq) => next(newReq)),
    catchError(() => throwError(() => originalError)),
  );
}

/**
 * SSR-реализация refresh с использованием нативного `fetch()`.
 *
 * **Почему `fetch()` вместо `HttpClient`:**
 * Angular `HttpResponse` скрывает raw `Response`. В Node.js fetch-ответ
 * `Set-Cookie` доступен только через `headers.getSetCookie()` — метод,
 * которого нет в `HttpHeaders` Angular.
 *
 * **Что происходит:**
 * 1. Защита от бесконечного цикла: если запрос уже содержит
 *    `X-Refresh-Retry`, бросаем ошибку.
 * 2. Вызываем `/api/auth/refresh` через `fetch()`.
 * 3. Если бэкенд вернул `Set-Cookie`, сохраняем их в `requestContext`
 *    (Express перенаправит их браузеру).
 * 4. Если рефреш неуспешен — вызываем `/api/auth/logout`, чтобы бэкенд
 *    очистил невалидный `refresh_token`. Cookies из logout-ответа тоже
 *    сохраняем в `requestContext`.
 * 5. При успешном рефреше парсим новые cookies из `Set-Cookie` и клонируем
 *    оригинальный `HttpRequest` с обновлённым заголовком `Cookie`.
 */
async function handleSsrRefresh(
  req: HttpRequest<unknown>,
  serverRequest: Request | null,
  requestContext: { setCookies: string[] } | null,
): Promise<HttpRequest<unknown>> {
  // Если запрос уже был ретраен после рефреша — не пытаемся снова,
  // чтобы не уйти в бесконечный цикл при повторном 401.
  if (req.headers.has('X-Refresh-Retry')) {
    throw new Error('Already retried after refresh');
  }

  const origin = serverRequest
    ? new URL(serverRequest.url).origin
    : environment.backendProxy;
  const cookieHeader = serverRequest?.headers.get('cookie') || '';

  const refreshResponse = await fetch(`${origin}${environment.apiUrl}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
  });

  // Сохраняем Set-Cookie из ответа рефреша в REQUEST_CONTEXT.
  // Express позже допишет эти cookies в ответ браузеру.
  if (requestContext && refreshResponse.headers.has('set-cookie')) {
    const cookies = ((refreshResponse.headers as unknown as { getSetCookie(): string[] }).getSetCookie?.()) || [];
    requestContext.setCookies.push(...cookies);
  }

  if (!refreshResponse.ok) {
    // Refresh невалиден — вызываем logout, чтобы бэкенд очистил
    // refresh_token куку и завершил сессию.
    const logoutResponse = await fetch(`${origin}${environment.apiUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
    });

    if (requestContext && logoutResponse.headers.has('set-cookie')) {
      const cookies = ((logoutResponse.headers as unknown as { getSetCookie(): string[] }).getSetCookie?.()) || [];
      requestContext.setCookies.push(...cookies);
    }

    throw new Error('Refresh failed');
  }

  // Парсим Set-Cookie вида "name=value; HttpOnly; ..." и берём
  // только "name=value" часть, чтобы собрать новый Cookie заголовок.
  const setCookies =
    ((refreshResponse.headers as unknown as { getSetCookie(): string[] }).getSetCookie?.()) || [];
  const newCookiePairs = setCookies
    .map((cookie) => cookie.split(';')[0].trim())
    .join('; ');

  return req.clone({
    setHeaders: {
      Cookie: newCookiePairs,
      'X-Refresh-Retry': '1',
    },
  });
}
