import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ssrCookieInterceptor } from '../common/auth/ssr-cookie.interceptor';
import { authInterceptor } from '../common/auth/auth.interceptor';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { provideTaiga, TuiRoot } from '@taiga-ui/core';

@NgModule({
  declarations: [App],
  imports: [BrowserModule, AppRoutingModule, TuiRoot],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    /**
     * HttpClient настроен с fetch-бэкендом (требование Angular SSR)
     * и двумя интерсепторами в строго заданном порядке:
     * 1. ssrCookieInterceptor — пробрасывает Cookie из браузерного запроса
     *    в исходящие API-вызовы при серверном рендеринге
     * 2. authInterceptor — перехватывает 401, запускает refresh и retry.
     *    Должен идти после ssrCookieInterceptor, чтобы рефреш-запросы
     *    тоже получали оригинальные cookies.
     */
    provideHttpClient(
      /** withFetch() обязателен для Angular SSR — вместо XHR используется fetch API,
       *  что позволяет HttpClient корректно работать в Node.js при серверном рендеринге.
       */
      withFetch(),
      /** withInterceptors регистрирует функциональные интерсепторы.
       *  Порядок в массиве имеет значение: первым обрабатывает запрос
       *  ssrCookieInterceptor (добавляет Cookie), затем authInterceptor.
       */
      withInterceptors([
        ssrCookieInterceptor,
        authInterceptor,
      ]),
    ),
    provideTaiga(),
  ],
  bootstrap: [App],
})
export class AppModule {
}
