import { FieldContext } from '@angular/forms/signals';

/**
 * Validates that the field value is a valid URL.
 * Returns `null` for empty values (optional field pattern).
 */
export function urlValidator(fieldContext: FieldContext<string>) {
  const value = fieldContext.value();

  if (!value) {
    return null;
  }

  try {
    new URL(value);
    return null;
  } catch {
    return { kind: 'url', message: 'Invalid URL' };
  }
}
