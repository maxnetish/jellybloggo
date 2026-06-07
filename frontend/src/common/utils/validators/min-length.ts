import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';

export function minLength({minLength = 6, message}: {minLength: number; message?: string}) {
  return function(control: AbstractControl): ValidationErrors | null {
    if (Validators.minLength(minLength)(control)) {
      return {
        minLength: message || `Required at minimum ${minLength} letters`,
      };
    }
    return null;
  }
}
