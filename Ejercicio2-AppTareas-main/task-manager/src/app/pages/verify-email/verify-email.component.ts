import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiError } from '../../models/auth.model';
import { AuthCardComponent } from '../../shared/auth-card/auth-card.component';
import { BannerComponent } from '../../shared/banner/banner.component';

type State = 'pending' | 'verifying' | 'verified' | 'failed';

/**
 * NRF-02 - Autenticación del correo electrónico.
 *
 * Cubre dos situaciones con la misma pantalla (02 del diseño):
 *  - sin `token`: acaba de registrarse, se le pide revisar el correo;
 *  - con `token`: llega desde el enlace y se verifica al entrar.
 */
@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, AuthCardComponent, BannerComponent],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css']
})
export class VerifyEmailComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  public state: State = 'pending';
  public email = '';
  public errorMessage = '';
  public resending = false;
  public resendMessage = '';

  public ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.email = params.get('correo') ?? '';

    const token = params.get('token');
    if (token) {
      this.verify(token);
    }
  }

  public get title(): string {
    return this.state === 'verified' ? 'Cuenta verificada' : 'Verifica tu correo';
  }

  public get subtitle(): string {
    switch (this.state) {
      case 'verifying':
        return 'Estamos confirmando tu correo electrónico…';
      case 'verified':
        return 'Tu cuenta quedó activada. Ya puedes iniciar sesión.';
      case 'failed':
        return 'No pudimos confirmar tu correo con este enlace.';
      default:
        return this.email
          ? `Enviamos un enlace de verificación a ${this.email}. Ábrelo para activar tu cuenta.`
          : 'Enviamos un enlace de verificación a tu correo. Ábrelo para activar tu cuenta.';
    }
  }

  /** NRF-02 - reenvío del enlace. */
  public onResend(): void {
    if (!this.email || this.resending) {
      return;
    }

    this.resending = true;
    this.resendMessage = '';

    this.auth.resendVerification(this.email).subscribe({
      next: response => {
        this.resending = false;
        this.resendMessage = response.message;
      },
      error: (error: ApiError) => {
        this.resending = false;
        this.resendMessage = error.message;
      }
    });
  }

  public goToLogin(): void {
    this.router.navigate(['/iniciar-sesion'], {
      queryParams: { verificado: '1', correo: this.email || null }
    });
  }

  private verify(token: string): void {
    this.state = 'verifying';

    this.auth.verifyEmail(token).subscribe({
      next: response => {
        this.state = 'verified';
        this.email = response.user?.email ?? this.email;
      },
      error: (error: ApiError) => {
        this.state = 'failed';
        this.errorMessage = error.message;
      }
    });
  }
}
