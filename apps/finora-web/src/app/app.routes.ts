import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register').then(m => m.RegisterComponent) },
  { path: '', canActivate: [authGuard], loadComponent: () => import('./core/layout/shell').then(m => m.ShellComponent), children: [
    { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent) },
    { path: 'mortgages', loadComponent: () => import('./features/mortgages/mortgages').then(m => m.MortgagesComponent) },
    { path: 'household-bills', loadComponent: () => import('./features/household-bills/household-bills').then(m => m.HouseholdBillsComponent) },
    { path: 'medical-expenses', loadComponent: () => import('./features/medical-expenses/medical-expenses').then(m => m.MedicalExpensesComponent) },
    { path: 'supermarket-expenses', loadComponent: () => import('./features/supermarket-expenses/supermarket-expenses').then(m => m.SupermarketExpensesComponent) },
    { path: 'education-expenses', loadComponent: () => import('./features/personal-expenses/personal-expenses').then(m => m.PersonalExpensesComponent), data: { area: 0 } },
    { path: 'entertainment-expenses', loadComponent: () => import('./features/personal-expenses/personal-expenses').then(m => m.PersonalExpensesComponent), data: { area: 1 } },
    { path: 'pet-expenses', loadComponent: () => import('./features/pet-expenses/pet-expenses').then(m => m.PetExpensesComponent) },
    { path: 'loans', loadComponent: () => import('./features/financial-products/financial-products').then(m => m.FinancialProductsComponent), data: { type: 0 } },
    { path: 'credit-cards', loadComponent: () => import('./features/financial-products/financial-products').then(m => m.FinancialProductsComponent), data: { type: 1 } },
    { path: 'debit-cards', loadComponent: () => import('./features/financial-products/financial-products').then(m => m.FinancialProductsComponent), data: { type: 2 } },
    { path: 'investments', loadComponent: () => import('./features/financial-products/financial-products').then(m => m.FinancialProductsComponent), data: { type: 3 } },
    { path: 'categories', loadComponent: () => import('./features/categories/categories').then(m => m.CategoriesComponent) },
    { path: 'budgets', loadComponent: () => import('./features/budgets/budgets').then(m => m.BudgetsComponent) },
    ...['accounts','transactions','recurring-transactions','settings'].map(path => ({ path, loadComponent: () => import('./features/placeholder').then(m => m.PlaceholderComponent), data: { title: path } })),
    { path: '', pathMatch: 'full' as const, redirectTo: 'dashboard' }
  ]}, { path: '**', redirectTo: 'dashboard' }
];
