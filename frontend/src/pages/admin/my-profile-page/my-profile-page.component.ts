import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProfileEditComponent } from '../../../common/auth/widgets/profile-edit/profile-edit.component';

@Component({
  selector: 'app-my-profile-page',
  imports: [ProfileEditComponent],
  templateUrl: './my-profile-page.component.html',
  styleUrl: './my-profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfilePageComponent {}
