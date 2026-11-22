import { Component, inject, input } from '@angular/core';
import { S3BucketBrowserStore } from './s3-bucket-browser.store';
import { S3Config } from '../../model/s3-config';
import { lastSegmentOf } from '../../model/s3-path';
import { TuiButton, TuiDialogService, TuiIcon, TuiLink } from '@taiga-ui/core';
import { TuiElasticContainer } from '@taiga-ui/layout';
import { TuiTable } from '@taiga-ui/addon-table';
import { FuncToPipePipe } from '../../../utils/func-to-pipe';
import { DatePipe } from '@angular/common';
import { S3Object } from '@bradenmacdonald/s3-lite-client';
import { tuiBreadcrumbsOptionsProvider } from '@taiga-ui/kit';
import { TuiBreadcrumbs } from '@taiga-ui/kit/components/breadcrumbs';
import { TuiItem } from '@taiga-ui/cdk/directives/item';
import { TuiButtonLoading, TuiCopy } from '@taiga-ui/kit';
import { TUI_CONFIRM, TuiConfirmData } from '@taiga-ui/kit';
import { S3FolderCreateModal } from '../s3-folder-create/s3-folder-create.modal';
import { S3FileCopyModal } from '../s3-file-copy/s3-file-copy.modal';
import { FileSizeForHumanPipe } from '../../file-size';
import { filter } from 'rxjs';
import { S3FileActionsDropdownComponent } from './s3-file-actions-dropdown.component';

@Component({
  imports: [
    TuiIcon,
    TuiElasticContainer,
    TuiTable,
    FuncToPipePipe,
    DatePipe,
    TuiCopy,
    TuiLink,
    TuiBreadcrumbs,
    TuiItem,
    TuiButton,
    TuiButtonLoading,
    FileSizeForHumanPipe,
    S3FileActionsDropdownComponent,
  ],
  selector: 'app-s3-bucket-browser',
  styleUrl: './s3-bucket-browser.scss',
  templateUrl: './s3-bucket-browser.html',
  providers: [
    tuiBreadcrumbsOptionsProvider({icon: '/'}),
  ]
})
export class S3BucketBrowser {
  private readonly store = inject(S3BucketBrowserStore);
  private readonly folderCreateModal = inject(S3FolderCreateModal);
  private readonly fileCopyModal = inject(S3FileCopyModal);
  private readonly dialogs = inject(TuiDialogService);

  readonly bucket = input<S3Config | null>();

  constructor() {
    this.store.wireBucket(this.bucket);
  }

  protected openCreateFolder(): void {
    this.folderCreateModal.show().subscribe();
  }

  protected copyFile(file: S3Object): void {
    this.fileCopyModal.show(file).subscribe();
  }

  protected deleteFile(file: S3Object): void {
    const fileName = lastSegmentOf(file.key);
    this.dialogs.open<boolean>(TUI_CONFIRM, {
      label: 'Delete file',
      size: 's',
      data: {
        content: `Are you sure you want to permanently delete the file <strong>${fileName}</strong>?`,
        yes: 'Delete',
        no: 'Cancel',
        appearance: 'primary-destructive',
      } satisfies TuiConfirmData,
    }).pipe(filter(Boolean)).subscribe(() => {
      this.store.deleteFile(file.key);
    });
  }

  protected readonly lastSegmentOf = lastSegmentOf;

  protected readonly getFileUrl = (entry: S3Object): string => {
    const bucket = this.store.bucket();
    if (!bucket) {
      return '';
    }
    const endpoint = bucket.s3_public_end_point.replace(/\/+$/, '');
    const bucketName = bucket.s3_bucket;
    const key = entry.key;
    return `${endpoint}/${bucketName}/${key}`;
  };

}
