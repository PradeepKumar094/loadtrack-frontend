import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.model';

interface DriverReport {
  driverId: number;
  driverName: string;
  phone: string;
  licenseNumber: string;
  salaryPerTrip: number;
  assignedTruck: string;
  totalTrips: number;
  completedTrips: number;
  pendingTrips: number;
  cancelledTrips: number;
  totalTonsCarried: number;
  totalSalaryEarned: number;
  salaryCredited: number;
  salaryPending: number;
  trips: DriverTripSummary[];
}

interface DriverTripSummary {
  tripId: number;
  tripDate: string;
  truckNumber: string;
  dealerName: string;
  sandType: string;
  tons: number;
  source: string;
  destination: string;
  totalAmount: number;
  status: string;
  salaryForTrip: number;
}

interface DealerReport {
  dealerId: number;
  dealerName: string;
  phone: string;
  address: string;
  totalTrips: number;
  completedTrips: number;
  pendingTrips: number;
  totalTonsReceived: number;
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
  totalInterest: number;
  trips: DealerTripSummary[];
}

interface DealerTripSummary {
  tripId: number;
  tripDate: string;
  truckNumber: string;
  driverName: string;
  sandType: string;
  tons: number;
  tripAmount: number;
  paidAmount: number;
  pendingAmount: number;
  interestAmount: number;
  paymentStatus: string;
  dueDate: string;
  tripStatus: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  activeTab: 'trips' | 'drivers' | 'dealers' = 'trips';

  // Trips tab
  fromDate = '';
  toDate = '';

  // Driver tab
  driverReports: DriverReport[] = [];
  expandedDriver: number | null = null;
  driverLoading = false;

  // Dealer tab
  dealerReports: DealerReport[] = [];
  expandedDealer: number | null = null;
  dealerLoading = false;

  loading = false;
  successMsg = '';
  errorMsg = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {}

  setTab(tab: 'trips' | 'drivers' | 'dealers') {
    this.activeTab = tab;
    if (tab === 'drivers' && this.driverReports.length === 0) this.loadDriverReports();
    if (tab === 'dealers' && this.dealerReports.length === 0) this.loadDealerReports();
  }

  // ── Trips ─────────────────────────────────────────────────────

  exportTrips() {
    this.loading = true;
    let url = `${environment.apiUrl}/reports/trips/excel`;
    if (this.fromDate && this.toDate) url += `?from=${this.fromDate}&to=${this.toDate}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => { this.download(blob, 'trips_report.xlsx'); this.loading = false; this.showSuccess('Trips report downloaded'); },
      error: () => { this.loading = false; this.showError('Export failed'); }
    });
  }

  exportPendingPayments() {
    this.loading = true;
    this.http.get(`${environment.apiUrl}/reports/payments/pending/excel`, { responseType: 'blob' }).subscribe({
      next: (blob) => { this.download(blob, 'pending_payments.xlsx'); this.loading = false; this.showSuccess('Pending payments report downloaded'); },
      error: () => { this.loading = false; this.showError('Export failed'); }
    });
  }

  // ── Drivers ───────────────────────────────────────────────────

  loadDriverReports() {
    this.driverLoading = true;
    this.http.get<ApiResponse<DriverReport[]>>(`${environment.apiUrl}/reports/drivers`).subscribe({
      next: (res) => { this.driverReports = res.data; this.driverLoading = false; },
      error: () => { this.driverLoading = false; }
    });
  }

  toggleDriver(id: number) {
    this.expandedDriver = this.expandedDriver === id ? null : id;
  }

  exportAllDrivers() {
    this.http.get(`${environment.apiUrl}/reports/drivers/excel`, { responseType: 'blob' }).subscribe({
      next: (blob) => { this.download(blob, 'all_drivers_report.xlsx'); this.showSuccess('All drivers report downloaded'); }
    });
  }

  exportDriver(driverId: number, name: string) {
    this.http.get(`${environment.apiUrl}/reports/drivers/${driverId}/excel`, { responseType: 'blob' }).subscribe({
      next: (blob) => { this.download(blob, `driver_${name}_report.xlsx`); }
    });
  }

  // ── Dealers ───────────────────────────────────────────────────

  loadDealerReports() {
    this.dealerLoading = true;
    this.http.get<ApiResponse<DealerReport[]>>(`${environment.apiUrl}/reports/dealers`).subscribe({
      next: (res) => { this.dealerReports = res.data; this.dealerLoading = false; },
      error: () => { this.dealerLoading = false; }
    });
  }

  toggleDealer(id: number) {
    this.expandedDealer = this.expandedDealer === id ? null : id;
  }

  exportAllDealers() {
    this.http.get(`${environment.apiUrl}/reports/dealers/excel`, { responseType: 'blob' }).subscribe({
      next: (blob) => { this.download(blob, 'all_dealers_report.xlsx'); this.showSuccess('All dealers report downloaded'); }
    });
  }

  exportDealer(dealerId: number, name: string) {
    this.http.get(`${environment.apiUrl}/reports/dealers/${dealerId}/excel`, { responseType: 'blob' }).subscribe({
      next: (blob) => { this.download(blob, `dealer_${name}_report.xlsx`); }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────

  getPayStatusClass(status: string): string {
    const map: any = { PAID: 'badge-success', PARTIAL: 'badge-warning', UNPAID: 'badge-danger' };
    return map[status] || 'badge-secondary';
  }

  getTripStatusClass(status: string): string {
    const map: any = { COMPLETED: 'badge-success', PENDING: 'badge-warning', CANCELLED: 'badge-danger' };
    return map[status] || 'badge-secondary';
  }

  private download(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    window.URL.revokeObjectURL(url);
  }

  private showSuccess(msg: string) { this.successMsg = msg; setTimeout(() => this.successMsg = '', 3000); }
  private showError(msg: string)   { this.errorMsg = msg;   setTimeout(() => this.errorMsg = '', 3000); }

  isOverdue(dueDate: string): boolean {
    if (!dueDate || dueDate === '—') return false;
    return new Date(dueDate) < new Date();
  }
}
