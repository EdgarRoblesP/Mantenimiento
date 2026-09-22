import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { ApiError } from '../../models/auth.model';
import { TaskCounterComponent } from '../../components/task-counter/task-counter.component';
import { TaskInputComponent } from '../../components/task-input/task-input.component';
import { TaskFilterComponent } from '../../components/task-filter/task-filter.component';
import { TaskListComponent } from '../../components/task-list/task-list.component';
import { BannerComponent } from '../../shared/banner/banner.component';

/**
 * Pantalla principal (06 del diseño): formulario de alta, filtros, contador y
 * lista de tareas con sus subtareas. Solo accesible con sesión iniciada.
 */
@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    TaskCounterComponent,
    TaskInputComponent,
    TaskFilterComponent,
    TaskListComponent,
    BannerComponent
  ],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);
  private readonly subscription = new Subscription();

  public email = '';
  public loadError = '';
  public loggingOut = false;

  public ngOnInit(): void {
    this.subscription.add(
      this.auth.user$.subscribe(user => (this.email = user?.email ?? ''))
    );

    this.loadTasks();
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public loadTasks(): void {
    this.loadError = '';
    this.subscription.add(
      this.taskService.loadTasks().subscribe({
        // Un 401 ya lo gestiona el interceptor redirigiendo al inicio de sesión.
        error: (error: ApiError) => {
          if (error.status !== 401) {
            this.loadError = error.message;
          }
        }
      })
    );
  }

  /** NRF-05 */
  public onLogout(): void {
    this.loggingOut = true;

    this.auth.logout().subscribe({
      next: () => this.finishLogout(),
      // La sesión local ya se limpió en el servicio: se sale igualmente.
      error: () => this.finishLogout()
    });
  }

  private finishLogout(): void {
    this.loggingOut = false;
    this.taskService.reset();
    this.router.navigate(['/iniciar-sesion']);
  }
}
