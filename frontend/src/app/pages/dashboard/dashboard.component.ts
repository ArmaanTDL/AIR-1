import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnalyticsService, DashboardStats, StockLevels } from '../../services/analytics.service';
import { AlertService, Alert } from '../../services/alert.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = {
    total_products: 0,
    total_stock_value: 0,
    active_alerts: 0,
    orders_today: 0
  };
  levels: StockLevels = {
    by_region: [],
    by_category: []
  };
  alerts: Alert[] = [];
  loading = true;

  constructor(
    private analyticsService: AnalyticsService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      stats: this.analyticsService.getStats(),
      levels: this.analyticsService.getStockLevels(),
      alerts: this.alertService.getAlerts()
    }).subscribe({
      next: (res) => {
        this.stats = res.stats;
        this.levels = res.levels;
        this.alerts = res.alerts.filter(a => a.status === 'UNRESOLVED');
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }

  getRegionProgressWidth(qty: number): string {
    const max = Math.max(...this.levels.by_region.map(r => r.total_quantity), 1);
    return `${(qty / max) * 100}%`;
  }

  getCategoryProgressWidth(qty: number): string {
    const max = Math.max(...this.levels.by_category.map(c => c.total_quantity), 1);
    return `${(qty / max) * 100}%`;
  }
}
