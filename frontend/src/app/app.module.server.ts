import { NgModule } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { App } from './app';
import { AppModule } from './app-module';
import { serverRoutes } from './app.routes.server';
import { provideUniversal } from '@ng-web-apis/universal';

@NgModule({
  imports: [AppModule],
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Provide taiga ui server rendering hacks
    provideUniversal(),
  ],
  bootstrap: [App],
})
export class AppServerModule {}
