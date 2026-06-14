import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  TuiButton,
  TuiError,
  TuiIcon,
  TuiInputDirective,
  TuiNotificationDirective,
  TuiTextfield,
  TuiTitle,
} from '@taiga-ui/core';
import { TuiCard, TuiForm, TuiHeader } from '@taiga-ui/layout';
import { TuiPassword, TuiButtonLoading } from '@taiga-ui/kit';
import { TuiPlatform } from '@taiga-ui/cdk';
import { TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@taiga-ui/polymorpheus';
import { S3ConfigService } from '../../s3config.service';
import {
  createS3ConfigForm,
  applyDtoToForm,
  applyFormToDtoForCreate,
  applyFormToDtoForUpdate,
} from './s3-config-edit.form';
import { S3Config } from '../../model/s3-config';

export interface S3ConfigEditInputs {
  id?: string;
}

export interface S3ConfigEditOutputs {
  option: 'ok' | 'cancel';
  config?: S3Config | null;
}

@Component({
  selector: 'app-s3-config-form',
  imports: [
    ReactiveFormsModule,
    TuiCard,
    TuiForm,
    TuiHeader,
    TuiTitle,
    TuiTextfield,
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
export class S3ConfigFormComponent {
  private readonly s3ConfigService = inject(S3ConfigService);

  protected readonly context = inject<TuiDialogContext<S3ConfigEditOutputs, S3ConfigEditInputs>>(
    POLYMORPHEUS_CONTEXT,
    { optional: true },
  );

  protected readonly form = createS3ConfigForm();
  protected readonly loading = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly isEdit = computed(() => !!this.context?.data?.id);
  protected readonly dialogTitle = computed(() =>
    this.isEdit() ? 'Edit storage bucket' : 'Add storage bucket',
  );

  constructor() {
    if (this.isEdit()) {
      const id = this.context!.data!.id!;
      this.loading.set(true);
      this.s3ConfigService.getById({ id }).subscribe({
        next: (dto) => {
          applyDtoToForm({ form: this.form, dto });
          this.loading.set(false);
        },
        error: () => {
          this.serverError.set('Failed to load configuration');
          this.loading.set(false);
        },
      });
    }
  }

  protected cancel(): void {
    this.context?.completeWith({
      option: 'cancel',
    });
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) {
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);

    const configId = this.context?.data?.id;

    const save$ = configId
      ? this.s3ConfigService.update({
          id: configId,
          request: applyFormToDtoForUpdate({ form: this.form }),
        })
      : this.s3ConfigService.create({
          request: applyFormToDtoForCreate({ form: this.form }),
        });

    save$.subscribe({
      next: (response) => {
        this.context?.completeWith({
          option: 'ok',
          config: response,
        });
      },
      error: (err: { error?: { error?: string; code?: string } }) => {
        this.serverError.set(err.error?.error || err.error?.code || 'Something went wrong');
        this.loading.set(false);
      },
    });
  }
}
