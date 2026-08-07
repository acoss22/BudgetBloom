import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
  ],
  template: `
    <mat-sidenav-container>
      <mat-sidenav #drawer mode="side" opened>
        <a class="brand" routerLink="/dashboard"><span>F</span> Finora</a>
        <nav aria-label="Main navigation">
          @for (item of nav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active">
              <mat-icon>{{ item.icon }}</mat-icon>
              {{ item.label }}
            </a>
          }
        </nav>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar>
          <button mat-icon-button (click)="drawer.toggle()" aria-label="Toggle navigation">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="spacer"></span>
          <span class="user">{{ auth.user()?.displayName }}</span>
          <button mat-button (click)="logout()">Logout</button>
        </mat-toolbar>
        <main class="content"><router-outlet /></main>
        <footer>Finora v{{ version }}</footer>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      mat-sidenav-container {
        min-height: 100dvh;
      }
      mat-sidenav {
        width: 240px;
        padding: 1.25rem;
        background: #143a2a;
        color: white;
      }
      mat-sidenav-content {
        display: flex;
        min-height: 100dvh;
        flex-direction: column;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: white;
        text-decoration: none;
        font-size: 1.4rem;
        font-weight: 700;
        margin-bottom: 2rem;
      }
      .brand span {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: #9bdd79;
        color: #143a2a;
      }
      nav {
        display: grid;
        gap: 0.3rem;
      }
      nav a {
        display: flex;
        gap: 0.8rem;
        align-items: center;
        padding: 0.75rem;
        border-radius: 10px;
        color: #dce9e1;
        text-decoration: none;
      }
      .active,
      nav a:hover {
        background: #285844;
        color: white;
      }
      mat-toolbar {
        position: sticky;
        top: 0;
        z-index: 2;
        background: white;
        border-bottom: 1px solid #e2e8e4;
      }
      .spacer {
        flex: 1;
      }
      .content {
        flex: 1;
        padding: clamp(1rem, 3vw, 2rem);
        background: #f5f7f5;
      }
      footer {
        padding: 0.75rem clamp(1rem, 3vw, 2rem);
        border-top: 1px solid #e2e8e4;
        background: #f5f7f5;
        color: #607068;
        font-size: 0.75rem;
        text-align: right;
      }
      @media (max-width: 700px) {
        mat-sidenav {
          width: 210px;
        }
        .user {
          display: none;
        }
      }
    `,
  ],
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly version = '0.0.0';
  private readonly router = inject(Router);

  readonly nav = [
    ['dashboard', 'dashboard', 'Dashboard'],
    ['accounts', 'account_balance_wallet', 'Accounts'],
    ['transactions', 'swap_horiz', 'Transactions'],
    ['categories', 'category', 'Categories'],
    ['budgets', 'savings', 'Budgets'],
    ['recurring-transactions', 'repeat', 'Recurring'],
    ['mortgages', 'cottage', 'Mortgages'],
    ['household-bills', 'receipt_long', 'Household bills'],
    ['settings', 'settings', 'Settings'],
  ].map(([path, icon, label]) => ({ path, icon, label }));

  logout() {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
