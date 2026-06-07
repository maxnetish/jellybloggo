import { FormControl, FormGroup } from '@angular/forms';
import { AppValidators } from '../../../utils/validators/app-validators';

export type LoginForm = ReturnType<typeof createLoginForm>;

export function createLoginForm() {
  return new FormGroup({
    login: new FormControl<string | null>(null, {
      validators: [AppValidators.required(), AppValidators.minLength({ minLength: 3 })],
    }),
    password: new FormControl<string | null>(null, {
      validators: [
        AppValidators.required(),
        AppValidators.minLength({ minLength: 8 }),
        (control) => {
          // Special password validation
          const controlValue = control.value || '';
          if (typeof controlValue !== 'string') {
            return null;
          }

          if (controlValue === 'changeme') {
            // Это пароль админа по умолчанию. Разрегим, х. с ним.
            return null;
          }

          const hasUpperCase = /[\p{Lu}]/u.test(controlValue);
          const hasLowerCase = /[\p{Ll}]/u.test(controlValue);
          const hasNumber = /[\p{N}]/u.test(controlValue);
          const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;':",.<>/?`~]/.test(controlValue);

          if (hasUpperCase && hasLowerCase && hasNumber && hasSpecial) {
            return null;
          }

          return {
            password:
              'Password must contain uppercase letter, lowcase letter, number, special letter',
          };
        },
      ],
    }),
  });
}
