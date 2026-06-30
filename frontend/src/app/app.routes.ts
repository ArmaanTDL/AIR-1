import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductsComponent } from './pages/products/products.component';
import { WarehousesComponent } from './pages/warehouses/warehouses.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { SuppliersComponent } from './pages/suppliers/suppliers.component';
import { AlertsComponent } from './pages/alerts/alerts.component';
import { TransactionLogComponent } from './pages/transaction-log/transaction-log.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'console',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'warehouses', component: WarehousesComponent },
      { path: 'inventory', component: InventoryComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'suppliers', component: SuppliersComponent },
      { path: 'alerts', component: AlertsComponent },
      { path: 'transactions', component: TransactionLogComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
