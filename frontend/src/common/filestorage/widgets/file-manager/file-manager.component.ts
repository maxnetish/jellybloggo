import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { TuiAppearance, TuiIcon, TuiTitle } from '@taiga-ui/core';
import { TuiButtonGroup, TuiTreeComponent } from '@taiga-ui/kit';
import { AuthService } from '../../../auth/auth.service';
import { S3ConfigService } from '../../s3config.service';
import { BehaviorSubject } from 'rxjs';
import { S3Treenode } from '../../model/s3-treenode';
import { nanoid } from 'nanoid';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-file-manager',
  imports: [
    TuiCardLarge,
    TuiHeader,
    TuiTitle,
    TuiButtonGroup,
    TuiAppearance,
    TuiIcon,
    TuiTreeComponent,
    AsyncPipe,
  ],
  templateUrl: './file-manager.component.html',
  styleUrl: './file-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileManagerComponent {
  private readonly s3ConfigService = inject(S3ConfigService);

  protected readonly treeRootNodes$ = new BehaviorSubject<S3Treenode[]>([]);

  constructor() {
    // Fill in root entries (buckets)
    this.s3ConfigService.getAll().subscribe({
      next: (response) => {
        this.treeRootNodes$.next(
          (response || []).map((entry) => {
            return {
              id: nanoid(6),
              label: entry.config_name || entry.s3_bucket,
              prefix: '/',
              s3Config: entry,
              payload: null,
            };
          }),
        );
      },
    });
  }
}
