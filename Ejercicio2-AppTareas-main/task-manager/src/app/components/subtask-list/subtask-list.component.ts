import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subtask } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { ApiError } from '../../models/auth.model';

/**
 * NRF-07 - Subtareas de una tarea (solo nombre y estado).
 *
 * Marcar la última subtarea completa la tarea automáticamente (NRF-09) y
 * mueve la barra de progreso (NRF-10); ambas cosas las resuelve el backend y
 * llegan en la tarea que devuelve cada llamada.
 */
@Component({
  selector: 'app-subtask-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subtask-list.component.html',
  styleUrls: ['./subtask-list.component.css']
})
export class SubtaskListComponent {
  @Input({ required: true }) public taskId!: number;
  @Input({ required: true }) public subtasks: Subtask[] = [];

  private readonly taskService = inject(TaskService);

  public newTitle = '';
  public adding = false;
  public errorMessage = '';
  /** Id de la subtarea con una operación en curso, para deshabilitarla. */
  public busyId: number | null = null;

  public onAdd(): void {
    const title = this.newTitle.trim();
    this.errorMessage = '';

    if (!title) {
      this.errorMessage = 'La subtarea necesita un nombre.';
      return;
    }

    this.adding = true;
    this.taskService.addSubtask(this.taskId, title).subscribe({
      next: () => {
        this.adding = false;
        this.newTitle = '';
      },
      error: (error: ApiError) => {
        this.adding = false;
        this.errorMessage = error.fieldError('title') ?? error.message;
      }
    });
  }

  /** NRF-08 sobre la subtarea. */
  public onToggle(subtask: Subtask): void {
    this.busyId = subtask.id;
    this.taskService.toggleSubtask(subtask.id, !subtask.completed).subscribe({
      next: () => (this.busyId = null),
      error: (error: ApiError) => {
        this.busyId = null;
        this.errorMessage = error.message;
      }
    });
  }

  public onDelete(subtask: Subtask): void {
    this.busyId = subtask.id;
    this.taskService.deleteSubtask(subtask.id).subscribe({
      next: () => (this.busyId = null),
      error: (error: ApiError) => {
        this.busyId = null;
        this.errorMessage = error.message;
      }
    });
  }

  public trackById(_index: number, subtask: Subtask): number {
    return subtask.id;
  }
}
