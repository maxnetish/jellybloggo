import { Component, effect, inject, input } from '@angular/core';
import { S3BucketBrowserStore } from './s3-bucket-browser.store';
import { S3Config } from '../../model/s3-config';
import { lastSegmentOf } from '../../model/s3-path';
import { TuiButton, TuiCheckbox, TuiDialogService, TuiIcon, TuiLink } from '@taiga-ui/core';
import { TuiElasticContainer } from '@taiga-ui/layout';
import { FuncToPipePipe } from '../../../utils/func-to-pipe';
import { DatePipe } from '@angular/common';
import { S3Object } from '@bradenmacdonald/s3-lite-client';
import { tuiBreadcrumbsOptionsProvider, TuiFiles } from '@taiga-ui/kit';
import { TuiBreadcrumbs } from '@taiga-ui/kit/components/breadcrumbs';
import { TuiItem } from '@taiga-ui/cdk/directives/item';
import { TuiButtonLoading } from '@taiga-ui/kit';
import { TUI_CONFIRM, TuiConfirmData } from '@taiga-ui/kit';
import { S3FolderCreateModal } from '../s3-folder-create/s3-folder-create.modal';
import { S3FileCopyModal } from '../s3-file-copy/s3-file-copy.modal';
import { FileSizeForHumanPipe } from '../../file-size';
import { filter } from 'rxjs';
import { S3FileActionsDropdownComponent } from './s3-file-actions-dropdown.component';
import { FilesChooser } from '../files-chooser/files-chooser';
import { S3UploadStore } from '../../s3-upload.store';
import { S3UploadProgressList } from '../s3-upload-progress-list/s3-upload-progress-list';
import { FormsModule } from '@angular/forms';
import { customAlphabet } from 'nanoid';

const generateRandomKey = customAlphabet('qwertyuiopasdfghjklzxcvbnm', 16);

@Component({
  imports: [
    TuiIcon,
    TuiElasticContainer,
    FuncToPipePipe,
    DatePipe,
    TuiLink,
    TuiBreadcrumbs,
    TuiItem,
    TuiButton,
    TuiButtonLoading,
    TuiFiles,
    FileSizeForHumanPipe,
    S3FileActionsDropdownComponent,
    FilesChooser,
    S3UploadProgressList,
    TuiCheckbox,
    FormsModule,
  ],
  selector: 'app-s3-bucket-browser',
  styleUrl: './s3-bucket-browser.scss',
  templateUrl: './s3-bucket-browser.html',
  providers: [
    tuiBreadcrumbsOptionsProvider({icon: '/'}),
  ],
})
export class S3BucketBrowser {
  private readonly store = inject(S3BucketBrowserStore);
  private readonly folderCreateModal = inject(S3FolderCreateModal);
  private readonly fileCopyModal = inject(S3FileCopyModal);
  private readonly dialogs = inject(TuiDialogService);
  protected readonly uploadStore = inject(S3UploadStore);

  readonly bucket = input<S3Config | null>();

  constructor() {
    this.store.wireBucket(this.bucket);

    // Когда загрузка успешно завершается — вставить файл в таблицу и убрать из очереди
    effect(() => {
      // Явно читаем status() каждого progress — Angular отслеживает эти сигналы,
      // чтобы effect срабатывал при изменении статуса (queue при этом не мутируется).
      const queue = this.uploadStore.queue();
      for (const entry of queue) {
        if (entry.progress) {
          entry.progress.status();
        }
      }

      const currentPrefix = this.store.currentPrefix();
      const currentBucket = this.store.bucket();
      if (!currentBucket) return;

      // Ищем завершённые загрузки, которые ещё не обработаны
      const completedEntries = this.uploadStore.queue().filter(
        (e) =>
          e.progress?.status() === 'success' &&
          e.prefix === currentPrefix &&
          e.bucket.id === currentBucket.id,
      );

      for (const completed of completedEntries) {
        const newObject: S3Object = {
          type: 'Object',
          key: `${completed.prefix}${completed.overrideFileName || completed.file.name}`,
          size: completed.file.size,
          etag: '',
          lastModified: new Date(),
        };
        this.store.insertEntry(newObject);
        this.uploadStore.removeById(completed.id);
      }
    });
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

  protected handleChooseFileToUpload($event: File) {
    const bucket = this.store.bucket();

    if (!bucket) {
      throw new Error('Missing s3 bucket');
    }

    this.uploadStore.add({
      file: $event,
      prefix: this.store.currentPrefix(),
      bucket,
      overrideFileName: this.store.useRandomUploadFileName()
        ? generateRandomKey()
        : undefined,
    });
  }
}
