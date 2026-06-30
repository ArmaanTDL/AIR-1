import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Order {
  id?: number;
  product_id: number;
  product_name?: string;
  warehouse_id: number;
  warehouse_name?: string;
  warehouse_region?: string;
  quantity: number;
  customer_name: string;
  status?: string; // PENDING, FULFILLED
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private api: ApiService) {}

  getOrders(): Observable<Order[]> {
    return this.api.get<Order[]>('/orders');
  }

  createOrder(order: any): Observable<Order> {
    return this.api.post<Order>('/orders', order);
  }

  fulfillOrder(id: number): Observable<any> {
    return this.api.post<any>(`/orders/${id}/fulfill`, {});
  }

  deleteOrder(id: number): Observable<any> {
    return this.api.delete<any>(`/orders/${id}`);
  }
}
