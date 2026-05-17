import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../core/services/payment.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardData, Payment } from '../../../core/models/payment.model';

@Component({
  selector: 'app-dealer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dealer-dashboard.component.html',
  styleUrls: ['./dealer-dashboard.component.css']
})
export class DealerDashboardComponent implements OnInit {
  data: DashboardData = {};
  recentPayments: Payment[] = [];
  loading = true;
  username = '';

  constructor(
    private dashboardService: DashboardService,
    private paymentService: PaymentService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.username = this.authService.getUsername() || '';
    const linkedId = this.authService.getLinkedId();
    if (linkedId) {
      this.dashboardService.getDealerDashboard(linkedId).subscribe({
        next: (res) => { this.data = res.data; this.loading = false; },
        error: () => { this.loading = false; }
      });
      this.paymentService.getByDealer(linkedId).subscribe({
        next: (res) => {
          this.recentPayments = res.data.slice(-5).reverse();
        }
      });
    } else {
      this.loading = false;
    }
  }

  getStatusClass(status: string): string {
    const map: any = { PAID: 'badge-success', PARTIAL: 'badge-warning', UNPAID: 'badge-danger' };
    return map[status] || 'badge-secondary';
  }

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  getRemainingAmount(p: Payment): number {
    return p.finalAmount - p.paidAmount;
  }
}
