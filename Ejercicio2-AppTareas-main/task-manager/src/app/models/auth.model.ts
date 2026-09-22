export interface User {
  id: number;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface MessageResponse {
  message: string;
}

/**
 * Forma del error que devuelve el backend. `fields` mapea nombre de campo a
 * mensaje, y es lo que alimenta los estados de error del diseño.
 */
export interface ApiErrorBody {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly fields: Record<string, string>;
  public readonly status: number;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.fields = body.fields ?? {};
  }

  /** Mensaje asociado a un campo concreto del formulario, si lo hay. */
  public fieldError(field: string): string | null {
    return this.fields[field] ?? null;
  }

  /** `true` cuando el error pertenece a un campo y no al formulario completo. */
  public get isFieldError(): boolean {
    return Object.keys(this.fields).length > 0;
  }
}
