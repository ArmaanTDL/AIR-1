import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryItem, BatchUpdatePayload } from '../../services/inventory.service';
import { ProductService, Product } from '../../services/product.service';
import { WarehouseService, Warehouse } from '../../services/warehouse.service';
import { ToastService } from '../../services/toast.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {
  inventory: InventoryItem[] = [];
  products: Product[] = [];
  warehouses: Warehouse[] = [];
  loading = true;

  // Filter States
  searchQuery = '';
  selectedRegion = 'ALL';
  regions = ['ALL', 'NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL'];

  // Add Inventory State
  addModalOpen = false;
  addForm = {
    product_id: 0,
    warehouse_id: 0,
    quantity: 10
  };

  // Batch Update Modal State
  batchModalOpen = false;
  batchItems: { product_id: number; warehouse_id: number; quantity: number }[] = [];
  batchSaving = false;

  // Concurrency Test Modal State
  concurrencyModalOpen = false;
  concurrencyForm = {
    product_id: 0,
    warehouse_id: 0,
    quantity: 5
  };
  concurrencyRunning = false;
  concurrencyResult: any = null;

  constructor(
    private inventoryService: InventoryService,
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
      inventory: this.inventoryService.getInventory(),
      products: this.productService.getProducts(),
      warehouses: this.warehouseService.getWarehouses()
    }).subscribe({
      next: (res) => {
        this.inventory = res.inventory;
        this.products = res.products;
        this.warehouses = res.warehouses;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getFilteredInventory(): InventoryItem[] {
    let filtered = this.inventory;

    // Filter by Region
    if (this.selectedRegion !== 'ALL') {
      filtered = filtered.filter(item => item.warehouse_region === this.selectedRegion);
    }

    // Filter by Search Query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        (item.product_name || '').toLowerCase().includes(q) ||
        (item.warehouse_name || '').toLowerCase().includes(q)
      );
    }

    return filtered;
  }

  // Single Add Inventory
  openAddModal(): void {
    if (this.products.length === 0 || this.warehouses.length === 0) {
      this.toast.error('Products and warehouses must exist first');
      return;
    }
    this.addForm = {
      product_id: this.products[0].id || 0,
      warehouse_id: this.warehouses[0].id || 0,
      quantity: 10
    };
    this.addModalOpen = true;
  }

  saveAddInventory(event: Event): void {
    event.preventDefault();
    const payload = {
      product_id: Number(this.addForm.product_id),
      warehouse_id: Number(this.addForm.warehouse_id),
      quantity: Number(this.addForm.quantity)
    };

    this.inventoryService.createInventory(payload).subscribe({
      next: () => {
        this.toast.success('Inventory record added');
        this.addModalOpen = false;
        this.loadData();
      }
    });
  }

  deleteInventory(id: number): void {
    this.inventoryService.deleteInventory(id).subscribe({
      next: () => {
        this.toast.success('Inventory row removed');
        this.loadData();
      }
    });
  }

  // Batch Update
  openBatchModal(): void {
    if (this.products.length === 0 || this.warehouses.length === 0) {
      this.toast.error('Products and warehouses must exist first');
      return;
    }
    this.batchItems = [{
      product_id: this.products[0].id || 0,
      warehouse_id: this.warehouses[0].id || 0,
      quantity: 10
    }];
    this.batchModalOpen = true;
  }

  addBatchItem(): void {
    this.batchItems.push({
      product_id: this.products[0].id || 0,
      warehouse_id: this.warehouses[0].id || 0,
      quantity: 10
    });
  }

  removeBatchItem(index: number): void {
    this.batchItems.splice(index, 1);
  }

  submitBatchUpdate(): void {
    if (this.batchItems.length === 0) return;
    this.batchSaving = true;

    const payload: BatchUpdatePayload = {
      items: this.batchItems.map(item => ({
        product_id: Number(item.product_id),
        warehouse_id: Number(item.warehouse_id),
        quantity: Number(item.quantity)
      }))
    };

    this.inventoryService.batchUpdate(payload).subscribe({
      next: (res) => {
        this.toast.success('Batch transaction completed successfully');
        this.batchModalOpen = false;
        this.loadData();
        this.batchSaving = false;
      },
      error: () => {
        this.batchSaving = false;
      }
    });
  }

  // Concurrency Test
  openConcurrencyModal(): void {
    if (this.products.length === 0 || this.warehouses.length === 0) {
      this.toast.error('Products and warehouses must exist first');
      return;
    }
    this.concurrencyForm = {
      product_id: this.products[0].id || 0,
      warehouse_id: this.warehouses[0].id || 0,
      quantity: 5
    };
    this.concurrencyResult = null;
    this.concurrencyModalOpen = true;
  }

  runConcurrencyTest(): void {
    this.concurrencyRunning = true;
    this.concurrencyResult = null;

    const payload = {
      product_id: Number(this.concurrencyForm.product_id),
      warehouse_id: Number(this.concurrencyForm.warehouse_id),
      quantity: Number(this.concurrencyForm.quantity)
    };

    this.inventoryService.runConcurrentTest(payload).subscribe({
      next: (res) => {
        this.concurrencyResult = res;
        this.concurrencyRunning = false;
        this.toast.success('Concurrency test completed');
        this.loadData();
      },
      error: (err) => {
        this.concurrencyResult = {
          success: false,
          error: err?.error?.detail || 'Transaction conflict or database error'
        };
        this.concurrencyRunning = false;
      }
    });
  }
}
