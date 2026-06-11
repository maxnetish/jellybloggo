import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Validates that the control value is a valid URL.
 * Returns `null` for `null`, `undefined`, or empty values (optional field pattern).
 * Uses the built-in `URL` constructor for validation.
 *
 * @param params.message - Custom error message. Defaults to `"Invalid URL"`.
 * @returns A validator function that produces `{url: string}` error on failure.
 */
export function url({ message }: { message?: string } = {}) {
  return function (control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }

    try {
      new URL(value);
      return null;
    } catch {
      return {
        url: message || 'Invalid URL',
      };
    }
  };
}
