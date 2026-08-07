import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  mortgageExpenses: number;
  householdBillExpenses: number;
  petExpenses: number;
  medicalExpenses: number;
  supermarketExpenses: number;
  educationExpenses: number;
  entertainmentExpenses: number;
  remainingBudget: number;
  recentTransactions: { id:string; description:string; amount:number; registeredAtUtc:string; transactionType:number; source:string; icon:string }[];
  spendingByCategory: { category:string; amount:number }[];
}

@Component({
  standalone:true,
  imports:[CurrencyPipe,DatePipe,MatCardModule,MatIconModule],
  template:`
    <header><p class="eyebrow">OVERVIEW</p><h1>Your financial garden</h1><p>A calm snapshot of your money this month.</p></header>
    <section class="metrics">@for(card of cards();track card.label){<mat-card><mat-icon>{{card.icon}}</mat-icon><span>{{card.label}}</span><strong>{{card.value|currency:'EUR'}}</strong><small>{{card.note}}</small></mat-card>}</section>
    <section class="panels">
      <mat-card><h2>Monthly cash flow</h2><div class="flow"><div><span>Income</span><strong class="income">{{summary()?.monthlyIncome ?? 0 | currency:'EUR'}}</strong></div><div><span>Expenses</span><strong class="expense">{{summary()?.monthlyExpenses ?? 0 | currency:'EUR'}}</strong></div></div>@if((summary()?.mortgageExpenses ?? 0)>0){<p class="expense-note"><mat-icon>cottage</mat-icon> Includes {{summary()!.mortgageExpenses | currency:'EUR'}} in mortgage payments.</p>}@if((summary()?.householdBillExpenses ?? 0)>0){<p class="expense-note"><mat-icon>home_work</mat-icon> Includes {{summary()!.householdBillExpenses | currency:'EUR'}} in household bills.</p>}@if((summary()?.medicalExpenses ?? 0)>0){<p class="expense-note"><mat-icon>medical_services</mat-icon> Includes {{summary()!.medicalExpenses | currency:'EUR'}} in medical expenses.</p>}@if((summary()?.supermarketExpenses ?? 0)>0){<p class="expense-note"><mat-icon>shopping_cart</mat-icon> Includes {{summary()!.supermarketExpenses | currency:'EUR'}} in supermarket expenses.</p>}@if((summary()?.educationExpenses ?? 0)>0){<p class="expense-note"><mat-icon>school</mat-icon> Includes {{summary()!.educationExpenses | currency:'EUR'}} in education expenses.</p>}@if((summary()?.entertainmentExpenses ?? 0)>0){<p class="expense-note"><mat-icon>sports_esports</mat-icon> Includes {{summary()!.entertainmentExpenses | currency:'EUR'}} in entertainment expenses.</p>}@if((summary()?.petExpenses ?? 0)>0){<p class="expense-note"><mat-icon>pets</mat-icon> Includes {{summary()!.petExpenses | currency:'EUR'}} in pet expenses.</p>}</mat-card>
      <mat-card><h2>Spending by category</h2>@if(summary()?.spendingByCategory?.length){<div class="categories">@for(item of summary()!.spendingByCategory;track item.category){<div><span>{{item.category}}</span><strong>{{item.amount|currency:'EUR'}}</strong></div>}</div>}@else{<div class="empty">No spending recorded this month.</div>}</mat-card>
      <mat-card class="recent"><h2>Recent registrations</h2><p class="panel-copy">The newest financial records added anywhere in Finora.</p>@if(summary()?.recentTransactions?.length){<div class="transactions">@for(item of summary()!.recentTransactions;track item.source+item.id){<div class="activity"><span class="activity-icon"><mat-icon>{{item.icon}}</mat-icon></span><span><strong>{{item.description}}</strong><small>{{item.source}} · {{item.registeredAtUtc|date:'medium'}}</small></span><strong [class.expense]="item.transactionType===1" [class.neutral]="item.transactionType===2">{{item.transactionType===1?'-':item.transactionType===0?'+':''}}{{item.amount|currency:'EUR'}}</strong></div>}</div>}@else{<div class="empty">Your newest income, debts, bills, and expenses will appear here.</div>}</mat-card>
    </section>`,
  styles:[`header h1{font-size:clamp(1.8rem,4vw,2.6rem);margin:.15rem 0}.eyebrow{letter-spacing:.15em;color:#397454;font-weight:700}.metrics{display:grid;grid-template-columns:repeat(4,minmax(180px,1fr));gap:1rem;margin:2rem 0}.metrics mat-card{padding:1.2rem}.metrics mat-icon{color:#397454}.metrics span,.metrics small{color:#637069}.metrics strong{font-size:1.6rem;margin:.5rem 0}.panels{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.panels mat-card{padding:1.25rem;min-height:240px}.recent{grid-column:1/-1}.panel-copy{margin:.25rem 0;color:#718078}.empty{display:grid;place-items:center;height:150px;color:#718078;text-align:center}.flow,.categories,.transactions{display:grid;gap:.8rem;margin-top:1.5rem}.flow>div,.categories>div,.transactions>div{display:flex;justify-content:space-between;gap:1rem;padding-bottom:.7rem;border-bottom:1px solid #e3e9e5}.transactions span{display:grid}.transactions small{color:#718078}.activity{display:grid!important;grid-template-columns:auto 1fr auto;align-items:center}.activity-icon{display:grid!important;place-items:center;width:38px;height:38px;border-radius:11px;background:#e3f1e6;color:#397454}.activity-icon mat-icon{font-size:20px;width:20px;height:20px}.income{color:#397454}.expense{color:#a3423c}.neutral{color:#53675c}.expense-note{display:flex;align-items:center;gap:.5rem;margin:1rem 0 0;color:#53675c}.expense-note mat-icon{color:#397454}@media(max-width:900px){.metrics{grid-template-columns:repeat(2,1fr)}.panels{grid-template-columns:1fr}.recent{grid-column:auto}}@media(max-width:500px){.metrics{grid-template-columns:1fr}.activity{grid-template-columns:auto 1fr!important}.activity>strong{grid-column:2}}`]
})
export class DashboardComponent implements OnInit {
  private readonly http=inject(HttpClient);
  summary=signal<DashboardSummary|null>(null);
  cards=()=>{const s=this.summary();return [{label:'Current balance',value:s?.totalBalance??0,icon:'account_balance',note:'After this month’s expenses'},{label:'Monthly income',value:s?.monthlyIncome??0,icon:'trending_up',note:'This month'},{label:'Monthly expenses',value:s?.monthlyExpenses??0,icon:'trending_down',note:s?.mortgageExpenses?`Includes mortgage payments`:'This month'},{label:'Remaining budget',value:s?.remainingBudget??0,icon:'spa',note:'Ready to allocate'}];};
  ngOnInit(){const today=new Date();this.http.get<DashboardSummary>(`/api/dashboard/summary?month=${today.getMonth()+1}&year=${today.getFullYear()}`).subscribe(value=>this.summary.set(value));}
}
