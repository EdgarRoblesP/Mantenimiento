import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Campo de formulario con etiqueta, ranura para el control y mensaje de error
 * o de éxito. Equivale al helper `Field` del script de Figma: el borde cambia a
 * `status/danger` o `status/success` y el mensaje aparece debajo con su icono.
 */
@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.css']
})
export class FormFieldComponent {
  @Input({ required: true }) public label!: string;
  @Input() public error: string | null = null;
  @Input() public success: string | null = null;
  @Input() public hint?: string;
  /** Id del control para enlazar la etiqueta con `for`. */
  @Input() public controlId?: string;
}
