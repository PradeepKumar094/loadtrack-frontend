import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, ReceiptService } from '../../../core/services/payment.service';
import { Payment } from '../../../core/models/payment.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.model';
import { sortData, SortState } from '../../../core/utils/sort.util';

interface PaymentTransaction {
  id: number;
  amountPaid: number;
  paidAt: string;
  remarks: string;
  balanceAfter: number;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit {
  payments: Payment[] = [];
  filtered: Payment[] = [];
  loading = true;

  // Column search
  searchColumn = 'all';
  searchTerm = '';
  filterStatus = '';
  sort: SortState = { column: '', direction: '' };

  readonly searchColumns = [
    { value: 'all',                   label: 'All Columns' },
    { value: 'trip.dealer.name',      label: 'Dealer Name' },
    { value: 'trip.tripDate',         label: 'Trip Date' },
    { value: 'trip.id',               label: 'Trip ID' },
    { value: 'originalAmount',        label: 'Original Amount' },
    { value: 'finalAmount',           label: 'Final Amount' },
    { value: 'paidAmount',            label: 'Paid Amount' },
    { value: 'paymentStatus',         label: 'Status' },
    { value: 'dueDate',               label: 'Due Date' },
  ];

  // Pay modal
  showPayModal = false;
  selectedPayment: Payment | null = null;
  paidAmount = 0;
  payRemarks = '';

  // Transaction log modal
  showLogModal = false;
  selectedPaymentForLog: Payment | null = null;
  transactions: PaymentTransaction[] = [];
  logLoading = false;

  successMsg = '';
  errorMsg = '';

  constructor(
    private paymentService: PaymentService,
    private receiptService: ReceiptService,
    private http: HttpClient
  ) {}

  ngOnInit() { this.loadPayments(); }

  loadPayments() {
    this.loading = true;
    this.paymentService.getAll().subscribe({
      next: (res) => { this.payments = res.data; this.applyFilters(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyFilters() {
    let result = [...this.payments];

    // Column-specific search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      if (this.searchColumn === 'all') {
        result = result.filter(p =>
          p.trip.dealer.name.toLowerCase().includes(term) ||
          String(p.trip.id).includes(term) ||
          p.trip.tripDate.includes(term) ||
          String(p.originalAmount).includes(term) ||
          String(p.finalAmount).includes(term) ||
          String(p.paidAmount).includes(term) ||
          p.paymentStatus.toLowerCase().includes(term) ||
          (p.dueDate || '').includes(term)
        );
      } else {
        result = result.filter(p => {
          const val = this.getNestedVal(p, this.searchColumn);
          return String(val ?? '').toLowerCase().includes(term);
        });
      }
    }

    if (this.filterStatus) {
      result = result.filter(p => p.paymentStatus === this.filterStatus);
    }

    this.filtered = sortData(result, this.sort);
  }

  sortBy(column: string) {
    if (this.sort.column === column) {
      this.sort.direction = this.sort.direction === 'asc' ? 'desc' : this.sort.direction === 'desc' ? '' : 'asc';
      if (this.sort.direction === '') this.sort.column = '';
    } else {
      this.sort = { column, direction: 'asc' };
    }
    this.applyFilters();
  }

  getSortIcon(column: string): string {
    if (this.sort.column !== column) return 'fas fa-sort';
    return this.sort.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  clearFilters() {
    this.searchTerm = '';
    this.searchColumn = 'all';
    this.filterStatus = '';
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.filterStatus);
  }

  getSearchPlaceholder(): string {
    const col = this.searchColumns.find(c => c.value === this.searchColumn);
    return col ? `Search by ${col.label}...` : 'Search...';
  }

  private getNestedVal(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }

  openPayModal(payment: Payment) {
    this.selectedPayment = payment;
    this.paidAmount = 0;
    this.payRemarks = '';
    this.showPayModal = true;
    this.errorMsg = '';
  }

  makePayment() {
    if (!this.selectedPayment) return;
    this.paymentService.makePayment(this.selectedPayment.id, {
      paidAmount: this.paidAmount,
      remarks: this.payRemarks
    }).subscribe({
      next: () => {
        this.showPayModal = false;
        this.successMsg = 'Payment recorded successfully';
        setTimeout(() => this.successMsg = '', 3000);
        this.loadPayments();
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Payment failed'; }
    });
  }

  openTransactionLog(payment: Payment) {
    this.selectedPaymentForLog = payment;
    this.showLogModal = true;
    this.logLoading = true;
    this.transactions = [];
    this.http.get<ApiResponse<PaymentTransaction[]>>(
      `${environment.apiUrl}/payments/${payment.id}/transactions`
    ).subscribe({
      next: (res) => { this.transactions = res.data; this.logLoading = false; },
      error: () => { this.logLoading = false; }
    });
  }

  downloadReceipt(paymentId: number) {
    this.receiptService.getByPayment(paymentId).subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          this.receiptService.downloadPdf(res.data[0].id).subscribe(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `receipt_${paymentId}.pdf`; a.click();
            window.URL.revokeObjectURL(url);
          });
        } else {
          this.errorMsg = 'No receipt available yet';
          setTimeout(() => this.errorMsg = '', 3000);
        }
      }
    });
  }

  getRemainingAmount(p: Payment): number {
    return p.finalAmount - p.paidAmount;
  }

  getStatusClass(status: string): string {
    const map: any = { PAID: 'badge-success', PARTIAL: 'badge-warning', UNPAID: 'badge-danger' };
    return map[status] || 'badge-secondary';
  }

  getDueClass(payment: Payment): string {
    if (!payment.dueDate || payment.paymentStatus === 'PAID') return '';
    return new Date(payment.dueDate) < new Date() ? 'overdue' : '';
  }
}
