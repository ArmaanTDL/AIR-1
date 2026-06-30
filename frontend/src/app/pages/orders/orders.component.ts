import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../services/order.service';
import { ProductService, Product } from '../../services/product.service';
import { WarehouseService, Warehouse } from '../../services/warehouse.service';
import { ToastService } from '../../services/toast.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  products: Product[] = [];
  warehouses: Warehouse[] = [];
  query = '';
  loading = true;

  // Modal State
  modalOpen = false;
  saving = false;

  // Form State
  form = {
    product_id: 0,
    warehouse_id: 0,
    quantity: 1,
    customer_name: ''
  };

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private warehouseService: WarehouseService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      orders: this.orderService.getOrders(),
      products: this.productService.getProducts(),
      warehouses: this.warehouseService.getWarehouses()
    }).subscribe({
      next: (res) => {
        this.orders = res.orders;
        this.products = res.products;
        this.warehouses = res.warehouses;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getFilteredOrders(): Order[] {
    if (!this.query.trim()) return this.orders;
    const q = this.query.toLowerCase();
    return this.orders.filter(o =>
      o.customer_name.toLowerCase().includes(q) ||
      (o.product_name || '').toLowerCase().includes(q) ||
      (o.status || '').toLowerCase().includes(q)
    );
  }

  openCreate(): void {
    if (this.products.length === 0 || this.warehouses.length === 0) {
      this.toast.error('Products and warehouses must exist first');
      return;
    }
    this.form = {
      product_id: this.products[0].id || 0,
      warehouse_id: this.warehouses[0].id || 0,
      quantity: 1,
      customer_name: ''
    };
    this.modalOpen = true;
  }

  saveOrder(event: Event): void {
    event.preventDefault();
    if (!this.form.customer_name || this.form.quantity <= 0) {
      this.toast.error('Please enter customer name and quantity');
      return;
    }

    this.saving = true;
    const payload = {
      product_id: Number(this.form.product_id),
      warehouse_id: Number(this.form.warehouse_id),
      quantity: Number(this.form.quantity),
      customer_name: this.form.customer_name
    };

    this.orderService.createOrder(payload).subscribe({
      next: () => {
        this.toast.success('Order placed successfully');
        this.modalOpen = false;
        this.loadData();
        this.saving = false;
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  fulfillOrder(id: number): void {
    this.orderService.fulfillOrder(id).subscribe({
      next: () => {
        this.toast.success('Order fulfilled successfully! Inventory stock updated.');
        this.loadData();
      }
    });
  }

  deleteOrder(id: number): void {
    this.orderService.deleteOrder(id).subscribe({
      next: () => {
        this.toast.success('Order cancelled and deleted');
        this.loadData();
      }
    });
  }
}
