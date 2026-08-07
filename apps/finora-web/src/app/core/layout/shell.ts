import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
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
      <mat-sidenav #drawer [mode]="isMobile() ? 'over' : 'side'" [opened]="!isMobile()">
        <a class="brand" routerLink="/dashboard" (click)="closeNavigation(drawer)"><span><mat-icon>spa</mat-icon></span><span class="brand-copy">Finora<small>Money, made clearer</small></span></a>
        <p class="nav-label">Workspace</p>
        <nav aria-label="Main navigation">
          @for (item of nav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" (click)="closeNavigation(drawer)">
              <mat-icon>{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
        <div class="sidebar-note"><mat-icon>verified_user</mat-icon><span><strong>Your data is private</strong><small>Protected financial workspace</small></span></div>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar>
          <button mat-icon-button (click)="drawer.toggle()" aria-label="Toggle navigation">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="toolbar-title">Financial workspace</span>
          <span class="spacer"></span>
          <span class="user"><mat-icon>account_circle</mat-icon><span>{{ auth.user()?.displayName }}</span></span>
          <button mat-button (click)="logout()"><mat-icon>logout</mat-icon><span class="logout-label">Logout</span></button>
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
        width: 264px;
        padding: 1.35rem 1rem;
        background: linear-gradient(180deg, #123a29 0%, #0d2f21 100%);
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
        margin: 0 .35rem 2rem;
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
      .brand-copy{display:grid;line-height:1.1}.brand-copy small{margin-top:.3rem;color:#bcd1c4;font-size:.68rem;font-weight:400;letter-spacing:.02em}.nav-label{margin:0 .8rem .55rem;color:#91ad9d;font-size:.68rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
      nav {
        display: grid;
        gap: 0.35rem;
      }
      nav a {
        display: flex;
        gap: 0.8rem;
        align-items: center;
        padding: 0.78rem .85rem;
        border-radius: 12px;
        color: #dce9e1;
        text-decoration: none;
      }
      nav a mat-icon{color:#9fc7ae}nav a.active mat-icon,nav a:hover mat-icon{color:#baf09f}
      .active,
      nav a:hover {
        background: #285844;
        color: white;
      }
      mat-toolbar {
        position: sticky;
        top: 0;
        z-index: 2;
        min-height:64px;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);
        border-bottom: 1px solid #e2e8e4;
      }
      .toolbar-title{font-size:.9rem;font-weight:600;color:#52675c}.user{display:flex;align-items:center;gap:.45rem;margin-right:.5rem;color:#334b3f;font-size:.88rem}.user mat-icon{color:#397454}.sidebar-note{display:flex;gap:.7rem;align-items:center;position:absolute;right:1rem;bottom:1.1rem;left:1rem;padding:.85rem;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.06);color:#dce9e1}.sidebar-note>mat-icon{color:#9bdd79}.sidebar-note span{display:grid}.sidebar-note small{margin-top:.15rem;color:#9fbaaa;font-size:.68rem}.sidebar-note strong{font-size:.76rem}
      .spacer {
        flex: 1;
      }
      .content {
        flex: 1;
        padding: clamp(1rem, 3vw, 2rem);
        background:radial-gradient(circle at 90% 0,#e8f3ea 0,transparent 28rem),#f4f7f4;
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
          width:min(290px,86vw);
        }
        .toolbar-title,.user span,.logout-label{display:none}.user{margin:0}.content{padding:1rem}mat-toolbar{padding:0 .55rem}
      }
    `,
  ],
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly isMobile = toSignal(inject(BreakpointObserver).observe('(max-width: 700px)').pipe(map(result => result.matches)), { initialValue: false });
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
    ['household-bills', 'home_work', 'Household bills'],
    ['medical-expenses', 'medical_services', 'Medical expenses'],
    ['settings', 'settings', 'Settings'],
  ].map(([path, icon, label]) => ({ path, icon, label }));

  closeNavigation(drawer: MatSidenav) { if (this.isMobile()) drawer.close(); }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
