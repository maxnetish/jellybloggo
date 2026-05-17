import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-root-page',
  imports: [],
  templateUrl: './admin-root-page.html',
  styleUrl: './admin-root-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRootPage {}
