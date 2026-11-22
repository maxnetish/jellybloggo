import { signal } from '@angular/core';
import { form, maxLength, required, validate } from '@angular/forms/signals';
import { notBlankValidator } from '../../../utils/validators/not-blank';

export type S3NameForm = ReturnType<typeof createNameForm>;

export function createNameForm({
  existingNames,
  initialValue = '',
}: {
  existingNames: ReadonlySet<string>;
  initialValue?: string;
}) {
  const model = signal({ name: initialValue });

  return form(model, (schemaPath) => {
    required(schemaPath.name, { message: 'Name is required' });
    maxLength(schemaPath.name, 64, { message: 'Maximum 64 characters' });
    validate(schemaPath.name, notBlankValidator);
    validate(schemaPath.name, (ctx) => {
      if (ctx.value().includes('/')) {
        return { kind: 'noSlash', message: 'Name cannot contain /' };
      }
      return null;
    });
    validate(schemaPath.name, (ctx) => {
      if (existingNames.has(ctx.value().trim())) {
        return { kind: 'duplicate', message: 'An item with this name already exists' };
      }
      return null;
    });
  });
}
