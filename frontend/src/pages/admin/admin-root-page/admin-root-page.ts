import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiNavigation } from '@taiga-ui/layout';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiFade } from '@taiga-ui/kit';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-root-page',
  imports: [
    TuiIcon,
    TuiFade,
    TuiNavigation,
    TuiButton,
    RouterLink,
    RouterOutlet,
  ],
  templateUrl: './admin-root-page.html',
  styleUrl: './admin-root-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRootPage {}
