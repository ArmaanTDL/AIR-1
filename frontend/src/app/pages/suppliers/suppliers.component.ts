import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService, Supplier } from '../../services/supplier.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.css']
})
export class SuppliersComponent implements OnInit {
  suppliers: Supplier[] = [];
  query = '';
  loading = true;

  // Modal States
  modalOpen = false;
  editing: Supplier | null = null;
  saving = false;

  // Form State
  form: Supplier = {
    name: '',
    contact_email: '',
    phone: '',
    address: ''
  };

  // Delete State
  deleteId: number | null = null;

  constructor(
    private supplierService: SupplierService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.supplierService.getSuppliers().subscribe({
      next: (res) => {
        this.suppliers = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getFilteredSuppliers(): Supplier[] {
    if (!this.query.trim()) return this.suppliers;
    const q = this.query.toLowerCase();
    return this.suppliers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.contact_email.toLowerCase().includes(q)
    );
  }

  openCreate(): void {
    this.editing = null;
    this.form = {
      name: '',
      contact_email: '',
      phone: '',
      address: ''
    };
    this.modalOpen = true;
  }

  openEdit(s: Supplier): void {
    this.editing = s;
    this.form = {
      name: s.name,
      contact_email: s.contact_email,
      phone: s.phone,
      address: s.address
    };
    this.modalOpen = true;
  }

  saveSupplier(event: Event): void {
    event.preventDefault();
    if (!this.form.name || !this.form.contact_email) {
      this.toast.error('Please enter name and contact email');
      return;
    }

    this.saving = true;
    if (this.editing && this.editing.id) {
      this.supplierService.updateSupplier(this.editing.id, this.form).subscribe({
        next: () => {
          this.toast.success('Supplier updated successfully');
          this.modalOpen = false;
          this.loadData();
          this.saving = false;
        },
        error: () => {
          this.saving = false;
        }
      });
    } else {
      this.supplierService.createSupplier(this.form).subscribe({
        next: () => {
          this.toast.success('Supplier created successfully');
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

  deleteSupplier(): void {
    if (this.deleteId === null) return;
    this.supplierService.deleteSupplier(this.deleteId).subscribe({
      next: () => {
        this.toast.success('Supplier deleted successfully');
        this.deleteId = null;
        this.loadData();
      }
    });
  }
}
