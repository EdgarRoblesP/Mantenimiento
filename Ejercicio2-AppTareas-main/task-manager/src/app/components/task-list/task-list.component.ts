import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { TaskItemComponent } from '../task-item/task-item.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, TaskItemComponent],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit, OnDestroy {
  private readonly taskService = inject(TaskService);
  private readonly subscription = new Subscription();

  public tasks: Task[] = [];
  public loading = true;
  public filter = this.taskService.currentFilter;

  public ngOnInit(): void {
    this.subscription.add(
      this.taskService.filteredTasks$.subscribe(tasks => (this.tasks = tasks))
    );
    this.subscription.add(this.taskService.loading$.subscribe(value => (this.loading = value)));
    this.subscription.add(this.taskService.filter$.subscribe(value => (this.filter = value)));
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /** El mensaje del estado vacío depende del filtro activo. */
  public get emptyTitle(): string {
    switch (this.filter) {
      case 'pending':
        return 'No tienes tareas pendientes';
      case 'completed':
        return 'Todavía no completas ninguna tarea';
      default:
        return 'No hay tareas para mostrar';
    }
  }

  public get emptySubtitle(): string {
    return this.filter === 'all'
      ? 'Agrega una tarea con el formulario de arriba para empezar.'
      : 'Cambia el filtro para ver el resto de tus tareas.';
  }

  public trackById(_index: number, task: Task): number {
    return task.id;
  }
}
