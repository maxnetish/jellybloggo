import { FormControl, FormGroup } from '@angular/forms';
import { AppValidators } from '../../../utils/validators/app-validators';
import {
  S3ConfigResponse,
  CreateS3ConfigRequest,
  UpdateS3ConfigRequest,
} from '../../model/s3-config';

export type S3ConfigEditForm = ReturnType<typeof createS3ConfigForm>;

export function createS3ConfigForm(): FormGroup {
  return new FormGroup({
    configName: new FormControl<string | null>(null, {
      validators: [AppValidators.notBlank(), AppValidators.maxLength({ maxLength: 100 })],
    }),
    s3AccessKey: new FormControl<string | null>(null, {
      validators: [AppValidators.required(), AppValidators.maxLength({ maxLength: 255 })],
    }),
    s3AccessSecret: new FormControl<string | null>(null, {
      validators: [AppValidators.required(), AppValidators.maxLength({ maxLength: 500 })],
    }),
    s3Endpoint: new FormControl<string | null>(null, {
      validators: [AppValidators.url(), AppValidators.maxLength({ maxLength: 500 })],
    }),
    s3Region: new FormControl<string | null>(null, {
      validators: [AppValidators.maxLength({ maxLength: 50 })],
    }),
    s3Bucket: new FormControl<string | null>(null, {
      validators: [AppValidators.required(), AppValidators.maxLength({ maxLength: 63 })],
    }),
    s3PublicEndPoint: new FormControl<string | null>(null, {
      validators: [
        AppValidators.required(),
        AppValidators.url(),
        AppValidators.maxLength({ maxLength: 500 }),
      ],
    }),
  });
}

export function applyDtoToForm({
  form,
  dto,
}: {
  form: S3ConfigEditForm;
  dto: S3ConfigResponse;
}): S3ConfigEditForm {
  form.patchValue({
    configName: dto.config_name || null,
    s3AccessKey: dto.s3_access_key || null,
    s3AccessSecret: dto.s3_access_secret || null,
    s3Endpoint: dto.s3_endpoint || null,
    s3Region: dto.s3_region || null,
    s3Bucket: dto.s3_bucket || null,
    s3PublicEndPoint: dto.s3_public_end_point || null,
  });
  form.markAsPristine();
  form.markAsUntouched();
  return form;
}

export function applyFormToDtoForCreate({
  form,
}: {
  form: S3ConfigEditForm;
}): CreateS3ConfigRequest {
  const v = form.value;
  return {
    config_name: v.configName || '',
    s3_access_key: v.s3AccessKey || '',
    s3_access_secret: v.s3AccessSecret || '',
    s3_endpoint: v.s3Endpoint || null,
    s3_region: v.s3Region || null,
    s3_bucket: v.s3Bucket || '',
    s3_public_end_point: v.s3PublicEndPoint || '',
  };
}

export function applyFormToDtoForUpdate({
  form,
}: {
  form: S3ConfigEditForm;
}): UpdateS3ConfigRequest {
  const v = form.value;
  return {
    config_name: v.configName || null,
    s3_access_key: v.s3AccessKey || null,
    s3_access_secret: v.s3AccessSecret || null,
    s3_endpoint: v.s3Endpoint || null,
    s3_region: v.s3Region || null,
    s3_bucket: v.s3Bucket || '',
    s3_public_end_point: v.s3PublicEndPoint || '',
  };
}
