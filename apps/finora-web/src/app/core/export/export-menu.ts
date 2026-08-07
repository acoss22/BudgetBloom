import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

export interface ExportData {
  title: string;
  fileName: string;
  columns: string[];
  rows: (string | number | boolean | null | undefined)[][];
  summary?: string[];
}

@Component({
  selector: 'app-export-menu',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <button mat-stroked-button type="button" [matMenuTriggerFor]="exportMenu" [disabled]="!data().rows.length">
      <mat-icon>download</mat-icon><span>Export</span><mat-icon iconPositionEnd>arrow_drop_down</mat-icon>
    </button>
    <mat-menu #exportMenu="matMenu">
      <button mat-menu-item type="button" (click)="downloadTxt()"><mat-icon>description</mat-icon><span>Text file (.txt)</span></button>
      <button mat-menu-item type="button" (click)="downloadDoc()"><mat-icon>article</mat-icon><span>Word document (.doc)</span></button>
      <button mat-menu-item type="button" (click)="downloadXls()"><mat-icon>table_view</mat-icon><span>Excel sheet (.xls)</span></button>
    </mat-menu>
  `,
})
export class ExportMenuComponent {
  readonly data = input.required<ExportData>();

  downloadTxt() {
    const data = this.data();
    const content = [data.title.toUpperCase(), `Exported: ${new Date().toLocaleString()}`, ...(data.summary ?? []), '', data.columns.join('\t'), ...data.rows.map(row => row.map(value => this.text(value)).join('\t'))].join('\n');
    this.download(content, 'txt', 'text/plain;charset=utf-8');
  }

  downloadDoc() {
    const data = this.data();
    const summary = (data.summary ?? []).map(line => `<p>${this.html(line)}</p>`).join('');
    const table = this.table();
    const content = `<!doctype html><html><head><meta charset="utf-8"><title>${this.html(data.title)}</title><style>body{font-family:Arial,sans-serif;color:#183329}h1{color:#143a2a}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #cad8cf;padding:8px;text-align:left}th{background:#e3f1e6}</style></head><body><h1>${this.html(data.title)}</h1><p>Exported: ${this.html(new Date().toLocaleString())}</p>${summary}${table}</body></html>`;
    this.download(content, 'doc', 'application/msword;charset=utf-8');
  }

  downloadXls() {
    const data = this.data();
    const content = `<!doctype html><html><head><meta charset="utf-8"></head><body><h1>${this.html(data.title)}</h1>${this.table()}</body></html>`;
    this.download(content, 'xls', 'application/vnd.ms-excel;charset=utf-8');
  }

  private table() {
    const data = this.data();
    const headings = data.columns.map(column => `<th>${this.html(column)}</th>`).join('');
    const rows = data.rows.map(row => `<tr>${row.map(value => `<td>${this.html(this.text(value))}</td>`).join('')}</tr>`).join('');
    return `<table><thead><tr>${headings}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  private download(content: string, extension: string, type: string) {
    const url = URL.createObjectURL(new Blob(['\ufeff', content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.data().fileName}-${new Date().toISOString().slice(0, 10)}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private text(value: string | number | boolean | null | undefined) { return value === null || value === undefined ? '' : String(value).replace(/[\t\r\n]+/g, ' '); }
  private html(value: string) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
}
