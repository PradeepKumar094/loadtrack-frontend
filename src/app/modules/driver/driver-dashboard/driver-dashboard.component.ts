import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DashboardService } from '../../../core/services/payment.service';
import { TripService } from '../../../core/services/trip.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardData } from '../../../core/models/payment.model';
import { Trip } from '../../../core/models/trip.model';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.model';

interface SalaryCredit {
  id: number;
  amount: number;
  creditedAt: string;
  remarks: string;
}

interface SalarySummary {
  driverName: string;
  salaryPerTrip: number;
  totalEarned: number;
  totalCredited: number;
  pendingWithOwner: number;
  creditHistory: SalaryCredit[];
}

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './driver-dashboard.component.html',
  styleUrls: ['./driver-dashboard.component.css']
})
export class DriverDashboardComponent implements OnInit {
  data: DashboardData = {};
  recentTrips: Trip[] = [];
  pendingTrips: Trip[] = [];
  salary: SalarySummary | null = null;
  newCredits: SalaryCredit[] = [];   // credits received since last visit
  loading = true;
  username = '';
  linkedId: number | null = null;
  acknowledging: number | null = null;
  successMsg = '';
  errorMsg = '';

  constructor(
    private dashboardService: DashboardService,
    private tripService: TripService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername() || '';
    this.linkedId = this.authService.getLinkedId();

    if (this.linkedId) {
      this.loadAll();
    } else {
      this.loading = false;
    }
  }

  loadAll() {
    // Dashboard stats
    this.dashboardService.getDriverDashboard(this.linkedId!).subscribe({
      next: (res) => { this.data = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });

    // Trips
    this.tripService.getByDriver(this.linkedId!).subscribe({
      next: (res) => {
        this.recentTrips = res.data.slice(-5).reverse();
        this.pendingTrips = res.data.filter(t =>
          t.status === 'PENDING' && !t.driverAcknowledged
        );
      }
    });

    // Salary summary + credit notifications
    this.http.get<ApiResponse<SalarySummary>>(
      `${environment.apiUrl}/driver-salary/${this.linkedId}/summary`
    ).subscribe({
      next: (res) => {
        this.salary = res.data as any;

        // Show only credits AFTER last seen timestamp
        const lastSeen = localStorage.getItem(`salary_seen_${this.linkedId}`);
        const lastSeenDate = lastSeen ? new Date(lastSeen) : new Date(0);

        this.newCredits = (this.salary?.creditHistory || []).filter(c =>
          new Date(c.creditedAt) > lastSeenDate
        );
      }
    });
  }

  // Driver dismisses salary notification — mark as seen
  dismissSalaryNotification() {
    localStorage.setItem(`salary_seen_${this.linkedId}`, new Date().toISOString());
    this.newCredits = [];
  }

  // Acknowledge directly from dashboard — no redirect
  acknowledge(trip: Trip) {
    if (!this.linkedId) return;
    this.acknowledging = trip.id;
    this.tripService.acknowledge(trip.id, this.linkedId).subscribe({
      next: () => {
        this.acknowledging = null;
        this.successMsg = `Trip #${trip.id} acknowledged! Admin has been notified.`;
        setTimeout(() => this.successMsg = '', 4000);
        this.loadAll();  // refresh dashboard
      },
      error: (err) => {
        this.acknowledging = null;
        this.errorMsg = err.error?.message || 'Failed to acknowledge';
        setTimeout(() => this.errorMsg = '', 3000);
      }
    });
  }

  getStatusClass(status: string): string {
    const map: any = {
      PENDING: 'badge-warning', ACKNOWLEDGED: 'badge-info',
      IN_PROGRESS: 'badge-primary', COMPLETED: 'badge-success', CANCELLED: 'badge-danger'
    };
    return map[status] || 'badge-secondary';
  }

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }
}
