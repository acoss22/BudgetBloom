import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface HouseholdBill { id:string; name:string; provider:string; billType:number; amount:number; currencyCode:string; billingDay:number; startDate:string; endDate:string|null; isActive:boolean; isRecurring:boolean; }
interface RecurringTransaction { id:string; accountId:string; categoryId:string|null; transactionType:number; amount:number; description:string; frequency:number; startDate:string; nextOccurrenceDate:string; endDate:string|null; isActive:boolean; }

@Component({
  standalone:true,
  imports:[CurrencyPipe,DatePipe,RouterLink,MatButtonModule,MatCardModule,MatIconModule],
  template:`
    <header><p class="eyebrow">SCHEDULED MONEY</p><div class="header-row"><div><h1>Recurring</h1><p>See bills and transactions that repeat on a schedule in one place.</p></div><a mat-flat-button routerLink="/household-bills"><mat-icon>add</mat-icon>Add household bill</a></div></header>
    <section class="summary"><mat-card><span class="summary-icon"><mat-icon>repeat</mat-icon></span><span>Active recurring items</span><strong>{{activeCount()}}</strong></mat-card><mat-card><span class="summary-icon"><mat-icon>home_work</mat-icon></span><span>Monthly household bills</span><strong>{{monthlyBillTotal()|currency:'EUR'}}</strong></mat-card></section>
    @if(loading()){<mat-card class="empty">Loading recurring items…</mat-card>}@else{
      <section class="group"><div class="section-title"><div><p class="eyebrow">MONTHLY</p><h2>Recurring household bills</h2></div><a mat-button routerLink="/household-bills">Manage bills</a></div>
        @if(!recurringBills().length){<mat-card class="empty"><mat-icon>receipt_long</mat-icon><h3>No recurring household bills</h3><p>Mark a household bill as recurring to show it here.</p></mat-card>}
        <div class="items">@for(bill of recurringBills();track bill.id){<mat-card class="item" [class.inactive]="!bill.isActive"><span class="item-icon"><mat-icon>{{billIcon(bill.billType)}}</mat-icon></span><div class="item-copy"><h3>{{bill.name}}</h3><p>{{bill.provider}} · Monthly on day {{bill.billingDay}}</p><small>{{bill.startDate|date:'mediumDate'}} – {{bill.endDate?(bill.endDate|date:'mediumDate'):'Ongoing'}}</small></div><div class="item-value"><strong>{{bill.amount|currency:bill.currencyCode}}</strong><span>{{bill.isActive?'Active':'Paused'}}</span></div><a mat-icon-button routerLink="/household-bills" [attr.aria-label]="'Edit '+bill.name+' in household bills'"><mat-icon>edit</mat-icon></a></mat-card>}</div>
      </section>
      <section class="group"><div class="section-title"><div><p class="eyebrow">OTHER SCHEDULES</p><h2>Recurring transactions</h2></div></div>
        @if(!transactions().length){<mat-card class="empty"><mat-icon>event_repeat</mat-icon><h3>No recurring transactions yet</h3><p>Scheduled transactions will appear here.</p></mat-card>}
        <div class="items">@for(item of transactions();track item.id){<mat-card class="item" [class.inactive]="!item.isActive"><span class="item-icon"><mat-icon>{{item.transactionType===0?'trending_up':'trending_down'}}</mat-icon></span><div class="item-copy"><h3>{{item.description}}</h3><p>{{frequencyLabel(item.frequency)}} · Next {{item.nextOccurrenceDate|date:'mediumDate'}}</p><small>Started {{item.startDate|date:'mediumDate'}}@if(item.endDate){<span> · Ends {{item.endDate|date:'mediumDate'}}</span>}</small></div><div class="item-value"><strong>{{item.amount|currency:'EUR'}}</strong><span>{{item.isActive?'Active':'Paused'}}</span></div></mat-card>}</div>
      </section>
    }`,
  styles:[`header h1{font-size:clamp(1.8rem,4vw,2.6rem);margin:.15rem 0}.eyebrow{margin:0;letter-spacing:.15em;color:#397454;font-size:.75rem;font-weight:700}.header-row,.section-title{display:flex;justify-content:space-between;align-items:center;gap:1rem}.summary{display:grid;grid-template-columns:repeat(2,minmax(220px,320px));gap:1rem;margin:2rem 0}.summary mat-card{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:.15rem .9rem;padding:1rem 1.2rem}.summary-icon{grid-row:1/3;display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#e3f1e6;color:#397454}.summary span{color:#68766f}.summary strong{font-size:1.4rem}.group{display:grid;gap:1rem;margin-top:2rem}.section-title h2{margin:.2rem 0}.items{display:grid;gap:.75rem}.item{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:1rem;padding:1rem 1.2rem}.item.inactive{opacity:.65}.item-icon{display:grid;place-items:center;width:44px;height:44px;border-radius:13px;background:#e3f1e6;color:#285844}.item-copy h3{margin:0;font-size:1rem}.item-copy p{margin:.2rem 0;color:#53675c}.item-copy small,.item-value span{color:#718078}.item-value{display:grid;text-align:right}.empty{min-height:180px;display:grid;place-content:center;text-align:center;color:#68766f}.empty>mat-icon{margin:auto;font-size:38px;width:38px;height:38px;color:#397454}@media(max-width:650px){.header-row{align-items:flex-start;flex-direction:column}.summary{grid-template-columns:1fr}.item{grid-template-columns:auto 1fr}.item-value{grid-column:2;text-align:left}.item>a{grid-column:2}}`]
})
export class RecurringComponent implements OnInit {
  private readonly http=inject(HttpClient); readonly bills=signal<HouseholdBill[]>([]); readonly transactions=signal<RecurringTransaction[]>([]); readonly loading=signal(true); readonly recurringBills=computed(()=>this.bills().filter(x=>x.isRecurring).sort((a,b)=>a.billingDay-b.billingDay)); readonly monthlyBillTotal=computed(()=>this.recurringBills().filter(x=>x.isActive).reduce((sum,item)=>sum+item.amount,0)); readonly activeCount=computed(()=>this.recurringBills().filter(x=>x.isActive).length+this.transactions().filter(x=>x.isActive).length);
  ngOnInit(){forkJoin({bills:this.http.get<HouseholdBill[]>('/api/household-bills'),transactions:this.http.get<RecurringTransaction[]>('/api/recurring-transactions')}).subscribe({next:value=>{this.bills.set(value.bills);this.transactions.set(value.transactions);this.loading.set(false)},error:()=>this.loading.set(false)});} billIcon(type:number){return ['water_drop','bolt','local_fire_department','wifi','smartphone'][type]??'receipt_long';} frequencyLabel(frequency:number){return ['Weekly','Monthly','Quarterly','Yearly'][frequency]??'Scheduled';}
}
