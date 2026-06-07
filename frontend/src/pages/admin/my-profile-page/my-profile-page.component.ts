import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-my-profile-page',
  imports: [],
  templateUrl: './my-profile-page.component.html',
  styleUrl: './my-profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfilePageComponent {}
