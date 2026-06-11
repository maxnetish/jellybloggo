import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Validates that the control value contains at least one non-whitespace character.
 * Returns `null` for `null`, `undefined`, or empty values (optional field pattern).
 * Rejects values that consist entirely of whitespace (spaces, tabs, newlines, etc.).
 *
 * @param params.message - Custom error message. Defaults to `"Must contain at least one non-whitespace character"`.
 * @returns A validator function that produces `{notBlank: string}` error on failure.
 */
export function notBlank({ message }: { message?: string } = {}) {
  return function (control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value !== 'string' || !/\S/.test(value)) {
      return {
        notBlank: message || 'Must contain at least one non-whitespace character',
      };
    }

    return null;
  };
}
