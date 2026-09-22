import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BannerKind = 'danger' | 'success' | 'warning';

/**
 * Banner de estado de las pantallas 01c, 03b, 03c y 04c del diseño:
 * fondo del color de estado al 16 %, borde del mismo color y enlace opcional.
 */
@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css']
})
export class BannerComponent {
  @Input({ required: true }) public message!: string;
  @Input() public kind: BannerKind = 'danger';
  @Input() public actionLabel?: string;

  @Output() public action = new EventEmitter<void>();
}
