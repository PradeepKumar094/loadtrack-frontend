import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.model';

interface DriverSummary {
  driverId: number;
  driverName: string;
  salaryPerTrip: number;
  totalEarned: number;
  totalCredited: number;
  pendingWithOwner: number;
  creditHistory: CreditEntry[];
}

interface CreditEntry {
  id: number;
  amount: number;
  creditedAt: string;
  remarks: string;
}

interface Driver {
  id: number;
  name: string;
  phone: string;
  salaryPerTrip: number;
}

@Component({
  selector: 'app-driver-salary',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './driver-salary.component.html',
  styleUrls: ['./driver-salary.component.css']
})
export class DriverSalaryComponent implements OnInit {
  drivers: Driver[] = [];
  summaries: DriverSummary[] = [];
  loading = true;
  expandedDriver: number | null = null;

  // Pay modal
  showPayModal = false;
  selectedDriver: DriverSummary | null = null;
  payAmount = 0;
  payRemarks = '';
  payTripId: number | null = null;
  paying = false;

  successMsg = '';
  errorMsg = '';

  private baseUrl = `${environment.apiUrl}/driver-salary`;
  private driversUrl = `${environment.apiUrl}/drivers`;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading = true;
    this.http.get<ApiResponse<Driver[]>>(this.driversUrl).subscribe({
      next: (res) => {
        this.drivers = res.data;
        this.loadSummaries();
      },
      error: () => { this.loading = false; }
    });
  }

  loadSummaries() {
    const requests = this.drivers.map(d =>
      this.http.get<ApiResponse<any>>(`${this.baseUrl}/${d.id}/summary`).toPromise()
    );
    Promise.all(requests).then(results => {
      this.summaries = results
        .filter(r => r?.success)
        .map((r, index) => {
          const data = r!.data;
          // Ensure driverId is always set — use from response or fallback to drivers list
          return {
            ...data,
            driverId: data.driverId ?? this.drivers[index].id
          } as DriverSummary;
        });
      this.loading = false;
    }).catch(() => { this.loading = false; });
  }

  toggle(driverId: number) {
    this.expandedDriver = this.expandedDriver === driverId ? null : driverId;
  }

  openPay(summary: DriverSummary) {
    this.selectedDriver = summary;
    this.payAmount = summary.pendingWithOwner > 0 ? summary.pendingWithOwner : 0;
    this.payRemarks = '';
    this.payTripId = null;
    this.showPayModal = true;
    this.errorMsg = '';
  }

  pay() {
    if (!this.selectedDriver || this.payAmount <= 0) return;
    if (!this.selectedDriver.driverId) {
      this.errorMsg = 'Driver ID not found. Please refresh and try again.';
      return;
    }
    this.paying = true;
    this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/${this.selectedDriver.driverId}/credit`,
      {
        amount: this.payAmount,
        remarks: this.payRemarks || `Salary payment to ${this.selectedDriver.driverName}`,
        ...(this.payTripId ? { tripId: this.payTripId } : {})
      }
    ).subscribe({
      next: () => {
        this.paying = false;
        this.showPayModal = false;
        this.successMsg = `₹${this.payAmount} credited to ${this.selectedDriver!.driverName}`;
        setTimeout(() => this.successMsg = '', 4000);
        this.loadAll();
      },
      error: (err) => {
        this.paying = false;
        this.errorMsg = err.error?.message || 'Payment failed';
      }
    });
  }

  getTotalPending(): number {
    return this.summaries.reduce((s, d) => s + (d.pendingWithOwner || 0), 0);
  }

  getTotalCredited(): number {
    return this.summaries.reduce((s, d) => s + (d.totalCredited || 0), 0);
  }
}
