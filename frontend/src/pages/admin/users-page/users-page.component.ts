import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiIcon, TuiLoader } from '@taiga-ui/core';
import { UsersStore } from './users.store';

@Component({
  selector: 'app-users-page',
  imports: [TuiIcon, TuiLoader],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UsersStore],
})
export class UsersPageComponent {
  protected readonly store = inject(UsersStore);

  constructor() {
    this.store.loadPage();
  }
}