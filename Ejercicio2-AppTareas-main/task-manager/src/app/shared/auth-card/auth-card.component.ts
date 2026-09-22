import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Envoltorio de todas las pantallas de autenticación: centra una tarjeta de
 * 440 px con el logo, el título y el subtítulo, igual que los helpers `Card`,
 * `Brand` y `Heading` del script de Figma.
 */
@Component({
  selector: 'app-auth-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.css']
})
export class AuthCardComponent {
  @Input({ required: true }) public title!: string;
  @Input() public subtitle?: string;
}
