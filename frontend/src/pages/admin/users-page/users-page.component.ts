import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';

@Component({
  selector: 'app-users-page',
  imports: [TuiIcon],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPageComponent {}