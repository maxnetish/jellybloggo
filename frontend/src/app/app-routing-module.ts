import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/public/public-root-page/public-root-page').then(m => m.PublicRootPage),
  },
  {
    path: 'admin',
    loadComponent: () => import('../pages/admin/admin-root-page/admin-root-page').then(m => m.AdminRootPage),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
