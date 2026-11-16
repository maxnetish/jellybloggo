import { signal } from '@angular/core';
import { form, maxLength, required, validate } from '@angular/forms/signals';
import { notBlankValidator } from '../../../utils/validators/not-blank';
import { urlValidator } from '../../../utils/validators/url';
import {
  S3ConfigResponse,
  CreateS3ConfigRequest,
  UpdateS3ConfigRequest,
} from '../../model/s3-config';

/**
 * Поля формы — ровно поля запроса на создание, нормализованные к строкам
 * (пустая строка означает "значение не задано").
 */
export type S3ConfigFormModel = Record<keyof CreateS3ConfigRequest, string>;

export type S3ConfigEditForm = ReturnType<typeof createS3ConfigForm>;

export function createS3ConfigForm() {
  const model = signal<S3ConfigFormModel>({
    config_name: '',
    s3_access_key: '',
    s3_access_secret: '',
    s3_endpoint: '',
    s3_region: '',
    s3_bucket: '',
    s3_public_end_point: '',
  });

  return form(model, (schemaPath) => {
    validate(schemaPath.config_name, notBlankValidator);
    maxLength(schemaPath.config_name, 100, { message: 'Maximum 100 characters' });

    required(schemaPath.s3_access_key, { message: 'Can not be empty' });
    maxLength(schemaPath.s3_access_key, 255, { message: 'Maximum 255 characters' });

    required(schemaPath.s3_access_secret, { message: 'Can not be empty' });
    maxLength(schemaPath.s3_access_secret, 500, { message: 'Maximum 500 characters' });

    validate(schemaPath.s3_endpoint, urlValidator);
    maxLength(schemaPath.s3_endpoint, 500, { message: 'Maximum 500 characters' });

    maxLength(schemaPath.s3_region, 50, { message: 'Maximum 50 characters' });

    required(schemaPath.s3_bucket, { message: 'Can not be empty' });
    maxLength(schemaPath.s3_bucket, 63, { message: 'Maximum 63 characters' });

    required(schemaPath.s3_public_end_point, { message: 'Can not be empty' });
    validate(schemaPath.s3_public_end_point, urlValidator);
    maxLength(schemaPath.s3_public_end_point, 500, { message: 'Maximum 500 characters' });
  });
}

/**
 * Залить дто в форму.
 * После вызова форма в pristine/touched=false — считается "сохранённым" состоянием.
 */
export function applyDtoToForm({
  form: s3Form,
  dto,
}: {
  form: S3ConfigEditForm;
  dto: S3ConfigResponse;
}): S3ConfigEditForm {
  s3Form().reset({
    config_name: dto.config_name || '',
    s3_access_key: dto.s3_access_key || '',
    s3_access_secret: dto.s3_access_secret || '',
    s3_endpoint: dto.s3_endpoint || '',
    s3_region: dto.s3_region || '',
    s3_bucket: dto.s3_bucket || '',
    s3_public_end_point: dto.s3_public_end_point || '',
  });
  return s3Form;
}

export function applyFormValueToDtoForCreate({
  formValue,
}: {
  formValue: S3ConfigFormModel;
}): CreateS3ConfigRequest {
  return {
    ...formValue,
    s3_endpoint: formValue.s3_endpoint || null,
    s3_region: formValue.s3_region || null,
  };
}

export function applyFormValueToDtoForUpdate({
  formValue,
}: {
  formValue: S3ConfigFormModel;
}): UpdateS3ConfigRequest {
  return {
    ...formValue,
    config_name: formValue.config_name || null,
    s3_access_key: formValue.s3_access_key || null,
    s3_access_secret: formValue.s3_access_secret || null,
    s3_endpoint: formValue.s3_endpoint || null,
    s3_region: formValue.s3_region || null,
  };
}
