import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Supplier {
  id?: number;
  name: string;
  contact_email: string;
  phone: string;
  address: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  constructor(private api: ApiService) {}

  getSuppliers(): Observable<Supplier[]> {
    return this.api.get<Supplier[]>('/suppliers');
  }

  createSupplier(supplier: Supplier): Observable<Supplier> {
    return this.api.post<Supplier>('/suppliers', supplier);
  }

  updateSupplier(id: number, supplier: Supplier): Observable<Supplier> {
    return this.api.put<Supplier>(`/suppliers/${id}`, supplier);
  }

  deleteSupplier(id: number): Observable<any> {
    return this.api.delete<any>(`/suppliers/${id}`);
  }
}
