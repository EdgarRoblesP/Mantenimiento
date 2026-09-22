import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * NRF-10 - Barra de progreso de la tarea, calculada por el backend a partir
 * del estado de sus subtareas.
 */
@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.css']
})
export class ProgressBarComponent {
  @Input({ required: true }) public progress = 0;
  @Input() public completed = 0;
  @Input() public total = 0;

  public get isComplete(): boolean {
    return this.progress >= 100;
  }
}
