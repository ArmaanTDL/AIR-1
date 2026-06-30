import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service';
import { SupplierService, Supplier } from '../../services/supplier.service';
import { ToastService } from '../../services/toast.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  suppliers: Supplier[] = [];
  query = '';
  loading = true;

  // Modal States
  modalOpen = false;
  editing: Product | null = null;
  saving = false;

  // Form State
  form: Product = {
    sku: '',
    name: '',
    category: 'Electronics',
    unit_price: 0,
    supplier_id: null,
    low_stock_threshold: 10
  };

  // Delete State
  deleteId: number | null = null;

  categories = ["Electronics", "Apparel", "Food & Beverage", "Automotive", "Pharmaceuticals"];

  constructor(
    private productService: ProductService,
    private supplierService: SupplierService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      products: this.productService.getProducts(),
      suppliers: this.supplierService.getSuppliers()
    }).subscribe({
      next: (res) => {
        this.products = res.products;
        this.suppliers = res.suppliers;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getFilteredProducts(): Product[] {
    if (!this.query.trim()) return this.products;
    const q = this.query.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  openCreate(): void {
    this.editing = null;
    this.form = {
      sku: '',
      name: '',
      category: 'Electronics',
      unit_price: 0,
      supplier_id: this.suppliers.length > 0 ? (this.suppliers[0].id || null) : null,
      low_stock_threshold: 10
    };
    this.modalOpen = true;
  }

  openEdit(p: Product): void {
    this.editing = p;
    this.form = {
      sku: p.sku,
      name: p.name,
      category: p.category || 'Electronics',
      unit_price: p.unit_price,
      supplier_id: p.supplier_id || null,
      low_stock_threshold: p.low_stock_threshold
    };
    this.modalOpen = true;
  }

  saveProduct(event: Event): void {
    event.preventDefault();
    if (!this.form.sku || !this.form.name || this.form.unit_price <= 0) {
      this.toast.error('Please fill in all required fields');
      return;
    }

    this.saving = true;
    const payload: Product = {
      ...this.form,
      unit_price: Number(this.form.unit_price),
      low_stock_threshold: Number(this.form.low_stock_threshold),
      supplier_id: this.form.supplier_id ? Number(this.form.supplier_id) : null
    };

    if (this.editing && this.editing.id) {
      this.productService.updateProduct(this.editing.id, payload).subscribe({
        next: () => {
          this.toast.success('Product updated successfully');
          this.modalOpen = false;
          this.loadData();
          this.saving = false;
        },
        error: () => {
          this.saving = false;
        }
      });
    } else {
      this.productService.createProduct(payload).subscribe({
        next: () => {
          this.toast.success('Product created successfully');
          this.modalOpen = false;
          this.loadData();
          this.saving = false;
        },
        error: () => {
          this.saving = false;
        }
      });
    }
  }

  confirmDelete(id: number): void {
    this.deleteId = id;
  }

  cancelDelete(): void {
    this.deleteId = null;
  }

  deleteProduct(): void {
    if (this.deleteId === null) return;
    this.productService.deleteProduct(this.deleteId).subscribe({
      next: () => {
        this.toast.success('Product deleted successfully');
        this.deleteId = null;
        this.loadData();
      }
    });
  }
}
