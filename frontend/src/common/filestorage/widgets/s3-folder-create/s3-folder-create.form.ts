import { signal } from '@angular/core';
import { form, maxLength, required, validate } from '@angular/forms/signals';
import { notBlankValidator } from '../../../utils/validators/not-blank';
import { lastSegmentOf } from '../../model/s3-path';

export type S3FolderCreateForm = ReturnType<typeof createFolderForm>;

export function createFolderForm(existingNames: ReadonlySet<string>) {
  const model = signal({ name: '' });

  return form(model, (schemaPath) => {
    required(schemaPath.name, { message: 'Folder name is required' });
    maxLength(schemaPath.name, 64, { message: 'Maximum 64 characters' });
    validate(schemaPath.name, notBlankValidator);
    validate(schemaPath.name, (ctx) => {
      if (ctx.value().includes('/')) {
        return { kind: 'noSlash', message: 'Folder name cannot contain /' };
      }
      return null;
    });
    validate(schemaPath.name, (ctx) => {
      if (existingNames.has(ctx.value().trim())) {
        return { kind: 'duplicate', message: 'A folder with this name already exists' };
      }
      return null;
    });
  });
}

export function collectExistingNames(
  directories: Array<{ prefix: string }>,
  files: Array<{ key: string }>,
): ReadonlySet<string> {
  const names = new Set<string>();

  for (const dir of directories) {
    names.add(lastSegmentOf(dir.prefix));
  }
  for (const file of files) {
    names.add(lastSegmentOf(file.key));
  }

  return names;
}
