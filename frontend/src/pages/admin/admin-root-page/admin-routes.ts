import { Routes } from '@angular/router';
import { authGuard } from '../../../common/auth/auth.guard';

export const adminChildRoutes: Routes = [
  { path: '', redirectTo: 'profile', pathMatch: 'full' },
  {
    path: 'profile',
    loadComponent: () =>
      import('../my-profile-page/my-profile-page.component').then((m) => m.MyProfilePageComponent),
    canActivate: [authGuard()],
  },
  {
    path: 'filemanager',
    loadComponent: () => {
      return import('../file-manager-page/file-manager-page.component').then(
        (m) => m.FileManagerPageComponent,
      );
    },
    canActivate: [authGuard()],
  },
];
