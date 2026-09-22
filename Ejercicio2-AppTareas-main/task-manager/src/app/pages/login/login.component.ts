import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiError } from '../../models/auth.model';
import { AuthCardComponent } from '../../shared/auth-card/auth-card.component';
import { BannerComponent, BannerKind } from '../../shared/banner/banner.component';
import { FormFieldComponent } from '../../shared/form-field/form-field.component';
import { PasswordInputComponent } from '../../shared/password-input/password-input.component';
import { applyServerErrors, controlError } from '../../core/form-errors';

interface Banner {
  message: string;
  kind: BannerKind;
  action?: string;
}

/**
 * NRF-03 - Inicio de sesión.
 * Pantallas 03, 03b (credenciales incorrectas) y 03c (cuenta sin verificar).
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    AuthCardComponent,
    BannerComponent,
    FormFieldComponent,
    PasswordInputComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  public readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  public submitting = false;
  public resending = false;
  public banner: Banner | null = null;

  /** `true` cuando el banner activo es el de cuenta sin verificar (NRF-02). */
  public needsVerification = false;

  private redirectTo = '/tareas';

  public ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;

    this.redirectTo = params.get('redirigir') ?? '/tareas';

    if (params.get('expirada')) {
      this.banner = { message: 'Tu sesión expiró. Inicia sesión de nuevo.', kind: 'warning' };
    }

    if (params.get('verificado')) {
      this.banner = {
        message: 'Tu correo quedó verificado. Ya puedes iniciar sesión.',
        kind: 'success'
      };
    }

    if (params.get('actualizada')) {
      this.banner = {
        message: 'Tu contraseña se actualizó. Inicia sesión con la nueva contraseña.',
        kind: 'success'
      };
    }

    const email = params.get('correo');
    if (email) {
      this.form.controls.email.setValue(email);
    }
  }

  public errorFor(field: 'email' | 'password'): string | null {
    return controlError(this.form.get(field), {
      required: field === 'email' ? 'Escribe tu correo electrónico.' : 'Escribe tu contraseña.'
    });
  }

  public onSubmit(): void {
    this.banner = null;
    this.needsVerification = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.submitting = true;

    this.auth.login(email, password).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigateByUrl(this.redirectTo);
      },
      error: (error: ApiError) => {
        this.submitting = false;
        this.handleError(error);
      }
    });
  }

  /** NRF-02 - reenvío desde el banner de cuenta sin verificar. */
  public onResendVerification(): void {
    const email = this.form.controls.email.value;
    if (!email || this.resending) {
      return;
    }

    this.resending = true;
    this.auth.resendVerification(email).subscribe({
      next: response => {
        this.resending = false;
        this.needsVerification = false;
        this.banner = { message: response.message, kind: 'success' };
      },
      error: (error: ApiError) => {
        this.resending = false;
        this.banner = { message: error.message, kind: 'danger' };
      }
    });
  }

  private handleError(error: ApiError): void {
    if (error.code === 'EMAIL_NOT_VERIFIED') {
      this.needsVerification = true;
      this.banner = {
        message: 'Tu cuenta aún no está verificada. Revisa tu correo para activarla.',
        kind: 'warning',
        action: 'Reenviar correo de verificación'
      };
      return;
    }

    if (error.isFieldError) {
      applyServerErrors(this.form, error.fields);
      return;
    }

    // Credenciales incorrectas y cualquier otro fallo van al banner (03b).
    this.banner = { message: error.message, kind: 'danger' };
  }
}
