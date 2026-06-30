import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface DashboardStats {
  total_products: number;
  total_stock_value: number;
  active_alerts: number;
  orders_today: number;
}

export interface StockLevelRegion {
  region: string;
  total_quantity: number;
  product_count: number;
}

export interface StockLevelCategory {
  category: string;
  total_quantity: number;
  product_count: number;
}

export interface StockLevels {
  by_region: StockLevelRegion[];
  by_category: StockLevelCategory[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private api: ApiService) {}

  getStats(): Observable<DashboardStats> {
    return this.api.get<DashboardStats>('/analytics/dashboard');
  }

  getStockLevels(): Observable<StockLevels> {
    return this.api.get<StockLevels>('/analytics/stock-levels');
  }
}
