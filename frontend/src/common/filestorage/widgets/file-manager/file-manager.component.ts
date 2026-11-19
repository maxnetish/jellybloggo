import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TuiCard, TuiHeader, TuiSurface } from '@taiga-ui/layout';
import { TuiAppearance, TuiButton, TuiDataList, TuiDialogService, TuiDropdown, TuiTitle } from '@taiga-ui/core';
import { TUI_CONFIRM, TuiChevron, TuiConfirmData } from '@taiga-ui/kit';
import { S3ConfigEditModal } from '../s3-config-edit/s3-config-edit.modal';
import { FileManagerStore } from './file-manager.store';
import { TuiActiveZone, TuiObscured } from '@taiga-ui/cdk';
import { S3Config } from '../../model/s3-config';
import { filter } from 'rxjs';
import { S3BucketBrowser } from '../s3-bucket-browser/s3-bucket-browser';

@Component({
  selector: 'app-file-manager',
  imports: [
    TuiHeader,
    TuiTitle,
    TuiButton,
    TuiChevron,
    TuiDropdown,
    TuiObscured,
    TuiActiveZone,
    TuiObscured,
    TuiDataList,
    S3BucketBrowser,
    TuiCard,
    TuiSurface,
    TuiAppearance,
  ],
  templateUrl: './file-manager.component.html',
  styleUrl: './file-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    FileManagerStore,
  ],
})
export class FileManagerComponent implements OnInit {
  private readonly dialogs = inject(TuiDialogService);
  protected readonly store = inject(FileManagerStore);

  private readonly s3ConfigEditModal = inject(S3ConfigEditModal);

  constructor() {
  }

  ngOnInit() {
    this.store.loadS3Configs();
  }

  protected openAddDialog(): void {
    this.s3ConfigEditModal.show({inputs: {}}).subscribe({
      next: (outputs) => {
        if (outputs.option === 'ok' && outputs.config) {
          this.store.updateOrAddS3Config(outputs.config);
        }
      },
      error: (err) => {
        console.warn(err);
      },
    });
  }

  protected onEditConfig(config: S3Config) {
    this.s3ConfigEditModal.show({inputs: {config}}).subscribe({
      next: (outputs) => {
        if (outputs.option === 'ok' && outputs.config) {
          this.store.updateOrAddS3Config(outputs.config);
        }
      },
      error: (err) => {
        console.warn(err);
      },
    });
  }

  protected onRemoveConfig(config: S3Config) {
    this.dialogs
      .open<boolean>(TUI_CONFIRM, {
        label: 'Delete bucket',
        size: 's',
        data: {
          content: `You are about to delete storage bucket config <strong>${config.config_name}</strong>. This action will not remove any files in cloud storage, but only remove corresponding record in application.`,
          yes: 'Delete',
          no: 'Cancel',
          appearance: 'primary-destructive',
        } satisfies TuiConfirmData,
      }).pipe(
      filter(Boolean),
    ).subscribe(() => {
      this.store.removeS3Config(config);
    });
  }

}
