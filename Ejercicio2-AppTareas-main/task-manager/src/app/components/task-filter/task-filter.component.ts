import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { TaskFilterType } from '../../models/task.model';

@Component({
  selector: 'app-task-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-filter.component.html',
  styleUrls: ['./task-filter.component.css']
})
export class TaskFilterComponent implements OnInit, OnDestroy {
  public currentFilter: TaskFilterType = 'all';
  private subscription: Subscription = new Subscription();

  constructor(private taskService: TaskService) {}

  public ngOnInit(): void {
    this.subscription.add(
      this.taskService.filter$.subscribe(filter => {
        this.currentFilter = filter;
      })
    );
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public onSelectFilter(filter: TaskFilterType): void {
    this.taskService.setFilter(filter);
  }
}
