import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiIcon } from '@taiga-ui/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserInfoComponent } from '../../../common/auth/widgets/user-info/user-info.component';
import { AuthService } from '../../../common/auth/auth.service';
import { Role } from '../../../common/auth/model/user-role';

@Component({
  selector: 'app-admin-header',
  imports: [TuiIcon, RouterLink, UserInfoComponent],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHeaderComponent {
  private readonly authService = inject(AuthService);

  protected readonly currentUser = toSignal(this.authService.currentUser$, { initialValue: null });
  protected readonly Role = Role;
}