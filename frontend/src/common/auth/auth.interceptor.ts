import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { REQUEST_CONTEXT } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const requestContext = inject(REQUEST_CONTEXT, { optional: true }) as
    | { setCookies: string[] }
    | null;

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      if (isPlatformServer(platformId) && requestContext) {
        const setCookieHeaders = error.headers.getAll('set-cookie');
        if (setCookieHeaders) {
          for (const cookie of setCookieHeaders) {
            if (!requestContext.setCookies.includes(cookie)) {
              requestContext.setCookies.push(cookie);
            }
          }
        }
      }

      return throwError(() => error);
    }),
  );
};