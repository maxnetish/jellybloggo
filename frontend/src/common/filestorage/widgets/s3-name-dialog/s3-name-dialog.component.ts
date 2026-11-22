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
import { createNameForm } from './s3-name-dialog.form';
import { S3NameDialogInputs, S3NameDialogOutputs } from './s3-name-dialog.model';

@Component({
  selector: 'app-s3-name-dialog',
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
  templateUrl: './s3-name-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class S3NameDialogComponent {
  protected readonly context =
    inject<TuiDialogContext<S3NameDialogOutputs, S3NameDialogInputs>>(POLYMORPHEUS_CONTEXT);

  protected readonly form = createNameForm({
    existingNames: this.context.data.existingNames,
    initialValue: this.context.data.initialValue,
  });
  protected readonly loading = signal(false);

  protected cancel(): void {
    this.context.completeWith({ option: 'cancel' });
  }

  protected async submit(): Promise<void> {
    await submit(this.form, async () => {
      this.loading.set(true);

      try {
        const accepted = await this.context.data.submit(this.form().value().name);

        if (accepted) {
          this.context.completeWith({ option: 'ok' });
        }
      } finally {
        this.loading.set(false);
      }
    });
  }
}
