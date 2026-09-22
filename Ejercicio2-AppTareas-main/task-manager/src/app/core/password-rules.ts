import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

/**
 * Los cuatro requisitos que la pantalla «05b · Restablecer contraseña» muestra
 * como lista de verificación. Son los mismos que aplica `passwordSchema` en el
 * backend (backend/src/middleware/validate.js).
 */
export const PASSWORD_RULES: PasswordRule[] = [
  { label: 'Mínimo 8 caracteres', test: value => value.length >= 8 },
  { label: 'Al menos un número', test: value => /[0-9]/.test(value) },
  { label: 'Al menos una letra mayúscula', test: value => /[A-ZÁÉÍÓÚÑ]/.test(value) },
  { label: 'Al menos un símbolo (! @ # $ …)', test: value => /[^A-Za-z0-9]/.test(value) }
];

/** Validador que exige cumplir las cuatro reglas. */
export const passwordValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value ?? '';
  if (!value) {
    return null;
  }
  const unmet = PASSWORD_RULES.filter(rule => !rule.test(value));
  return unmet.length > 0 ? { passwordRules: unmet.map(rule => rule.label) } : null;
};

/** Validador de grupo: la confirmación debe coincidir con la contraseña. */
export const matchPasswords =
  (passwordKey = 'password', confirmKey = 'confirmPassword'): ValidatorFn =>
  (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value;
    const confirm = group.get(confirmKey);

    if (!confirm || !confirm.value) {
      return null;
    }

    if (password !== confirm.value) {
      confirm.setErrors({ ...(confirm.errors ?? {}), mismatch: true });
      return { mismatch: true };
    }

    // Se limpia solo el error de coincidencia; los demás se conservan.
    if (confirm.errors) {
      const { mismatch, ...rest } = confirm.errors;
      confirm.setErrors(Object.keys(rest).length > 0 ? rest : null);
    }
    return null;
  };
