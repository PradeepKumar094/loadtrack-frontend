import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DashboardService } from '../../../core/services/payment.service';
import { DashboardData, Payment } from '../../../core/models/payment.model';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.model';

interface SandRequest {
  id: number;
  dealer: { id: number; name: string; phone: string };
  sandType: { id: number; name: string; pricePerTon: number };
  tons: number;
  sourceLocation: string;
  destinationLocation: string;
  distanceKm: number;
  requestedDate: string;
  remarks: string;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  data: DashboardData = {};
  pendingVerifications: Payment[] = [];
  pendingSandRequests: SandRequest[] = [];
  loading = true;
  verifyingId: number | null = null;
  rejectingId: number | null = null;
  successMsg = '';
  errorMsg = '';

  // Reject payment modal
  showRejectPayModal = false;
  rejectPaymentId: number | null = null;
  rejectReason = '';

  constructor(
    private dashboardService: DashboardService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.dashboardService.getAdminDashboard().subscribe({
      next: (res) => { this.data = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.loadPendingVerifications();
    this.loadPendingSandRequests();
  }

  loadPendingVerifications() {
    this.http.get<ApiResponse<Payment[]>>(
      `${environment.apiUrl}/payments/pending-verification`
    ).subscribe({
      next: (res) => { this.pendingVerifications = res.data; },
      error: () => {}
    });
  }

  loadPendingSandRequests() {
    this.http.get<ApiResponse<SandRequest[]>>(
      `${environment.apiUrl}/sand-requests/pending`
    ).subscribe({
      next: (res) => { this.pendingSandRequests = res.data; },
      error: () => {}
    });
  }

  // Verify payment
  verifyPayment(payment: Payment) {
    this.verifyingId = payment.id;
    this.http.put<ApiResponse<Payment>>(
      `${environment.apiUrl}/payments/${payment.id}/verify`, {}
    ).subscribe({
      next: () => {
        this.verifyingId = null;
        this.successMsg = `Payment of ₹${payment.pendingVerificationAmount || payment.paidAmount} from ${payment.trip.dealer.name} verified!`;
        setTimeout(() => this.successMsg = '', 4000);
        this.loadAll();
      },
      error: (err) => { this.verifyingId = null; this.errorMsg = err.error?.message || 'Failed'; setTimeout(() => this.errorMsg = '', 3000); }
    });
  }

  // Open reject payment modal
  openRejectPayment(payment: Payment) {
    this.rejectPaymentId = payment.id;
    this.rejectReason = '';
    this.showRejectPayModal = true;
  }

  // Reject payment
  rejectPayment() {
    if (!this.rejectPaymentId) return;
    this.rejectingId = this.rejectPaymentId;
    this.http.put<ApiResponse<Payment>>(
      `${environment.apiUrl}/payments/${this.rejectPaymentId}/reject-payment`,
      { reason: this.rejectReason || 'Payment not received' }
    ).subscribe({
      next: () => {
        this.rejectingId = null;
        this.showRejectPayModal = false;
        this.successMsg = 'Payment rejected. Dealer has been notified.';
        setTimeout(() => this.successMsg = '', 4000);
        this.loadAll();
      },
      error: (err) => { this.rejectingId = null; this.errorMsg = err.error?.message || 'Failed'; setTimeout(() => this.errorMsg = '', 3000); }
    });
  }

  getEstimatedAmount(req: SandRequest): number {
    return req.tons * req.sandType.pricePerTon;
  }
}
