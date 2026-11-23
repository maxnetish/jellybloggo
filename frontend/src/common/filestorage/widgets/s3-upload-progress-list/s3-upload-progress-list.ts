import { Component, inject } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { TuiProgress } from '@taiga-ui/kit';
import { TuiTable } from '@taiga-ui/addon-table';
import { FileSizeForHumanPipe } from '../../file-size';
import { S3UploadStore } from '../../s3-upload.store';
import { JsonPipe } from '@angular/common';

/**
 * Показывает очередь загрузки файлов из S3UploadStore
 */
@Component({
  imports: [
    TuiButton,
    TuiProgress,
    TuiTable,
    FileSizeForHumanPipe,
    JsonPipe,
  ],
  selector: 'app-s3-upload-progress-list',
  styleUrl: './s3-upload-progress-list.scss',
  templateUrl: './s3-upload-progress-list.html',
})
export class S3UploadProgressList {
  protected readonly uploadStore = inject(S3UploadStore);
}
