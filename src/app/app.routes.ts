import { Routes } from '@angular/router';
import { Layout } from './features/layout/layout';
import { Login } from './features/login/login';
import { Dashboard } from './features/dashboard/dashboard';
import { Books } from './features/books/books';
import { Claims } from './features/claims/claims';
import { Einvoicing } from './features/einvoicing/einvoicing';
import { Fleet } from './features/fleet/fleet';
import { Freezer } from './features/freezer/freezer';
import { Purchase } from './features/purchase/purchase';
import { Reports } from './features/reports/reports';
import { Sales } from './features/sales/sales';
import { Stocks } from './features/stocks/stocks';
import { Statement } from './features/statement/statement';
import { Expenses } from './features/expenses/expenses';
import { Staff } from './features/staff/staff';
import { Masters } from './features/masters/masters';
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: 'app',
    component: Layout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'purchase', component: Purchase },
      { path: 'sales', component: Sales },
      { path: 'stocks', component: Stocks },
      { path: 'books', component: Books },
      { path: 'statement-ledgers', component: Statement },
      { path: 'claims', component: Claims },
      { path: 'einvoicing', component: Einvoicing },
      { path: 'expenses', component: Expenses },
      { path: 'freezer', component: Freezer },
      { path: 'fleet', component: Fleet },
      { path: 'reports', component: Reports },
      { path: 'staff', component: Staff },
      { path: 'masters', component: Masters }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
