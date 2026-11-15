import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TuiIcon } from '@taiga-ui/core';
import { UserInfoComponent } from '../../../common/auth/widgets/user-info/user-info.component';

@Component({
  selector: 'app-admin-header',
  imports: [TuiIcon, RouterLink, UserInfoComponent],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHeaderComponent {}