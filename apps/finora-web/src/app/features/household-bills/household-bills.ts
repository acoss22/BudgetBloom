import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ExportData, ExportMenuComponent } from '../../core/export/export-menu';

interface HouseholdBill {
  id: string;
  name: string;
  provider: string;
  billType: number;
  amount: number;
  currencyCode: string;
  billingDay: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

@Component({
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ExportMenuComponent,
  ],
  template: `
    <header>
      <p class="eyebrow">HOME EXPENSES</p>
      <div class="header-row">
        <div>
          <h1>Household bills</h1>
          <p>Plan your essential monthly costs and see them reflected in your financial overview.</p>
        </div>
        <app-export-menu [data]="exportData()" />
      </div>
    </header>

    <section class="summary" aria-label="Household bills summary">
      <mat-card>
        <mat-icon>receipt_long</mat-icon>
        <span>Active bills</span>
        <strong>{{ activeCount() }}</strong>
      </mat-card>
      <mat-card>
        <mat-icon>payments</mat-icon>
        <span>Expected monthly total</span>
        <strong>{{ monthlyTotal() | currency: 'EUR' }}</strong>
      </mat-card>
    </section>

    <div class="layout">
      <mat-card class="form-card">
        <h2>{{ editingId() ? 'Edit household bill' : 'Add a household bill' }}</h2>
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="fields">
            <mat-form-field>
              <mat-label>Bill type</mat-label>
              <mat-select formControlName="billType">
                @for (type of billTypes; track type.value) {
                  <mat-option [value]="type.value">{{ type.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Bill name</mat-label>
              <input matInput formControlName="name" placeholder="Home electricity" />
            </mat-form-field>
            <mat-form-field class="wide">
              <mat-label>Provider</mat-label>
              <input matInput formControlName="provider" placeholder="Provider name" />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Expected monthly amount</mat-label>
              <input matInput type="number" min="0.01" step="0.01" formControlName="amount" />
              <span matTextSuffix>EUR</span>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Billing day</mat-label>
              <input matInput type="number" min="1" max="31" formControlName="billingDay" />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Start date</mat-label>
              <input matInput type="date" formControlName="startDate" />
            </mat-form-field>
            <mat-form-field>
              <mat-label>End date (optional)</mat-label>
              <input matInput type="date" formControlName="endDate" />
            </mat-form-field>
          </div>
          <mat-checkbox formControlName="isActive">Include this bill in monthly expenses</mat-checkbox>
          @if (dateError()) {
            <p class="error">The end date cannot be before the start date.</p>
          }
          <div class="form-actions">
            <button mat-flat-button type="submit" [disabled]="form.invalid || saving() || dateError()">
              {{ saving() ? 'Saving…' : editingId() ? 'Save changes' : 'Add bill' }}
            </button>
            @if (editingId()) {
              <button mat-button type="button" (click)="cancelEdit()">Cancel</button>
            }
          </div>
        </form>
      </mat-card>

      <section class="bills" aria-live="polite">
        @if (loading()) {
          <mat-card class="empty">Loading household bills…</mat-card>
        } @else if (!bills().length) {
          <mat-card class="empty">
            <mat-icon>home_work</mat-icon>
            <h2>No household bills yet</h2>
            <p>Add water, electricity, gas, internet, or a mobile plan.</p>
          </mat-card>
        }
        @for (bill of bills(); track bill.id) {
          <mat-card class="bill" [class.inactive]="!bill.isActive">
            <div class="bill-head">
              <span class="type-icon"><mat-icon>{{ typeIcon(bill.billType) }}</mat-icon></span>
              <div class="bill-title">
                <div><h2>{{ bill.name }}</h2><p>{{ typeLabel(bill.billType) }} · {{ bill.provider }}</p></div>
                <div class="actions">
                  <button mat-icon-button (click)="edit(bill)" [attr.aria-label]="'Edit ' + bill.name"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button (click)="remove(bill)" [attr.aria-label]="'Delete ' + bill.name"><mat-icon>delete_outline</mat-icon></button>
                </div>
              </div>
            </div>
            <div class="amount"><strong>{{ bill.amount | currency: bill.currencyCode }}</strong><span>per month</span></div>
            <dl>
              <div><dt>Billing date</dt><dd>Day {{ bill.billingDay }}</dd></div>
              <div><dt>Status</dt><dd>{{ bill.isActive ? 'Active' : 'Paused' }}</dd></div>
              <div><dt>Started</dt><dd>{{ bill.startDate | date: 'mediumDate' }}</dd></div>
              <div><dt>Ends</dt><dd>{{ bill.endDate ? (bill.endDate | date: 'mediumDate') : 'Ongoing' }}</dd></div>
            </dl>
          </mat-card>
        }
      </section>
    </div>
  `,
  styles: [`
    header h1{font-size:clamp(1.8rem,4vw,2.6rem);margin:.15rem 0}.eyebrow{letter-spacing:.15em;color:#397454;font-weight:700}.header-row{display:flex;justify-content:space-between;align-items:center;gap:1.5rem}.header-row p{margin-bottom:0}.header-row button{flex:0 0 auto}.summary{display:grid;grid-template-columns:repeat(2,minmax(220px,320px));gap:1rem;margin:2rem 0}.summary mat-card{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:.2rem 1rem;padding:1rem 1.2rem}.summary mat-icon{grid-row:1/3;color:#397454}.summary span{color:#68766f}.summary strong{font-size:1.4rem}.layout{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(330px,.95fr);gap:1.25rem;align-items:start}mat-card{padding:1.3rem}.form-card h2{margin-bottom:1.3rem}.fields{display:grid;grid-template-columns:1fr 1fr;gap:0 1rem}.wide{grid-column:1/-1}.form-actions{display:flex;gap:.5rem;align-items:center;margin-top:1rem}.form-actions button:first-child{flex:1}.bills{display:grid;gap:1rem}.empty{min-height:220px;display:grid;place-content:center;text-align:center;color:#66756d}.empty mat-icon{margin:auto;font-size:42px;width:42px;height:42px;color:#397454}.bill.inactive{opacity:.72}.bill-head{display:flex;gap:1rem}.type-icon{display:grid;place-items:center;flex:0 0 42px;height:42px;border-radius:12px;background:#e1f0e4;color:#285844}.bill-title{display:flex;justify-content:space-between;gap:1rem;min-width:0;flex:1}.bill h2{font-size:1.15rem;margin:0}.bill p,.amount span,dt{color:#68766f}.bill p{margin:.2rem 0}.actions{display:flex}.amount{display:flex;align-items:baseline;gap:.45rem;margin:1.2rem 0}.amount strong{font-size:1.75rem}.amount span{font-size:.85rem}dl{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:0}dt{font-size:.75rem}dd{margin:.2rem 0 0;font-weight:600}.error{color:#b3261e;font-size:.85rem}@media(max-width:1000px){.layout{grid-template-columns:1fr}}@media(max-width:600px){.header-row{align-items:stretch;flex-direction:column}.header-row button{align-self:flex-start}.summary,.fields,dl{grid-template-columns:1fr}.summary{margin:1.4rem 0}.wide{grid-column:auto}.bill-title{align-items:flex-start}.actions{margin-right:-.5rem}}
  `],
})
export class HouseholdBillsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly bills = signal<HouseholdBill[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly billTypes = [
    { value: 0, label: 'Water', icon: 'water_drop' },
    { value: 1, label: 'Electricity', icon: 'bolt' },
    { value: 2, label: 'Gas', icon: 'local_fire_department' },
    { value: 3, label: 'Internet', icon: 'wifi' },
    { value: 4, label: 'Mobile plan', icon: 'smartphone' },
  ];
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    provider: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    billType: new FormControl(0, { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(.01)]),
    currencyCode: new FormControl('EUR', { nonNullable: true }),
    billingDay: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(31)] }),
    startDate: new FormControl(new Date().toISOString().slice(0, 10), { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl('', { nonNullable: true }),
    isActive: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit() { this.load(); }
  load() { this.http.get<HouseholdBill[]>('/api/household-bills').subscribe({ next: value => { this.bills.set(value); this.loading.set(false); }, error: () => this.loading.set(false) }); }
  activeCount() { return this.bills().filter(bill => bill.isActive).length; }
  monthlyTotal() { return this.bills().filter(bill => bill.isActive).reduce((total, bill) => total + bill.amount, 0); }
  dateError() { const { startDate, endDate } = this.form.getRawValue(); return !!endDate && endDate < startDate; }
  typeLabel(type: number) { return this.billTypes.find(item => item.value === type)?.label ?? 'Other'; }
  typeIcon(type: number) { return this.billTypes.find(item => item.value === type)?.icon ?? 'receipt_long'; }
  exportData(): ExportData {
    const bills = this.bills();
    const total = bills.filter(bill => bill.isActive).reduce((sum, bill) => sum + bill.amount, 0);
    return { title:'Finora Household Bills', fileName:'finora-household-bills', columns:['Name','Type','Provider','Monthly amount','Currency','Billing day','Status','Start date','End date'], rows:bills.map(bill=>[bill.name,this.typeLabel(bill.billType),bill.provider,bill.amount.toFixed(2),bill.currencyCode,bill.billingDay,bill.isActive?'Active':'Paused',bill.startDate,bill.endDate??'Ongoing']), summary:[`Bills: ${bills.length}`,`Active monthly total: ${total.toFixed(2)} EUR`] };
  }
  save() {
    if (this.form.invalid || this.dateError()) return;
    this.saving.set(true);
    const id = this.editingId();
    const value = this.form.getRawValue();
    const payload = { ...value, endDate: value.endDate || null };
    const request = id ? this.http.put<HouseholdBill>(`/api/household-bills/${id}`, payload) : this.http.post<HouseholdBill>('/api/household-bills', payload);
    request.subscribe({ next: bill => { this.bills.update(items => (id ? items.map(item => item.id === id ? bill : item) : [...items, bill]).sort((a, b) => a.billingDay - b.billingDay || a.name.localeCompare(b.name))); this.cancelEdit(); this.saving.set(false); }, error: () => this.saving.set(false) });
  }
  edit(bill: HouseholdBill) {
    this.editingId.set(bill.id);
    this.form.setValue({ name: bill.name, provider: bill.provider, billType: bill.billType, amount: bill.amount, currencyCode: bill.currencyCode, billingDay: bill.billingDay, startDate: bill.startDate, endDate: bill.endDate ?? '', isActive: bill.isActive });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  cancelEdit() { this.editingId.set(null); this.form.reset({ billType: 0, currencyCode: 'EUR', billingDay: 1, startDate: new Date().toISOString().slice(0, 10), endDate: '', isActive: true }); }
  remove(bill: HouseholdBill) { if (!confirm(`Delete ${bill.name}?`)) return; this.http.delete(`/api/household-bills/${bill.id}`).subscribe(() => this.bills.update(items => items.filter(item => item.id !== bill.id))); }
}
