import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-counter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-counter.component.html',
  styleUrls: ['./task-counter.component.css']
})
export class TaskCounterComponent implements OnInit, OnDestroy {
  private readonly taskService = inject(TaskService);
  private readonly subscription = new Subscription();

  public tasks: Task[] = [];

  public ngOnInit(): void {
    this.subscription.add(this.taskService.tasks$.subscribe(tasks => (this.tasks = tasks)));
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Antes esta propiedad devolvía las tareas completadas pese a llamarse
   * `pendingCount`. Ahora cada contador cuenta lo que su nombre indica.
   */
  public get pendingCount(): number {
    return this.tasks.filter(task => !task.completed).length;
  }

  public get completedCount(): number {
    return this.tasks.filter(task => task.completed).length;
  }

  public get totalCount(): number {
    return this.tasks.length;
  }
}
