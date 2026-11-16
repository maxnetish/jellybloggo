import { signal } from '@angular/core';
import { FieldContext, form, minLength, required, validate } from '@angular/forms/signals';

/**
 * Special password validation with a friendly message.
 * Signal Forms pass a FieldContext instead of an AbstractControl.
 */
function passwordStrengthValidator(fieldContext: FieldContext<string>) {
  const value = fieldContext.value();

  if (value === 'changeme') {
    // Это пароль админа по умолчанию. Разрешим, х. с ним.
    return null;
  }

  const hasUpperCase = /[\p{Lu}]/u.test(value);
  const hasLowerCase = /[\p{Ll}]/u.test(value);
  const hasNumber = /[\p{N}]/u.test(value);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;':",.<>/?`~]/.test(value);

  if (hasUpperCase && hasLowerCase && hasNumber && hasSpecial) {
    return null;
  }

  return {
    kind: 'password',
    message: 'Password must contain uppercase letter, lowcase letter, number, special letter',
  };
}

export function createLoginForm() {
  const model = signal({
    login: '',
    password: '',
  });

  return form(model, (schemaPath) => {
    required(schemaPath.login, { message: 'Can not be empty' });
    minLength(schemaPath.login, 3, { message: 'Required at minimum 3 letters' });

    required(schemaPath.password, { message: 'Can not be empty' });
    minLength(schemaPath.password, 8, { message: 'Required at minimum 8 letters' });
    validate(schemaPath.password, passwordStrengthValidator);
  });
}
