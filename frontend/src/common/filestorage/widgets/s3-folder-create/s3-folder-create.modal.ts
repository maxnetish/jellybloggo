import { inject, Injectable } from '@angular/core';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { defaultIfEmpty } from 'rxjs';
import { S3FolderCreateComponent } from './s3-folder-create.component';
import { S3FolderCreateInputs, S3FolderCreateOutputs } from './s3-folder-create.model';
import { S3BucketBrowserStore } from '../s3-bucket-browser/s3-bucket-browser.store';
import { collectExistingNames } from './s3-folder-create.form';

@Injectable({
  providedIn: 'root',
})
export class S3FolderCreateModal {
  private readonly tuiDialogService = inject(TuiDialogService);
  private readonly store = inject(S3BucketBrowserStore);

  show(): ReturnType<TuiDialogService['open']> {
    const inputs: S3FolderCreateInputs = {
      existingNames: collectExistingNames(this.store.directories(), this.store.files()),
      store: this.store,
    };

    return this.tuiDialogService
      .open<S3FolderCreateOutputs>(new PolymorpheusComponent(S3FolderCreateComponent), {
        data: inputs,
        label: 'Create folder',
        size: 's',
      })
      .pipe(
        // because dialog completes without emit if esc or click outside modal.
        defaultIfEmpty({
          option: 'cancel',
        } as S3FolderCreateOutputs),
      );
  }
}
