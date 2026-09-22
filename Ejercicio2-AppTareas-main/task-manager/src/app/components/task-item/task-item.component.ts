import { Component, ElementRef, Input, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { ApiError } from '../../models/auth.model';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { SubtaskListComponent } from '../subtask-list/subtask-list.component';

/**
 * Tarea individual: completar (NRF-08), editar, eliminar y desplegar sus
 * subtareas (NRF-07) con la barra de progreso (NRF-10).
 */
@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [CommonModule, FormsModule, ProgressBarComponent, SubtaskListComponent],
  templateUrl: './task-item.component.html',
  styleUrls: ['./task-item.component.css']
})
export class TaskItemComponent {
  @Input({ required: true }) public task!: Task;
  @ViewChild('editInput') public editInputRef?: ElementRef<HTMLInputElement>;

  private readonly taskService = inject(TaskService);

  public isEditing = false;
  public expanded = false;
  public busy = false;
  public errorMessage = '';

  public editTitle = '';
  public editDate = '';
  public editTime = '';

  /** Fecha y hora combinadas, para mostrarlas con el pipe `date`. */
  public get dueAt(): Date {
    return new Date(`${this.task.dueDate}T${this.task.dueTime}`);
  }

  /** Resalta las tareas pendientes cuya fecha ya pasó. */
  public get isOverdue(): boolean {
    return !this.task.completed && this.dueAt.getTime() < Date.now();
  }

  public toggleExpanded(): void {
    this.expanded = !this.expanded;
  }

  /** NRF-08 */
  public onToggle(): void {
    if (this.isEditing || this.busy) {
      return;
    }

    this.busy = true;
    this.errorMessage = '';

    this.taskService.toggleTask(this.task.id, !this.task.completed).subscribe({
      next: () => (this.busy = false),
      error: (error: ApiError) => {
        this.busy = false;
        this.errorMessage = error.message;
      }
    });
  }

  public startEdit(event: Event): void {
    event.stopPropagation();

    this.isEditing = true;
    this.editTitle = this.task.title;
    this.editDate = this.task.dueDate;
    this.editTime = this.task.dueTime;

    // Espera a que el input exista en el DOM antes de enfocarlo.
    setTimeout(() => {
      this.editInputRef?.nativeElement.focus();
      this.editInputRef?.nativeElement.select();
    });
  }

  public saveEdit(): void {
    const title = this.editTitle.trim();

    if (!title) {
      this.errorMessage = 'Escribe un nombre para la tarea.';
      return;
    }

    const unchanged =
      title === this.task.title &&
      this.editDate === this.task.dueDate &&
      this.editTime === this.task.dueTime;

    if (unchanged) {
      this.isEditing = false;
      return;
    }

    this.busy = true;
    this.errorMessage = '';

    this.taskService
      .updateTask(this.task.id, { title, dueDate: this.editDate, dueTime: this.editTime })
      .subscribe({
        next: () => {
          this.busy = false;
          this.isEditing = false;
        },
        error: (error: ApiError) => {
          this.busy = false;
          this.errorMessage = error.fieldError('title') ?? error.message;
        }
      });
  }

  public cancelEdit(): void {
    this.isEditing = false;
    this.errorMessage = '';
  }

  public onDelete(event: Event): void {
    event.stopPropagation();

    this.busy = true;
    this.taskService.deleteTask(this.task.id).subscribe({
      error: (error: ApiError) => {
        this.busy = false;
        this.errorMessage = error.message;
      }
    });
  }
}
