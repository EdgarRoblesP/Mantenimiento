import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Protege las pantallas que exigen sesión iniciada (NRF-03). */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated) {
    return true;
  }

  // Se guarda el destino para volver ahí después de iniciar sesión.
  return router.createUrlTree(['/iniciar-sesion'], {
    queryParams: { redirigir: state.url }
  });
};

/** Evita que alguien con sesión abierta vuelva a registro o inicio de sesión. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated ? router.createUrlTree(['/tareas']) : true;
};
