import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Alert {
  id: number;
  product_id: number;
  product_name: string;
  warehouse_id: number;
  warehouse_name: string;
  warehouse_region: string;
  current_quantity: number;
  threshold: number;
  status: string; // UNRESOLVED, ACKNOWLEDGED
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  constructor(private api: ApiService) {}

  getAlerts(): Observable<Alert[]> {
    return this.api.get<Alert[]>('/alerts');
  }

  acknowledgeAlert(id: number): Observable<any> {
    return this.api.patch<any>(`/alerts/${id}/acknowledge`, {});
  }
}
