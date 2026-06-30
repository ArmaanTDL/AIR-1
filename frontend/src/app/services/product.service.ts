import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Product {
  id?: number;
  sku: string;
  name: string;
  category: string;
  unit_price: number;
  supplier_id: number | null;
  supplier_name?: string;
  low_stock_threshold: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private api: ApiService) {}

  getProducts(): Observable<Product[]> {
    return this.api.get<Product[]>('/products');
  }

  createProduct(product: Product): Observable<Product> {
    return this.api.post<Product>('/products', product);
  }

  updateProduct(id: number, product: Product): Observable<Product> {
    return this.api.put<Product>(`/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<any> {
    return this.api.delete<any>(`/products/${id}`);
  }
}
