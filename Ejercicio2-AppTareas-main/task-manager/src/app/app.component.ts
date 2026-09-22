import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskCounterComponent } from './components/task-counter/task-counter.component';
import { TaskInputComponent } from './components/task-input/task-input.component';
import { TaskFilterComponent } from './components/task-filter/task-filter.component';
import { TaskListComponent } from './components/task-list/task-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    TaskCounterComponent,
    TaskInputComponent,
    TaskFilterComponent,
    TaskListComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public appTitle = 'Lista de Tareas';
  public appSubtitle = 'Práctica 2 - Mantenimiento de Software';
}
