import { inject, Injectable } from '@angular/core';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { defaultIfEmpty } from 'rxjs';
import { S3BucketBrowserStore } from '../s3-bucket-browser/s3-bucket-browser.store';
import { collectExistingNames } from '../../model/s3-path';
import { S3NameDialogComponent } from '../s3-name-dialog/s3-name-dialog.component';
import { S3NameDialogInputs, S3NameDialogOutputs } from '../s3-name-dialog/s3-name-dialog.model';

@Injectable({
  providedIn: 'root',
})
export class S3FolderCreateModal {
  private readonly tuiDialogService = inject(TuiDialogService);
  private readonly store = inject(S3BucketBrowserStore);

  show(): ReturnType<TuiDialogService['open']> {
    const inputs: S3NameDialogInputs = {
      fieldLabel: 'Folder name',
      placeholder: 'Example: my-folder',
      existingNames: collectExistingNames(this.store.directories(), this.store.files()),
      submit: (name) => this.store.createFolder(name),
    };

    return this.tuiDialogService
      .open<S3NameDialogOutputs>(new PolymorpheusComponent(S3NameDialogComponent), {
        data: inputs,
        label: 'Create folder',
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
