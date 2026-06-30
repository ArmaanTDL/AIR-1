import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WarehouseService, Warehouse } from '../../services/warehouse.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './warehouses.component.html',
  styleUrls: ['./warehouses.component.css']
})
export class WarehousesComponent implements OnInit {
  warehouses: Warehouse[] = [];
  query = '';
  loading = true;

  // Modal States
  modalOpen = false;
  editing: Warehouse | null = null;
  saving = false;

  // Form State
  form: Warehouse = {
    name: '',
    region: 'NORTH',
    capacity: 1000
  };

  // Delete State
  deleteId: number | null = null;

  regions = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL'];

  constructor(
    private warehouseService: WarehouseService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.warehouseService.getWarehouses().subscribe({
      next: (res) => {
        this.warehouses = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getFilteredWarehouses(): Warehouse[] {
    if (!this.query.trim()) return this.warehouses;
    const q = this.query.toLowerCase();
    return this.warehouses.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.region.toLowerCase().includes(q)
    );
  }

  openCreate(): void {
    this.editing = null;
    this.form = {
      name: '',
      region: 'NORTH',
      capacity: 1000
    };
    this.modalOpen = true;
  }

  openEdit(w: Warehouse): void {
    this.editing = w;
    this.form = {
      name: w.name,
      region: w.region || 'NORTH',
      capacity: w.capacity
    };
    this.modalOpen = true;
  }

  saveWarehouse(event: Event): void {
    event.preventDefault();
    if (!this.form.name || !this.form.region || this.form.capacity <= 0) {
      this.toast.error('Please fill in all required fields');
      return;
    }

    this.saving = true;
    const payload: Warehouse = {
      ...this.form,
      capacity: Number(this.form.capacity)
    };

    if (this.editing && this.editing.id) {
      this.warehouseService.updateWarehouse(this.editing.id, payload).subscribe({
        next: () => {
          this.toast.success('Warehouse updated successfully');
          this.modalOpen = false;
          this.loadData();
          this.saving = false;
        },
        error: () => {
          this.saving = false;
        }
      });
    } else {
      this.warehouseService.createWarehouse(payload).subscribe({
        next: () => {
          this.toast.success('Warehouse created successfully');
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

  deleteWarehouse(): void {
    if (this.deleteId === null) return;
    this.warehouseService.deleteWarehouse(this.deleteId).subscribe({
      next: () => {
        this.toast.success('Warehouse deleted successfully');
        this.deleteId = null;
        this.loadData();
      }
    });
  }
}
