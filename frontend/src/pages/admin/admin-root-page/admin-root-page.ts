import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminHeaderComponent } from './admin-header.component';

@Component({
  selector: 'app-admin-root-page',
  imports: [RouterOutlet, AdminHeaderComponent],
  templateUrl: './admin-root-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRootPage {}
