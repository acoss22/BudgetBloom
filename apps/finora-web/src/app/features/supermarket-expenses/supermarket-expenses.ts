import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ExportData, ExportMenuComponent } from '../../core/export/export-menu';

interface SupermarketExpense { id:string; store:string; description:string; expenseType:number; amount:number; currencyCode:string; expenseDate:string; notes:string|null; }

@Component({
  standalone:true,
  imports:[CurrencyPipe,DatePipe,ReactiveFormsModule,MatButtonModule,MatCardModule,MatFormFieldModule,MatIconModule,MatInputModule,MatSelectModule,ExportMenuComponent],
  template:`
    <header><p class="eyebrow">EVERYDAY ESSENTIALS</p><div class="header-row"><div><h1>Supermarket expenses</h1><p>Track grocery runs and everyday household purchases by shop and category.</p></div><app-export-menu [data]="exportData()" /></div></header>
    <section class="summary" aria-label="Supermarket expense summary">
      <mat-card><span class="summary-icon"><mat-icon>shopping_cart</mat-icon></span><span>This month</span><strong>{{currentMonthTotal()|currency:'EUR'}}</strong></mat-card>
      <mat-card><span class="summary-icon"><mat-icon>receipt_long</mat-icon></span><span>Purchases this month</span><strong>{{currentMonthCount()}}</strong></mat-card>
    </section>
    <div class="layout">
      <mat-card class="form-card"><h2>{{editingId()?'Edit supermarket expense':'Add supermarket expense'}}</h2>
        <form [formGroup]="form" (ngSubmit)="save()"><div class="fields">
          <mat-form-field><mat-label>Purchase category</mat-label><mat-select formControlName="expenseType">@for(type of expenseTypes;track type.value){<mat-option [value]="type.value"><mat-icon>{{type.icon}}</mat-icon>{{type.label}}</mat-option>}</mat-select></mat-form-field>
          <mat-form-field><mat-label>Purchase date</mat-label><input matInput type="date" formControlName="expenseDate"></mat-form-field>
          <mat-form-field class="wide"><mat-label>Supermarket or store</mat-label><input matInput formControlName="store" placeholder="Store name"></mat-form-field>
          <mat-form-field class="wide"><mat-label>Description</mat-label><input matInput formControlName="description" placeholder="Weekly groceries"></mat-form-field>
          <mat-form-field><mat-label>Total amount</mat-label><input matInput type="number" min="0.01" step="0.01" formControlName="amount"><span matTextSuffix>EUR</span></mat-form-field>
          <mat-form-field class="wide"><mat-label>Notes (optional)</mat-label><textarea matInput rows="3" maxlength="1000" formControlName="notes" placeholder="Items, discounts, or receipt reference..."></textarea><mat-hint align="end">{{form.controls.notes.value.length}} / 1000</mat-hint></mat-form-field>
        </div><div class="form-actions"><button mat-flat-button type="submit" [disabled]="form.invalid||saving()">{{saving()?'Saving…':editingId()?'Save changes':'Add expense'}}</button>@if(editingId()){<button mat-button type="button" (click)="cancelEdit()">Cancel</button>}</div></form>
      </mat-card>
      <section class="expenses" aria-live="polite">
        @if(loading()){<mat-card class="empty">Loading supermarket expenses…</mat-card>}
        @else if(!expenses().length){<mat-card class="empty"><mat-icon>shopping_basket</mat-icon><h2>No supermarket expenses yet</h2><p>Add your first grocery or household purchase.</p></mat-card>}
        @for(expense of expenses();track expense.id){<mat-card class="expense-card"><div class="expense-head"><span class="type-icon"><mat-icon>{{typeIcon(expense.expenseType)}}</mat-icon></span><div><h2>{{expense.store}}</h2><p>{{expense.description}} · {{typeLabel(expense.expenseType)}}</p></div><div class="actions"><button mat-icon-button (click)="edit(expense)" [attr.aria-label]="'Edit '+expense.description"><mat-icon>edit</mat-icon></button><button mat-icon-button (click)="remove(expense)" [attr.aria-label]="'Delete '+expense.description"><mat-icon>delete_outline</mat-icon></button></div></div><div class="amount"><strong>{{expense.amount|currency:expense.currencyCode}}</strong><span>{{expense.expenseDate|date:'mediumDate'}}</span></div>@if(expense.notes){<p class="notes">{{expense.notes}}</p>}</mat-card>}
      </section>
    </div>`,
  styles:[`header h1{font-size:clamp(1.8rem,4vw,2.6rem);margin:.15rem 0}.eyebrow{letter-spacing:.15em;color:#397454;font-weight:700}.header-row{display:flex;justify-content:space-between;align-items:center;gap:1.5rem}.header-row p{margin-bottom:0}.summary{display:grid;grid-template-columns:repeat(2,minmax(220px,320px));gap:1rem;margin:2rem 0}.summary mat-card{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:.15rem .9rem;padding:1rem 1.2rem}.summary-icon{grid-row:1/3;display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#e3f1e6;color:#397454}.summary span{color:#68766f}.summary strong{font-size:1.4rem}.layout{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(330px,.95fr);gap:1.25rem;align-items:start}mat-card{padding:1.3rem}.form-card h2{margin-bottom:1.3rem}.fields{display:grid;grid-template-columns:1fr 1fr;gap:0 1rem}.wide{grid-column:1/-1}.form-actions{display:flex;gap:.5rem;align-items:center;margin-top:1rem}.form-actions button:first-child{flex:1}.expenses{display:grid;gap:1rem}.empty{min-height:220px;display:grid;place-content:center;text-align:center;color:#68766f}.empty>mat-icon{margin:auto;font-size:42px;width:42px;height:42px;color:#397454}.expense-head{display:grid;grid-template-columns:auto 1fr auto;gap:.8rem}.type-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#e3f1e6;color:#285844}.expense-card h2{font-size:1.08rem;margin:0}.expense-card p{color:#68766f;margin:.2rem 0}.actions{display:flex}.amount{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;margin:1.2rem 0}.amount strong{font-size:1.65rem}.amount span{color:#68766f;font-size:.85rem}.notes{padding-top:.8rem;border-top:1px solid #e3e9e5;white-space:pre-wrap}@media(max-width:1000px){.layout{grid-template-columns:1fr}}@media(max-width:600px){.header-row{align-items:stretch;flex-direction:column}.header-row app-export-menu{align-self:flex-start}.summary,.fields{grid-template-columns:1fr}.wide{grid-column:auto}.expense-head{grid-template-columns:auto 1fr}.actions{grid-column:2}.amount{align-items:flex-start;flex-direction:column;gap:.2rem}}`]
})
export class SupermarketExpensesComponent implements OnInit {
  private readonly http=inject(HttpClient); readonly expenses=signal<SupermarketExpense[]>([]); readonly loading=signal(true); readonly saving=signal(false); readonly editingId=signal<string|null>(null);
  readonly expenseTypes=[{value:0,label:'Groceries',icon:'local_grocery_store'},{value:1,label:'Household supplies',icon:'cleaning_services'},{value:2,label:'Personal care',icon:'self_care'},{value:3,label:'Baby',icon:'child_friendly'},{value:4,label:'Pet',icon:'pets'},{value:5,label:'Other',icon:'shopping_basket'}];
  readonly form=new FormGroup({store:new FormControl('',{nonNullable:true,validators:[Validators.required]}),description:new FormControl('',{nonNullable:true,validators:[Validators.required]}),expenseType:new FormControl(0,{nonNullable:true,validators:[Validators.required]}),amount:new FormControl<number|null>(null,[Validators.required,Validators.min(.01)]),currencyCode:new FormControl('EUR',{nonNullable:true}),expenseDate:new FormControl(new Date().toISOString().slice(0,10),{nonNullable:true,validators:[Validators.required]}),notes:new FormControl('',{nonNullable:true,validators:[Validators.maxLength(1000)]})});
  ngOnInit(){this.load();} load(){this.http.get<SupermarketExpense[]>('/api/supermarket-expenses').subscribe({next:value=>{this.expenses.set(value);this.loading.set(false);},error:()=>this.loading.set(false)});}
  typeLabel(type:number){return this.expenseTypes.find(item=>item.value===type)?.label??'Other';} typeIcon(type:number){return this.expenseTypes.find(item=>item.value===type)?.icon??'shopping_basket';}
  isCurrentMonth(item:SupermarketExpense){const today=new Date();const date=new Date(`${item.expenseDate}T00:00:00`);return date.getMonth()===today.getMonth()&&date.getFullYear()===today.getFullYear();}
  currentMonthTotal(){return this.expenses().filter(item=>this.isCurrentMonth(item)).reduce((sum,item)=>sum+item.amount,0);} currentMonthCount(){return this.expenses().filter(item=>this.isCurrentMonth(item)).length;}
  exportData():ExportData{const expenses=this.expenses();return{title:'Finora Supermarket Expenses',fileName:'finora-supermarket-expenses',columns:['Store','Description','Category','Amount','Currency','Date','Notes'],rows:expenses.map(item=>[item.store,item.description,this.typeLabel(item.expenseType),item.amount.toFixed(2),item.currencyCode,item.expenseDate,item.notes]),summary:[`Purchases: ${expenses.length}`,`Current month total: ${this.currentMonthTotal().toFixed(2)} EUR`]};}
  save(){if(this.form.invalid)return;this.saving.set(true);const id=this.editingId();const value=this.form.getRawValue();const payload={...value,notes:value.notes.trim()||null};const request=id?this.http.put<SupermarketExpense>(`/api/supermarket-expenses/${id}`,payload):this.http.post<SupermarketExpense>('/api/supermarket-expenses',payload);request.subscribe({next:expense=>{this.expenses.update(items=>(id?items.map(item=>item.id===id?expense:item):[expense,...items]).sort((a,b)=>b.expenseDate.localeCompare(a.expenseDate)||a.store.localeCompare(b.store)));this.cancelEdit();this.saving.set(false);},error:()=>this.saving.set(false)});}
  edit(expense:SupermarketExpense){this.editingId.set(expense.id);this.form.setValue({store:expense.store,description:expense.description,expenseType:expense.expenseType,amount:expense.amount,currencyCode:expense.currencyCode,expenseDate:expense.expenseDate,notes:expense.notes??''});window.scrollTo({top:0,behavior:'smooth'});}
  cancelEdit(){this.editingId.set(null);this.form.reset({expenseType:0,currencyCode:'EUR',expenseDate:new Date().toISOString().slice(0,10),notes:''});}
  remove(expense:SupermarketExpense){if(!confirm(`Delete ${expense.description}?`))return;this.http.delete(`/api/supermarket-expenses/${expense.id}`).subscribe(()=>this.expenses.update(items=>items.filter(item=>item.id!==expense.id)));}
}
