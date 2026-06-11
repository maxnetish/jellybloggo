import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';

/**
 * Validates that the control value does not exceed a maximum length.
 * Returns `null` for `null`, `undefined`, or empty values (use `required` separately if needed).
 *
 * @param params.maxLength - Maximum number of characters allowed.
 * @param params.message - Custom error message. Defaults to `"Maximum {n} characters"`.
 * @returns A validator function that produces `{maxLength: string}` error on failure.
 */
export function maxLength({ maxLength, message }: { maxLength: number; message?: string }) {
  return function (control: AbstractControl): ValidationErrors | null {
    if (Validators.maxLength(maxLength)(control)) {
      return {
        maxLength: message || `Maximum ${maxLength} characters`,
      };
    }
    return null;
  };
}
