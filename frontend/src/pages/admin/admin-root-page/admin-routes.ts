import { Routes } from '@angular/router';
import { authGuard } from '../../../common/auth/auth.guard';

export const adminChildRoutes: Routes = [
  {
    path: 'profile',
    loadComponent: () =>
      import('../my-profile-page/my-profile-page.component').then(
        (m) => m.MyProfilePageComponent,
      ),
    canActivate: [authGuard()],
  },
];
