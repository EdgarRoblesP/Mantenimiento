import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ApiError } from '../models/auth.model';

/**
 * Convierte cualquier fallo HTTP en un `ApiError` uniforme, para que los
 * componentes no tengan que distinguir entre un error del backend y una caída
 * de red.
 */
export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof HttpErrorResponse) {
    const body = error.error?.error;
    if (body?.code) {
      return new ApiError(error.status, body);
    }

    if (error.status === 0) {
      return new ApiError(0, {
        code: 'NETWORK_ERROR',
        message: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
      });
    }

    return new ApiError(error.status, {
      code: 'UNKNOWN_ERROR',
      message: 'Ocurrió un error inesperado. Inténtalo de nuevo en unos momentos.'
    });
  }

  return new ApiError(0, {
    code: 'UNKNOWN_ERROR',
    message: 'Ocurrió un error inesperado. Inténtalo de nuevo en unos momentos.'
  });
};

/** Operador para usar dentro de `catchError`. */
export const rethrowAsApiError = (error: unknown): Observable<never> =>
  throwError(() => toApiError(error));
