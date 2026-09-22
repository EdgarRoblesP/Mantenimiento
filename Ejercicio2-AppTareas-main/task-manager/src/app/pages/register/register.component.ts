import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiError } from '../../models/auth.model';
import { AuthCardComponent } from '../../shared/auth-card/auth-card.component';
import { BannerComponent, BannerKind } from '../../shared/banner/banner.component';
import { FormFieldComponent } from '../../shared/form-field/form-field.component';
import { PasswordInputComponent } from '../../shared/password-input/password-input.component';
import { applyServerErrors, controlError } from '../../core/form-errors';
import { PASSWORD_RULES, matchPasswords, passwordValidator } from '../../core/password-rules';

/**
 * NRF-01 - Registro con correo y contraseña.
 * Pantallas 01, 01b (errores de validación) y 01c (correo ya registrado).
 */
@Component({
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  public readonly rules = PASSWORD_RULES;

  public readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: matchPasswords() }
  );

  public submitting = false;
  public banner: { message: string; kind: BannerKind; action?: string } | null = null;

  public get passwordValue(): string {
    return this.form.controls.password.value;
  }

  /** Muestra la lista de requisitos solo cuando hay algo escrito. */
  public get showRules(): boolean {
    return this.passwordValue.length > 0 && this.form.controls.password.invalid;
  }

  public errorFor(field: 'email' | 'password' | 'confirmPassword'): string | null {
    return controlError(this.form.get(field), {
      required:
        field === 'email' ? 'Escribe tu correo electrónico.' : 'Escribe una contraseña.',
      passwordRules: 'La contraseña no cumple todos los requisitos.'
    });
  }

  public onSubmit(): void {
    this.banner = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, confirmPassword } = this.form.getRawValue();
    this.submitting = true;

    this.auth.register(email, password, confirmPassword).subscribe({
      next: () => {
        this.submitting = false;
        // Pantalla 02: «revisa tu correo».
        this.router.navigate(['/verificar-correo'], { queryParams: { correo: email } });
      },
      error: (error: ApiError) => {
        this.submitting = false;
        this.handleError(error);
      }
    });
  }

  public goToLogin(): void {
    this.router.navigate(['/iniciar-sesion']);
  }

  private handleError(error: ApiError): void {
    if (error.code === 'EMAIL_TAKEN') {
      // Pantalla 01c.
      this.form.controls.email.setErrors({ server: 'Ya existe una cuenta con este correo.' });
      this.form.controls.email.markAsTouched();
      this.banner = {
        message: 'Este correo ya está registrado.',
        kind: 'danger',
        action: 'Inicia sesión o recupera tu contraseña'
      };
      return;
    }

    if (error.isFieldError) {
      applyServerErrors(this.form, error.fields);
      return;
    }

    this.banner = { message: error.message, kind: 'danger' };
  }
}
