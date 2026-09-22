import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Campo de contraseña con botón ver/ocultar (el icono `Icon / eye` que el
 * script de Figma añade dentro de cada input de contraseña).
 *
 * Implementa ControlValueAccessor para poder usarse con formularios reactivos.
 */
@Component({
  selector: 'app-password-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './password-input.component.html',
  styleUrls: ['./password-input.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true
    }
  ]
})
export class PasswordInputComponent implements ControlValueAccessor {
  @Input() public placeholder = '';
  @Input() public controlId?: string;
  @Input() public autocomplete = 'current-password';

  public value = '';
  public visible = false;
  public disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  public toggleVisibility(): void {
    this.visible = !this.visible;
  }

  public onInput(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    this.onChange(this.value);
  }

  public onBlur(): void {
    this.onTouched();
  }

  // --- ControlValueAccessor ---------------------------------------------------

  public writeValue(value: string): void {
    this.value = value ?? '';
  }

  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
