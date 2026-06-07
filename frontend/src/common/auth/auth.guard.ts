import { CanActivateFn, Router } from '@angular/router';
import { Role } from './model/user-role';
import { AuthService } from './auth.service';
import { inject } from '@angular/core';
import { User } from './model/user';
import { map } from 'rxjs';

/**
 * Гуард для приватных путей.
 * Если пользак не залогинен - перекитдывает на страницу входа.
 * Если не хватает ролей, то пока просто подавляется переход.
 *
 * @param param0.role если задано, то требуется пересечения между ролями текущего польака и role.
 *   Иначе требуем только, что пользак был залогинен
 */
export function authGuard({ role }: { role?: Role[] } = {}): CanActivateFn {

  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
      map((currentUser) => {
        // DEBUG
        console.log('read current user', currentUser);

        if (!currentUser) {
          // нет пользователя
          // Переход на страницу логина
          // Capture url to redirect to after login
          const requestedUrl = state.url;

          return router.createUrlTree(['/login'], {
            queryParams: {
              afterLogin: requestedUrl,
            },
            preserveFragment: false,
          });
        }

        const hasPermission = checkPermissions({
          user: currentUser,
          role: role || [],
        });

        if (hasPermission) {
          // Разрешение есть, пропускаем.
          return true;
        }

        // TODO какое внятное сообщение, что не хватает авторитета
        return false;
      }),
    );
  };
}

function checkPermissions({user, role}: {user: User | null; role: Role[]}) {
  if (!user) {
    return false;
  }

  if(role.length === 0) {
    // Подходит любая группа
    return true;
  }

  return role.some((requiredRole) => {
    // Если есть пересечение ролей пользака и необходмых ролей
    return (user.roles || []).some((userRole) => {
      return userRole === requiredRole;
    });
  });
}
