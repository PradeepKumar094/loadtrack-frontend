import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PaymentService, ReceiptService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Payment } from '../../../core/models/payment.model';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.model';

interface PaymentTransaction {
  id: number; amountPaid: number; paidAt: string; remarks: string; balanceAfter: number;
}

@Component({
  selector: 'app-dealer-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './dealer-payments.component.html',
  styleUrls: ['./dealer-payments.component.css']
})
export class DealerPaymentsComponent implements OnInit {
  payments: Payment[] = [];
  filtered: Payment[] = [];
  loading = true;
  errorMsg = '';
  successMsg = '';
  filterStatus = '';
  searchTerm = '';

  // Pay modal
  showPayModal = false;
  selectedPayment: Payment | null = null;
  payAmount = 0;
  payRemarks = '';
  paying = false;

  // Transaction log modal
  showLogModal = false;
  selectedLogPayment: Payment | null = null;
  transactions: PaymentTransaction[] = [];
  logLoading = false;

  constructor(
    private paymentService: PaymentService,
    private receiptService: ReceiptService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const linkedId = this.authService.getLinkedId();
    if (linkedId) {
      this.paymentService.getByDealer(linkedId).subscribe({
        next: (res) => { this.payments = res.data; this.applyFilters(); this.loading = false; },
        error: () => { this.loading = false; }
      });
    } else { this.loading = false; }
  }

  applyFilters() {
    let result = [...this.payments];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.trip.tripDate.includes(term) ||
        String(p.finalAmount).includes(term) ||
        p.paymentStatus.toLowerCase().includes(term)
      );
    }
    if (this.filterStatus) result = result.filter(p => p.paymentStatus === this.filterStatus);
    this.filtered = result;
  }

  // ── Pay Modal ─────────────────────────────────────────────────
  openPayModal(payment: Payment) {
    this.selectedPayment = payment;
    this.payAmount = 0;
    this.payRemarks = '';
    this.showPayModal = true;
    this.errorMsg = '';
  }

  makePayment() {
    if (!this.selectedPayment || this.payAmount <= 0) return;
    this.paying = true;
    this.paymentService.makePayment(this.selectedPayment.id, {
      paidAmount: this.payAmount,
      remarks: this.payRemarks || 'Payment by dealer'
    }).subscribe({
      next: () => {
        this.paying = false;
        this.showPayModal = false;
        this.successMsg = `₹${this.payAmount} payment submitted. Waiting for admin to verify receipt.`;
        setTimeout(() => this.successMsg = '', 5000);
        // Reload payments
        const linkedId = this.authService.getLinkedId();
        if (linkedId) {
          this.paymentService.getByDealer(linkedId).subscribe(res => {
            this.payments = res.data; this.applyFilters();
          });
        }
      },
      error: (err) => {
        this.paying = false;
        this.errorMsg = err.error?.message || 'Payment failed';
      }
    });
  }

  // ── Transaction Log ───────────────────────────────────────────
  openTransactionLog(payment: Payment) {
    this.selectedLogPayment = payment;
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
          this.errorMsg = 'Receipt not available yet';
          setTimeout(() => this.errorMsg = '', 3000);
        }
      }
    });
  }

  getRemainingAmount(p: Payment): number { return p.finalAmount - p.paidAmount; }
  isOverdue(p: Payment): boolean {
    return !!p.dueDate && p.paymentStatus !== 'PAID' && new Date(p.dueDate) < new Date();
  }
  getStatusClass(status: string): string {
    const map: any = { PAID: 'badge-success', PARTIAL: 'badge-warning', UNPAID: 'badge-danger' };
    return map[status] || 'badge-secondary';
  }
  getTotalBilled(): number   { return this.payments.reduce((s, p) => s + p.finalAmount, 0); }
  getTotalPaid(): number     { return this.payments.reduce((s, p) => s + p.paidAmount, 0); }
  getTotalPending(): number  { return this.payments.reduce((s, p) => s + this.getRemainingAmount(p), 0); }
  get hasOverdue(): boolean  { return this.payments.some(p => this.isOverdue(p)); }
}
