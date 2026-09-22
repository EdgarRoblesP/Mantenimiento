import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { ApiError } from '../../models/auth.model';
import { FormFieldComponent } from '../../shared/form-field/form-field.component';
import { applyServerErrors, controlError } from '../../core/form-errors';

/**
 * NRF-06 - Alta de tarea con nombre, fecha y hora.
 * Pantallas 06 y 06b (validación de nueva tarea).
 */
@Component({
  selector: 'app-task-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormFieldComponent],
  templateUrl: './task-input.component.html',
  styleUrls: ['./task-input.component.css']
})
export class TaskInputComponent {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);

  public readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    dueDate: [this.today(), [Validators.required]],
    dueTime: ['09:00', [Validators.required]]
  });

  public submitting = false;
  public errorMessage = '';

  public errorFor(field: 'title' | 'dueDate' | 'dueTime'): string | null {
    const messages: Record<string, string> = {
      title: 'Escribe un nombre para la tarea.',
      dueDate: 'Elige una fecha.',
      dueTime: 'Elige una hora.'
    };
    return controlError(this.form.get(field), {
      required: messages[field],
      maxlength: 'El nombre no puede pasar de 255 caracteres.'
    });
  }

  public onSubmit(): void {
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    this.taskService.addTask(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting = false;
        // Se conservan fecha y hora: suele encadenarse varias tareas el mismo día.
        this.form.controls.title.reset('');
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

  private today(): string {
    // `toISOString` usa UTC y puede adelantar el día; se compone en local.
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }
}
