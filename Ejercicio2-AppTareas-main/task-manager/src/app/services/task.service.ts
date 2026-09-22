import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, combineLatest, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Task, TaskFilterType, TaskPayload } from '../models/task.model';
import { rethrowAsApiError } from '../core/http-error';

/**
 * Estado de tareas y subtareas respaldado por la API (antes era un array en
 * memoria que se perdía al recargar).
 *
 * Toda escritura sobre subtareas devuelve la tarea padre ya recalculada, así
 * que el progreso (NRF-10) y el completado automático (NRF-09) se reflejan sin
 * pedir de nuevo la lista completa.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private readonly tasksSubject = new BehaviorSubject<Task[]>([]);
  private readonly filterSubject = new BehaviorSubject<TaskFilterType>('all');
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  public readonly tasks$: Observable<Task[]> = this.tasksSubject.asObservable();
  public readonly filter$: Observable<TaskFilterType> = this.filterSubject.asObservable();
  public readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  public readonly filteredTasks$: Observable<Task[]> = combineLatest([
    this.tasks$,
    this.filter$
  ]).pipe(map(([tasks, filter]) => this.filterTasks(tasks, filter)));

  public get currentFilter(): TaskFilterType {
    return this.filterSubject.value;
  }

  public setFilter(filter: TaskFilterType): void {
    this.filterSubject.next(filter);
  }

  /** Carga inicial de la pantalla de tareas. */
  public loadTasks(): Observable<Task[]> {
    this.loadingSubject.next(true);
    return this.http.get<{ tasks: Task[] }>(`${this.baseUrl}/tasks`).pipe(
      map(response => response.tasks),
      tap({
        next: tasks => {
          this.tasksSubject.next(tasks);
          this.loadingSubject.next(false);
        },
        error: () => this.loadingSubject.next(false)
      }),
      catchError(rethrowAsApiError)
    );
  }

  /** Vacía el estado al cerrar sesión, para no mostrar tareas de otra cuenta. */
  public reset(): void {
    this.tasksSubject.next([]);
    this.filterSubject.next('all');
  }

  // --- Tareas ----------------------------------------------------------------

  /** NRF-06 */
  public addTask(payload: TaskPayload): Observable<Task> {
    return this.http.post<{ task: Task }>(`${this.baseUrl}/tasks`, payload).pipe(
      map(response => response.task),
      tap(task => this.tasksSubject.next([task, ...this.tasksSubject.value])),
      catchError(rethrowAsApiError)
    );
  }

  /**
   * Antes esta operación mutaba la tarea sin emitir al BehaviorSubject, así que
   * la vista no se enteraba. Ahora se aplica la tarea que devuelve el backend.
   */
  public updateTask(id: number, payload: TaskPayload): Observable<Task> {
    return this.http.patch<{ task: Task }>(`${this.baseUrl}/tasks/${id}`, payload).pipe(
      map(response => response.task),
      tap(task => this.replaceTask(task)),
      catchError(rethrowAsApiError)
    );
  }

  /** NRF-08 */
  public toggleTask(id: number, completed: boolean): Observable<Task> {
    return this.http
      .patch<{ task: Task }>(`${this.baseUrl}/tasks/${id}/completed`, { completed })
      .pipe(
        map(response => response.task),
        tap(task => this.replaceTask(task)),
        catchError(rethrowAsApiError)
      );
  }

  /**
   * Borra la tarea indicada. El código anterior hacía `splice(index + 1, 1)`,
   * que eliminaba la tarea siguiente en lugar de la seleccionada.
   */
  public deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tasks/${id}`).pipe(
      tap(() => this.tasksSubject.next(this.tasksSubject.value.filter(task => task.id !== id))),
      catchError(rethrowAsApiError)
    );
  }

  // --- Subtareas -------------------------------------------------------------

  /** NRF-07 */
  public addSubtask(taskId: number, title: string): Observable<Task> {
    return this.http
      .post<{ task: Task }>(`${this.baseUrl}/tasks/${taskId}/subtasks`, { title })
      .pipe(
        map(response => response.task),
        tap(task => this.replaceTask(task)),
        catchError(rethrowAsApiError)
      );
  }

  public updateSubtask(subtaskId: number, title: string): Observable<Task> {
    return this.http.patch<{ task: Task }>(`${this.baseUrl}/subtasks/${subtaskId}`, { title }).pipe(
      map(response => response.task),
      tap(task => this.replaceTask(task)),
      catchError(rethrowAsApiError)
    );
  }

  /** NRF-08 sobre subtareas; el backend aplica NRF-09 a la tarea padre. */
  public toggleSubtask(subtaskId: number, completed: boolean): Observable<Task> {
    return this.http
      .patch<{ task: Task }>(`${this.baseUrl}/subtasks/${subtaskId}/completed`, { completed })
      .pipe(
        map(response => response.task),
        tap(task => this.replaceTask(task)),
        catchError(rethrowAsApiError)
      );
  }

  public deleteSubtask(subtaskId: number): Observable<Task> {
    return this.http.delete<{ task: Task }>(`${this.baseUrl}/subtasks/${subtaskId}`).pipe(
      map(response => response.task),
      tap(task => this.replaceTask(task)),
      catchError(rethrowAsApiError)
    );
  }

  // --- Internos --------------------------------------------------------------

  private replaceTask(updated: Task): void {
    this.tasksSubject.next(
      this.tasksSubject.value.map(task => (task.id === updated.id ? updated : task))
    );
  }

  /**
   * El filtro `completed` del código anterior devolvía `!task.completed`, es
   * decir, las pendientes. Aquí cada opción devuelve lo que anuncia.
   */
  private filterTasks(tasks: Task[], filter: TaskFilterType): Task[] {
    switch (filter) {
      case 'pending':
        return tasks.filter(task => !task.completed);
      case 'completed':
        return tasks.filter(task => task.completed);
      case 'all':
      default:
        return tasks;
    }
  }
}
