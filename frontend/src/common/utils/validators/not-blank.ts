import { FieldContext } from '@angular/forms/signals';

/**
 * Validates that the field value contains at least one non-whitespace character.
 * Returns `null` for empty values (optional field pattern).
 */
export function notBlankValidator(fieldContext: FieldContext<string>) {
  const value = fieldContext.value();

  if (!value) {
    return null;
  }

  if (!/\S/.test(value)) {
    return {
      kind: 'notBlank',
      message: 'Must contain at least one non-whitespace character',
    };
  }

  return null;
}
