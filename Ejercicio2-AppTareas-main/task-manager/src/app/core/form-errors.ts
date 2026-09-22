import { AbstractControl } from '@angular/forms';

/**
 * Traduce los errores de un control al mensaje exacto que muestra el diseño.
 * Devuelve `null` mientras el usuario no haya tocado el campo, para no pintar
 * el formulario en rojo antes de tiempo.
 */
export const controlError = (
  control: AbstractControl | null,
  messages: Record<string, string> = {}
): string | null => {
  if (!control || !control.errors || (!control.touched && !control.dirty)) {
    return null;
  }

  const errors = control.errors;
  const defaults: Record<string, string> = {
    required: 'Este campo es obligatorio.',
    email: 'Ingresa un correo electrónico válido (ej. nombre@dominio.com).',
    mismatch: 'Las contraseñas no coinciden.',
    server: String(errors['server'] ?? ''),
    ...messages
  };

  if (errors['passwordRules']) {
    // La lista de requisitos ya se muestra aparte, basta un mensaje corto.
    return messages['passwordRules'] ?? 'La contraseña no cumple todos los requisitos.';
  }

  const key = Object.keys(errors).find(name => defaults[name]);
  return key ? defaults[key] : 'Revisa este campo.';
};

/**
 * Vuelca los errores por campo que devuelve el backend sobre el formulario,
 * para que aparezcan bajo el control correspondiente.
 */
export const applyServerErrors = (
  form: { get: (path: string) => AbstractControl | null },
  fields: Record<string, string>
): void => {
  for (const [name, message] of Object.entries(fields)) {
    const control = form.get(name);
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), server: message });
      control.markAsTouched();
    }
  }
};
