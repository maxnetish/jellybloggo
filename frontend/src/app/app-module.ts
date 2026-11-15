import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
  withEventReplay,
  withNoIncrementalHydration,
} from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '../common/auth/auth.interceptor';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { provideTaiga, TuiRoot } from '@taiga-ui/core';

@NgModule({
  imports: [BrowserModule, AppRoutingModule, TuiRoot, App],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay(), withNoIncrementalHydration()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideTaiga(),
  ],
  bootstrap: [App],
})
export class AppModule {}
