import { inject, Injectable } from '@angular/core';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { defaultIfEmpty } from 'rxjs';
import type { S3Object } from '@bradenmacdonald/s3-lite-client';
import { S3BucketBrowserStore } from '../s3-bucket-browser/s3-bucket-browser.store';
import { collectExistingNames, lastSegmentOf } from '../../model/s3-path';
import { S3NameDialogComponent } from '../s3-name-dialog/s3-name-dialog.component';
import { S3NameDialogInputs, S3NameDialogOutputs } from '../s3-name-dialog/s3-name-dialog.model';

@Injectable({
  providedIn: 'root',
})
export class S3FileCopyModal {
  private readonly tuiDialogService = inject(TuiDialogService);
  private readonly store = inject(S3BucketBrowserStore);

  show(file: S3Object): ReturnType<TuiDialogService['open']> {
    const inputs: S3NameDialogInputs = {
      fieldLabel: 'File name',
      placeholder: 'Example: copy.jpg',
      initialValue: lastSegmentOf(file.key),
      existingNames: collectExistingNames(this.store.directories(), this.store.files()),
      submit: (name) => this.store.copyFile(file, name),
    };

    return this.tuiDialogService
      .open<S3NameDialogOutputs>(new PolymorpheusComponent(S3NameDialogComponent), {
        data: inputs,
        label: 'Copy file',
        size: 's',
      })
      .pipe(
        // because dialog completes without emit if esc or click outside modal.
        defaultIfEmpty({
          option: 'cancel',
        } as S3NameDialogOutputs),
      );
  }
}
