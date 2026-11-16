import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TuiButton, TuiDataList, TuiDropdown, TuiIcon, TuiLink } from '@taiga-ui/core';
import { AuthService } from '../../auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-info',
  imports: [TuiButton, TuiDropdown, TuiIcon, TuiLink, RouterLink, TuiDataList],
  templateUrl: './user-info.component.html',
  styleUrl: './user-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserInfoComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
  protected dropdownOpen = signal(false);

  protected get userLabel(): string {
    const user = this.currentUser();
    return user?.full_name || user?.login || 'User';
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
    });
  }
}
