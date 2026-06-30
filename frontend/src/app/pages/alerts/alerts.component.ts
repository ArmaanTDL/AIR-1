import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, Alert } from '../../services/alert.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css']
})
export class AlertsComponent implements OnInit {
  alerts: Alert[] = [];
  loading = true;

  constructor(
    private alertService: AlertService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.alertService.getAlerts().subscribe({
      next: (res) => {
        this.alerts = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  acknowledge(id: number): void {
    this.alertService.acknowledgeAlert(id).subscribe({
      next: () => {
        this.toast.success('Alert acknowledged and resolved');
        this.loadData();
      }
    });
  }
}
