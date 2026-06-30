import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Warehouse {
  id?: number;
  name: string;
  region: string;
  capacity: number;
}

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {
  constructor(private api: ApiService) {}

  getWarehouses(): Observable<Warehouse[]> {
    return this.api.get<Warehouse[]>('/warehouses');
  }

  createWarehouse(warehouse: Warehouse): Observable<Warehouse> {
    return this.api.post<Warehouse>('/warehouses', warehouse);
  }

  updateWarehouse(id: number, warehouse: Warehouse): Observable<Warehouse> {
    return this.api.put<Warehouse>(`/warehouses/${id}`, warehouse);
  }

  deleteWarehouse(id: number): Observable<any> {
    return this.api.delete<any>(`/warehouses/${id}`);
  }
}
