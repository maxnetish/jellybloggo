import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { REQUEST } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { environment } from '../../environments/environment';

/**
 * Интерсептор, пробрасывающий оригинальные cookies браузера в исходящие
 * HTTP-запросы Angular `HttpClient` при серверном рендеринге (SSR).
 *
 * **Почему это нужно:**
 * В браузере cookies отправляются автоматически. В Node.js, где выполняется SSR,
 * `HttpClient` с `withFetch()` не знает о cookies входящего браузерного запроса.
 * Без этого интерсептора все API-вызовы во время SSR уходят без заголовка `Cookie`,
 * и бэкенд считает пользователя незалогиненным.
 *
 * **Как работает:**
 * 1. Проверяем `isPlatformServer` — в браузере ничего не делаем (там браузер сам
 *    отправляет cookies).
 * 2. Инжектим `REQUEST` — `@angular/ssr` предоставляет через него оригинальный
 *    входящий `Request` браузера.
 * 3. Если запрос идёт к API (`req.url.startsWith(environment.apiUrl)`),
 *    клонируем `HttpRequest` и добавляем заголовок `Cookie`.
 */
export const ssrCookieInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const serverRequest = inject(REQUEST, { optional: true });

  if (isPlatformServer(platformId) && serverRequest?.headers?.get('cookie')) {
    const cookie = serverRequest.headers.get('cookie');
    const isApiRequest = req.url.startsWith(environment.apiUrl);

    if (isApiRequest && cookie) {
      req = req.clone({
        setHeaders: {
          Cookie: cookie,
        },
      });
    }
  }

  return next(req);
};
