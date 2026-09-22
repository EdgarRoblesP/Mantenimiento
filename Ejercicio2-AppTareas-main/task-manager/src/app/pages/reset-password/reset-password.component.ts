import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiError } from '../../models/auth.model';
import { AuthCardComponent } from '../../shared/auth-card/auth-card.component';
import { BannerComponent } from '../../shared/banner/banner.component';
import { FormFieldComponent } from '../../shared/form-field/form-field.component';
import { PasswordInputComponent } from '../../shared/password-input/password-input.component';
import { applyServerErrors, controlError } from '../../core/form-errors';
import { PASSWORD_RULES, matchPasswords, passwordValidator } from '../../core/password-rules';

/**
 * NRF-04 - Nueva contraseña desde el enlace del correo.
 * Pantallas 05 y 05b (validación con lista de requisitos).
 */
@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  public readonly rules = PASSWORD_RULES;

  public readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: matchPasswords() }
  );

  public submitting = false;
  public errorMessage = '';
  public token = '';

  public ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.errorMessage =
        'El enlace de recuperación no es válido. Solicita uno nuevo desde «¿Olvidaste tu contraseña?».';
    }
  }

  public get passwordValue(): string {
    return this.form.controls.password.value;
  }

  public errorFor(field: 'password' | 'confirmPassword'): string | null {
    return controlError(this.form.get(field), {
      required: 'Escribe una contraseña.',
      passwordRules: 'La contraseña no cumple todos los requisitos.'
    });
  }

  public onSubmit(): void {
    this.errorMessage = '';

    if (!this.token) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.form.getRawValue();
    this.submitting = true;

    this.auth.resetPassword(this.token, password, confirmPassword).subscribe({
      next: () => {
        this.submitting = false;
        // Las sesiones abiertas quedaron revocadas en el backend.
        this.router.navigate(['/iniciar-sesion'], { queryParams: { actualizada: '1' } });
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
}
