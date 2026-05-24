import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
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
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor]),
    ),
    provideTaiga(),
  ],
  bootstrap: [App],
})
export class AppModule {
}
