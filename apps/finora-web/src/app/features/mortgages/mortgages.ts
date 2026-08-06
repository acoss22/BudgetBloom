import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

interface Mortgage {
  id: string; name: string; lender: string; propertyAddress: string | null;
  originalPrincipal: number; outstandingBalance: number; interestRate: number;
  rateType: number; monthlyPayment: number; currencyCode: string;
  startDate: string; endDate: string; paymentDay: number;
}

@Component({
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <header><p class="eyebrow">HOME LOANS</p><h1>Mortgages</h1><p>Keep your home loan balance, rate, and monthly payment in one place.</p></header>
    <div class="layout">
      <mat-card class="form-card"><h2>{{editingId() ? 'Edit mortgage' : 'Register a mortgage'}}</h2>
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="fields">
            <mat-form-field><mat-label>Mortgage name</mat-label><input matInput formControlName="name" placeholder="Main home"></mat-form-field>
            <mat-form-field><mat-label>Bank or lender</mat-label><input matInput formControlName="lender"></mat-form-field>
            <mat-form-field class="wide"><mat-label>Property address (optional)</mat-label><input matInput formControlName="propertyAddress"></mat-form-field>
            <mat-form-field><mat-label>Original loan amount</mat-label><input matInput type="number" min="0.01" formControlName="originalPrincipal"><span matTextSuffix>EUR</span></mat-form-field>
            <mat-form-field><mat-label>Outstanding balance</mat-label><input matInput type="number" min="0" formControlName="outstandingBalance"><span matTextSuffix>EUR</span></mat-form-field>
            <mat-form-field><mat-label>Interest rate</mat-label><input matInput type="number" min="0" max="100" step="0.001" formControlName="interestRate"><span matTextSuffix>%</span></mat-form-field>
            <mat-form-field><mat-label>Rate type</mat-label><mat-select formControlName="rateType"><mat-option [value]="0">Fixed</mat-option><mat-option [value]="1">Variable</mat-option><mat-option [value]="2">Mixed</mat-option></mat-select></mat-form-field>
            <mat-form-field><mat-label>Monthly payment</mat-label><input matInput type="number" min="0.01" formControlName="monthlyPayment"><span matTextSuffix>EUR</span></mat-form-field>
            <mat-form-field><mat-label>Payment day</mat-label><input matInput type="number" min="1" max="31" formControlName="paymentDay"></mat-form-field>
            <mat-form-field><mat-label>Start date</mat-label><input matInput type="date" formControlName="startDate"></mat-form-field>
            <mat-form-field><mat-label>End date</mat-label><input matInput type="date" formControlName="endDate"></mat-form-field>
          </div>
          @if (dateError()) { <p class="error">The end date must be after the start date.</p> }
          @if (balanceError()) { <p class="error">The outstanding balance cannot exceed the original loan amount.</p> }
          <div class="form-actions"><button mat-flat-button type="submit" [disabled]="form.invalid || saving() || dateError() || balanceError()">{{saving() ? 'Saving…' : editingId() ? 'Save changes' : 'Register mortgage'}}</button>@if(editingId()){<button mat-button type="button" (click)="cancelEdit()">Cancel</button>}</div>
        </form>
      </mat-card>
      <section class="loans" aria-live="polite">
        @if (loading()) { <mat-card class="empty">Loading mortgages…</mat-card> }
        @else if (!mortgages().length) { <mat-card class="empty"><mat-icon>cottage</mat-icon><h2>No mortgages registered</h2><p>Add your home loan to start tracking it.</p></mat-card> }
        @for (loan of mortgages(); track loan.id) {
          <mat-card class="loan"><div class="loan-head"><div><h2>{{loan.name}}</h2><p>{{loan.lender}}@if(loan.propertyAddress){ · {{loan.propertyAddress}}}</p></div><div><button mat-icon-button (click)="edit(loan)" [attr.aria-label]="'Edit ' + loan.name"><mat-icon>edit</mat-icon></button><button mat-icon-button (click)="remove(loan)" [attr.aria-label]="'Delete ' + loan.name"><mat-icon>delete_outline</mat-icon></button></div></div>
            <strong>{{loan.outstandingBalance | currency:loan.currencyCode}}</strong><span class="caption">outstanding of {{loan.originalPrincipal | currency:loan.currencyCode}}</span>
            <div class="progress"><span [style.width.%]="paidPercent(loan)"></span></div>
            <dl><div><dt>Monthly payment</dt><dd>{{loan.monthlyPayment | currency:loan.currencyCode}}</dd></div><div><dt>Interest</dt><dd>{{loan.interestRate | number:'1.2-4'}}% · {{rateLabel(loan.rateType)}}</dd></div><div><dt>Payment day</dt><dd>Day {{loan.paymentDay}}</dd></div><div><dt>Term ends</dt><dd>{{loan.endDate | date:'mediumDate'}}</dd></div></dl>
          </mat-card>
        }
      </section>
    </div>`,
  styles: [`header h1{font-size:clamp(1.8rem,4vw,2.6rem);margin:.15rem 0}.eyebrow{letter-spacing:.15em;color:#397454;font-weight:700}.layout{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);gap:1.25rem;margin-top:2rem;align-items:start}mat-card{padding:1.3rem}.form-card h2{margin-bottom:1.3rem}.fields{display:grid;grid-template-columns:1fr 1fr;gap:0 1rem}.wide{grid-column:1/-1}.form-actions{display:flex;gap:.5rem;align-items:center;margin-top:.5rem}.form-actions button:first-child{flex:1}.loans{display:grid;gap:1rem}.empty{min-height:220px;display:grid;place-content:center;text-align:center;color:#66756d}.empty mat-icon{margin:auto;font-size:42px;width:42px;height:42px;color:#397454}.loan-head{display:flex;justify-content:space-between;gap:1rem}.loan h2{margin-bottom:.25rem}.loan p,.caption,dt{color:#68766f}.loan>strong{display:block;font-size:1.8rem;margin-top:1.2rem}.caption{font-size:.85rem}.progress{height:8px;background:#e2e9e4;border-radius:10px;overflow:hidden;margin:1rem 0}.progress span{display:block;height:100%;background:#5c9b70}dl{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:0}dt{font-size:.75rem}dd{margin:.2rem 0 0;font-weight:600}.error{color:#b3261e;font-size:.85rem}@media(max-width:1000px){.layout{grid-template-columns:1fr}}@media(max-width:600px){.fields,dl{grid-template-columns:1fr}.wide{grid-column:auto}}`]
})
export class MortgagesComponent implements OnInit {
  private readonly http = inject(HttpClient);
  mortgages = signal<Mortgage[]>([]); loading = signal(true); saving = signal(false); editingId = signal<string|null>(null);
  form = new FormGroup({
    name:new FormControl('',{nonNullable:true,validators:[Validators.required]}), lender:new FormControl('',{nonNullable:true,validators:[Validators.required]}), propertyAddress:new FormControl('',{nonNullable:true}),
    originalPrincipal:new FormControl<number|null>(null,[Validators.required,Validators.min(.01)]), outstandingBalance:new FormControl<number|null>(null,[Validators.required,Validators.min(0)]), interestRate:new FormControl<number|null>(null,[Validators.required,Validators.min(0),Validators.max(100)]), rateType:new FormControl(1,{nonNullable:true,validators:[Validators.required]}), monthlyPayment:new FormControl<number|null>(null,[Validators.required,Validators.min(.01)]), paymentDay:new FormControl(1,{nonNullable:true,validators:[Validators.required,Validators.min(1),Validators.max(31)]}), startDate:new FormControl('',{nonNullable:true,validators:[Validators.required]}), endDate:new FormControl('',{nonNullable:true,validators:[Validators.required]}), currencyCode:new FormControl('EUR',{nonNullable:true})
  });
  ngOnInit(){this.load();}
  load(){this.http.get<Mortgage[]>('/api/mortgages').subscribe({next:x=>{this.mortgages.set(x);this.loading.set(false)},error:()=>this.loading.set(false)});}
  dateError(){const {startDate,endDate}=this.form.getRawValue();return !!startDate&&!!endDate&&endDate<=startDate;}
  balanceError(){const {originalPrincipal,outstandingBalance}=this.form.getRawValue();return originalPrincipal!==null&&outstandingBalance!==null&&outstandingBalance>originalPrincipal;}
  save(){if(this.form.invalid||this.dateError()||this.balanceError())return;this.saving.set(true);const id=this.editingId();const request=id?this.http.put<Mortgage>(`/api/mortgages/${id}`,this.form.getRawValue()):this.http.post<Mortgage>('/api/mortgages',this.form.getRawValue());request.subscribe({next:x=>{this.mortgages.update(items=>(id?items.map(item=>item.id===id?x:item):[...items,x]).sort((a,b)=>a.endDate.localeCompare(b.endDate)));this.cancelEdit();this.saving.set(false)},error:()=>this.saving.set(false)});}
  edit(loan:Mortgage){this.editingId.set(loan.id);this.form.setValue({name:loan.name,lender:loan.lender,propertyAddress:loan.propertyAddress??'',originalPrincipal:loan.originalPrincipal,outstandingBalance:loan.outstandingBalance,interestRate:loan.interestRate,rateType:loan.rateType,monthlyPayment:loan.monthlyPayment,paymentDay:loan.paymentDay,startDate:loan.startDate,endDate:loan.endDate,currencyCode:loan.currencyCode});window.scrollTo({top:0,behavior:'smooth'});}
  cancelEdit(){this.editingId.set(null);this.form.reset({rateType:1,paymentDay:1,currencyCode:'EUR'});}
  remove(loan:Mortgage){if(!confirm(`Delete ${loan.name}?`))return;this.http.delete(`/api/mortgages/${loan.id}`).subscribe(()=>this.mortgages.update(items=>items.filter(x=>x.id!==loan.id)));}
  paidPercent(loan:Mortgage){return Math.max(0,Math.min(100,(1-loan.outstandingBalance/loan.originalPrincipal)*100));}
  rateLabel(type:number){return ['Fixed','Variable','Mixed'][type]??'Unknown';}
}
