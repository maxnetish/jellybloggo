import { TestBed } from '@angular/core/testing';
import { FieldState } from '@angular/forms/signals';
import { S3ConfigResponse } from '../../model/s3-config';
import {
  applyDtoToForm,
  applyFormValueToDtoForCreate,
  applyFormValueToDtoForUpdate,
  createS3ConfigForm,
} from './s3-config-edit.form';

const dto: S3ConfigResponse = {
  id: 'cfg-1',
  config_name: 'Production Minio',
  s3_access_key: 'access-key',
  s3_access_secret: 'access-secret',
  s3_endpoint: 'https://minio.example.com',
  s3_region: 'us-east-1',
  s3_bucket: 'my-blog-uploads',
  s3_public_end_point: 'https://cdn.example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const dtoWithoutOptionalFields: S3ConfigResponse = {
  ...dto,
  s3_endpoint: null,
  s3_region: null,
};

describe('createS3ConfigForm', () => {
  let s3Form: ReturnType<typeof createS3ConfigForm>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    s3Form = TestBed.runInInjectionContext(() => createS3ConfigForm());
  });

  function errorKinds(field: FieldState<string>): string[] {
    return field.errors().map((error) => error.kind);
  }

  it('starts with an empty model', () => {
    expect(s3Form().value()).toEqual({
      config_name: '',
      s3_access_key: '',
      s3_access_secret: '',
      s3_endpoint: '',
      s3_region: '',
      s3_bucket: '',
      s3_public_end_point: '',
    });
  });

  describe('applyDtoToForm', () => {
    it('fills the model from the dto', () => {
      applyDtoToForm({ form: s3Form, dto });

      expect(s3Form().value()).toEqual({
        config_name: 'Production Minio',
        s3_access_key: 'access-key',
        s3_access_secret: 'access-secret',
        s3_endpoint: 'https://minio.example.com',
        s3_region: 'us-east-1',
        s3_bucket: 'my-blog-uploads',
        s3_public_end_point: 'https://cdn.example.com',
      });
    });

    it('turns missing optional values into empty strings', () => {
      applyDtoToForm({ form: s3Form, dto: dtoWithoutOptionalFields });

      expect(s3Form().value().s3_endpoint).toBe('');
      expect(s3Form().value().s3_region).toBe('');
    });

    it('leaves the form pristine and untouched', () => {
      applyDtoToForm({ form: s3Form, dto });

      expect(s3Form().dirty()).toBe(false);
      expect(s3Form().touched()).toBe(false);
    });
  });

  describe('applyFormValueToDtoForCreate', () => {
    it('maps a filled form to the create request', () => {
      applyDtoToForm({ form: s3Form, dto });

      expect(applyFormValueToDtoForCreate({ formValue: s3Form().value() })).toEqual({
        config_name: 'Production Minio',
        s3_access_key: 'access-key',
        s3_access_secret: 'access-secret',
        s3_endpoint: 'https://minio.example.com',
        s3_region: 'us-east-1',
        s3_bucket: 'my-blog-uploads',
        s3_public_end_point: 'https://cdn.example.com',
      });
    });

    it('sends null for empty optional fields', () => {
      const request = applyFormValueToDtoForCreate({ formValue: s3Form().value() });

      expect(request.s3_endpoint).toBeNull();
      expect(request.s3_region).toBeNull();
      expect(request.s3_bucket).toBe('');
      expect(request.s3_public_end_point).toBe('');
    });
  });

  describe('applyFormValueToDtoForUpdate', () => {
    it('maps a filled form to the update request', () => {
      applyDtoToForm({ form: s3Form, dto });

      expect(applyFormValueToDtoForUpdate({ formValue: s3Form().value() })).toEqual({
        config_name: 'Production Minio',
        s3_access_key: 'access-key',
        s3_access_secret: 'access-secret',
        s3_endpoint: 'https://minio.example.com',
        s3_region: 'us-east-1',
        s3_bucket: 'my-blog-uploads',
        s3_public_end_point: 'https://cdn.example.com',
      });
    });

    it('sends null for empty optional fields', () => {
      const request = applyFormValueToDtoForUpdate({ formValue: s3Form().value() });

      expect(request.config_name).toBeNull();
      expect(request.s3_access_key).toBeNull();
      expect(request.s3_access_secret).toBeNull();
      expect(request.s3_endpoint).toBeNull();
      expect(request.s3_region).toBeNull();
      expect(request.s3_bucket).toBe('');
      expect(request.s3_public_end_point).toBe('');
    });
  });

  describe('validators', () => {
    it('accepts empty optional fields', () => {
      expect(errorKinds(s3Form.config_name())).toEqual([]);
      expect(errorKinds(s3Form.s3_endpoint())).toEqual([]);
      expect(errorKinds(s3Form.s3_region())).toEqual([]);
    });

    it('reports required fields', () => {
      expect(errorKinds(s3Form.s3_access_key())).toContain('required');
      expect(errorKinds(s3Form.s3_access_secret())).toContain('required');
      expect(errorKinds(s3Form.s3_bucket())).toContain('required');
      expect(errorKinds(s3Form.s3_public_end_point())).toContain('required');
    });

    it('rejects whitespace-only config name', () => {
      s3Form.config_name().value.set('   ');

      expect(errorKinds(s3Form.config_name())).toContain('notBlank');
    });

    it('limits config name to 100 characters', () => {
      s3Form.config_name().value.set('a'.repeat(101));

      expect(errorKinds(s3Form.config_name())).toContain('maxLength');
    });

    it('limits access key to 255 characters', () => {
      s3Form.s3_access_key().value.set('a'.repeat(256));

      expect(errorKinds(s3Form.s3_access_key())).toContain('maxLength');
    });

    it('limits access secret to 500 characters', () => {
      s3Form.s3_access_secret().value.set('a'.repeat(501));

      expect(errorKinds(s3Form.s3_access_secret())).toContain('maxLength');
    });

    it('limits endpoint to 500 characters', () => {
      s3Form.s3_endpoint().value.set('a'.repeat(501));

      expect(errorKinds(s3Form.s3_endpoint())).toContain('maxLength');
    });

    it('rejects an invalid endpoint url', () => {
      s3Form.s3_endpoint().value.set('not a url');

      expect(errorKinds(s3Form.s3_endpoint())).toContain('url');
    });

    it('limits region to 50 characters', () => {
      s3Form.s3_region().value.set('a'.repeat(51));

      expect(errorKinds(s3Form.s3_region())).toContain('maxLength');
    });

    it('limits bucket to 63 characters', () => {
      s3Form.s3_bucket().value.set('a'.repeat(64));

      expect(errorKinds(s3Form.s3_bucket())).toContain('maxLength');
    });

    it('rejects an invalid public endpoint url', () => {
      s3Form.s3_public_end_point().value.set('not a url');

      expect(errorKinds(s3Form.s3_public_end_point())).toContain('url');
    });

    it('limits public endpoint to 500 characters', () => {
      s3Form.s3_public_end_point().value.set('a'.repeat(501));

      expect(errorKinds(s3Form.s3_public_end_point())).toContain('maxLength');
    });

    it('accepts a valid form', () => {
      applyDtoToForm({ form: s3Form, dto });

      expect(s3Form().valid()).toBe(true);
    });
  });
});
