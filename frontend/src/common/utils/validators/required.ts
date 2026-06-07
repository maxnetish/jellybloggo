import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';

export function required({message = 'Can not be empty'}: {message?: string} = {}) {
  return function(control: AbstractControl): ValidationErrors | null {
    if (Validators.required(control)) {
      return {
        required: message,
      };
    }
    return null;
  }
}
