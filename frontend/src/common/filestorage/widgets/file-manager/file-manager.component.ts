import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { TuiAppearance, TuiButton, TuiIcon, TuiTitle } from '@taiga-ui/core';
import { TuiButtonGroup, TuiTreeComponent } from '@taiga-ui/kit';
import { S3ConfigService } from '../../s3config.service';
import { BehaviorSubject } from 'rxjs';
import { S3Treenode } from '../../model/s3-treenode';
import { AsyncPipe } from '@angular/common';
import { S3ConfigEditModal } from '../s3-config-edit/s3-config-edit.modal';

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
  private readonly s3ConfigEditModal = inject(S3ConfigEditModal);

  protected readonly treeRootNodes$ = new BehaviorSubject<S3Treenode[]>([]);

  constructor() {
    this.loadConfigs();
  }

  protected openAddDialog(): void {
    this.s3ConfigEditModal.show({ inputs: {} }).subscribe({
      next: () => this.loadConfigs(),
      error: (err) => {
        console.warn(err);
      },
    });
  }

  private loadConfigs(): void {
    this.s3ConfigService.getAll().subscribe({
      next: (response) => {
        this.treeRootNodes$.next(
          (response || []).map((entry) => {
            return {
              id: entry.id,
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
