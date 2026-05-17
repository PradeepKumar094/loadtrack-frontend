import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ApiResponse } from '../../../core/models/auth.model';

interface CreditEntry {
  id: number;
  amount: number;
  creditedAt: string;
  remarks: string;
}

interface SalarySummary {
  driverId: number;
  driverName: string;
  salaryPerTrip: number;
  totalEarned: number;
  totalCredited: number;
  pendingWithOwner: number;
  creditHistory: CreditEntry[];
}

@Component({
  selector: 'app-driver-salary',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './driver-salary.component.html',
  styleUrls: ['./driver-salary.component.css']
})
export class DriverSalaryComponent implements OnInit {
  salary: SalarySummary | null = null;
  loading = true;
  linkedId: number | null = null;

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    this.linkedId = this.authService.getLinkedId();
    if (this.linkedId) {
      this.http.get<ApiResponse<SalarySummary>>(
        `${environment.apiUrl}/driver-salary/${this.linkedId}/summary`
      ).subscribe({
        next: (res) => { this.salary = res.data as any; this.loading = false; },
        error: () => { this.loading = false; }
      });
    } else {
      this.loading = false;
    }
  }

  getPaymentPercent(): number {
    if (!this.salary || !this.salary.totalEarned || this.salary.totalEarned === 0) return 0;
    return Math.round((this.salary.totalCredited / this.salary.totalEarned) * 100);
  }
}
