import { ChangeDetectionStrategy, Component, inject, computed, signal, OnInit } from '@angular/core';
import { FormField, FormRoot } from '@angular/forms/signals';
import {
  TuiButton,
  TuiError,
  TuiIcon,
  TuiInputDirective,
  TuiLabel,
  TuiNotificationDirective,
  TuiTextfield,
  TuiTitle,
} from '@taiga-ui/core';
import { TuiForm, TuiHeader } from '@taiga-ui/layout';
import { TuiPassword, TuiButtonLoading } from '@taiga-ui/kit';
import { TuiPlatform } from '@taiga-ui/cdk';
import { TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { S3ConfigService } from '../../s3config.service';
import {
  createS3ConfigForm,
  applyDtoToForm,
  applyFormValueToDtoForCreate,
  applyFormValueToDtoForUpdate,
} from './s3-config-edit.form';
import { S3ConfigEditInputs, S3ConfigEditOutputs } from './s3-config-edit.model';
import { submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-s3-config-form',
  imports: [
    FormField,
    FormRoot,
    TuiForm,
    TuiHeader,
    TuiTitle,
    TuiTextfield,
    TuiLabel,
    TuiError,
    TuiIcon,
    TuiPassword,
    TuiButton,
    TuiButtonLoading,
    TuiNotificationDirective,
    TuiPlatform,
    TuiInputDirective,
  ],
  templateUrl: './s3-config-edit.component.html',
  styleUrl: './s3-config-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class S3ConfigFormComponent implements OnInit {
  private readonly s3ConfigService = inject(S3ConfigService);

  protected readonly context = inject<TuiDialogContext<S3ConfigEditOutputs, S3ConfigEditInputs>>(
    POLYMORPHEUS_CONTEXT,
    { optional: true },
  );

  protected readonly form = createS3ConfigForm();
  protected readonly loading = signal(false);
  protected readonly serverError = signal<string | null>(null);

  private get initialConfig() {
    return this.context?.data.config || null;
  }

  private get isEdit() {
    return !!this.initialConfig?.id;
  }

  protected readonly dialogTitle = computed(() =>
    this.isEdit ? 'Edit storage bucket' : 'Add storage bucket',
  );

  ngOnInit() {
    if (this.isEdit && this.initialConfig) {
      applyDtoToForm({ form: this.form, dto: this.initialConfig });
    }
  }

  protected cancel(): void {
    this.context?.completeWith({
      option: 'cancel',
    });
  }

  protected async submit() {
    this.loading.set(true);
    this.serverError.set(null);

    const success = await submit(this.form, async () => {
      const configId = this.initialConfig?.id;
      const formValue = this.form().value();

      const save$ = configId
        ? this.s3ConfigService.update({
          id: configId,
          request: applyFormValueToDtoForUpdate({ formValue }),
        })
        : this.s3ConfigService.create({
          request: applyFormValueToDtoForCreate({ formValue }),
        });
      try {
        const response = await firstValueFrom(save$);
        this.context?.completeWith({
          option: 'ok',
          config: response,
        });
      } catch (error: any) {
        this.serverError.set(error.error?.error || error.error?.code || 'Something went wrong');
        this.loading.set(false);
      }
    });
  }
}
