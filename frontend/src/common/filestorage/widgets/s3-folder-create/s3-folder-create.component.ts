import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, submit } from '@angular/forms/signals';
import {
  TuiButton,
  TuiDialogContext,
  TuiError,
  TuiInputDirective,
  TuiLabel,
  TuiTextfield,
} from '@taiga-ui/core';
import { TuiForm } from '@taiga-ui/layout';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { TuiAutoFocus } from '@taiga-ui/cdk';
import { TuiButtonLoading } from '@taiga-ui/kit';
import { createFolderForm } from './s3-folder-create.form';
import { S3FolderCreateInputs, S3FolderCreateOutputs } from './s3-folder-create.model';

@Component({
  selector: 'app-s3-folder-create',
  imports: [
    FormField,
    FormRoot,
    TuiForm,
    TuiLabel,
    TuiError,
    TuiButton,
    TuiInputDirective,
    TuiTextfield,
    TuiAutoFocus,
    TuiButtonLoading,
  ],
  templateUrl: './s3-folder-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class S3FolderCreateComponent {
  protected readonly context =
    inject<TuiDialogContext<S3FolderCreateOutputs, S3FolderCreateInputs>>(POLYMORPHEUS_CONTEXT);

  protected readonly form = createFolderForm(this.context.data.existingNames);
  protected readonly loading = signal(false);

  protected cancel(): void {
    this.context.completeWith({ option: 'cancel' });
  }

  protected async submit(): Promise<void> {
    await submit(this.form, async () => {
      this.loading.set(true);

      try {
        const created = await this.context.data.store.createFolder(this.form().value().name);

        if (created) {
          this.context.completeWith({ option: 'ok' });
        }
      } finally {
        this.loading.set(false);
      }
    });
  }
}
