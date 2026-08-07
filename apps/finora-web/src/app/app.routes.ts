import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register').then(m => m.RegisterComponent) },
  { path: '', canActivate: [authGuard], loadComponent: () => import('./core/layout/shell').then(m => m.ShellComponent), children: [
    { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent) },
    { path: 'mortgages', loadComponent: () => import('./features/mortgages/mortgages').then(m => m.MortgagesComponent) },
    { path: 'household-bills', loadComponent: () => import('./features/household-bills/household-bills').then(m => m.HouseholdBillsComponent) },
    ...['accounts','transactions','categories','budgets','recurring-transactions','settings'].map(path => ({ path, loadComponent: () => import('./features/placeholder').then(m => m.PlaceholderComponent), data: { title: path } })),
    { path: '', pathMatch: 'full' as const, redirectTo: 'dashboard' }
  ]}, { path: '**', redirectTo: 'dashboard' }
];
