import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface InventoryItem {
  id?: number;
  product_id: number;
  product_name?: string;
  warehouse_id: number;
  warehouse_name?: string;
  warehouse_region?: string;
  quantity: number;
  updated_at?: string;
}

export interface BatchUpdatePayload {
  items: {
    product_id: number;
    warehouse_id: number;
    quantity: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  constructor(private api: ApiService) {}

  getInventory(): Observable<InventoryItem[]> {
    return this.api.get<InventoryItem[]>('/inventory');
  }

  createInventory(item: any): Observable<InventoryItem> {
    return this.api.post<InventoryItem>('/inventory', item);
  }

  deleteInventory(id: number): Observable<any> {
    return this.api.delete<any>(`/inventory/${id}`);
  }

  batchUpdate(payload: BatchUpdatePayload): Observable<any> {
    return this.api.post<any>('/inventory/batch-update', payload);
  }

  runConcurrentTest(payload: { product_id: number; warehouse_id: number; quantity: number }): Observable<any> {
    return this.api.post<any>('/inventory/demo/concurrent-test', payload);
  }
}
