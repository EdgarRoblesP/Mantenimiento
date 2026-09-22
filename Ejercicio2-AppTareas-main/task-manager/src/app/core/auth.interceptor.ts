import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Añade el token a cada llamada a la API y, ante un 401, limpia la sesión y
 * manda al inicio de sesión. El login y el registro se dejan pasar sin token.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.token;
  const authorized = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      const expired =
        error instanceof HttpErrorResponse && error.status === 401 && auth.isAuthenticated;

      if (expired) {
        auth.clearSession();
        router.navigate(['/iniciar-sesion'], {
          queryParams: { expirada: '1' }
        });
      }

      return throwError(() => error);
    })
  );
};
