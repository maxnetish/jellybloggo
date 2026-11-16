import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UserInfoComponent } from '../../../common/auth/widgets/user-info/user-info.component';

@Component({
  selector: 'app-public-root-page',
  imports: [UserInfoComponent],
  templateUrl: './public-root-page.html',
  styleUrl: './public-root-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicRootPage {}
