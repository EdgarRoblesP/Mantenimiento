import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guards';

/**
 * Rutas en español porque forman parte de los enlaces que Brevo envía por
 * correo (`/verificar-correo`, `/restablecer-contrasena`); deben coincidir con
 * las que construye backend/src/services/mailer.js.
 */
export const routes: Routes = [
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/register/register.component').then(m => m.RegisterComponent),
    title: 'Crea tu cuenta · List Website'
  },
  {
    path: 'verificar-correo',
    loadComponent: () =>
      import('./pages/verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
    title: 'Verifica tu correo · List Website'
  },
  {
    path: 'iniciar-sesion',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    title: 'Inicia sesión · List Website'
  },
  {
    path: 'recuperar-contrasena',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then(
        m => m.ForgotPasswordComponent
      ),
    title: 'Recupera tu contraseña · List Website'
  },
  {
    path: 'restablecer-contrasena',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component').then(
        m => m.ResetPasswordComponent
      ),
    title: 'Nueva contraseña · List Website'
  },
  {
    path: 'tareas',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tasks/tasks.component').then(m => m.TasksComponent),
    title: 'Mis tareas · List Website'
  },
  { path: '', pathMatch: 'full', redirectTo: 'tareas' },
  { path: '**', redirectTo: 'tareas' }
];
