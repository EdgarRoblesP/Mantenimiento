import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiError } from '../../models/auth.model';
import { AuthCardComponent } from '../../shared/auth-card/auth-card.component';
import { BannerComponent } from '../../shared/banner/banner.component';
import { FormFieldComponent } from '../../shared/form-field/form-field.component';
import { applyServerErrors, controlError } from '../../core/form-errors';

/**
 * NRF-04 - Solicitud de recuperación de contraseña.
 * Pantallas 04, 04b (correo no encontrado) y 04c (enlace enviado).
 *
 * El backend responde igual exista o no la cuenta, así que esta pantalla
 * siempre muestra el estado de «enlace enviado» tras un envío correcto.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    AuthCardComponent,
    BannerComponent,
    FormFieldComponent
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  public readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  public submitting = false;
  public sent = false;
  public sentTo = '';
  public errorMessage = '';

  public get emailError(): string | null {
    return controlError(this.form.get('email'), {
      required: 'Escribe tu correo electrónico.'
    });
  }

  public onSubmit(): void {
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email } = this.form.getRawValue();
    this.submitting = true;

    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.submitting = false;
        this.sent = true;
        this.sentTo = email;
      },
      error: (error: ApiError) => {
        this.submitting = false;
        if (error.isFieldError) {
          applyServerErrors(this.form, error.fields);
          return;
        }
        this.errorMessage = error.message;
      }
    });
  }

  /** Botón «Reenviar enlace» de la pantalla 04c. */
  public onResend(): void {
    this.sent = false;
    this.onSubmit();
  }
}
