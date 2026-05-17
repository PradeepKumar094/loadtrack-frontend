import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.model';

interface DealerRisk {
  dealerId: number;
  dealerName: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number;
  riskReason: string;
  totalPending: number;
  overdueCount: number;
  totalPayments: number;
  latePayments: number;
}

@Component({
  selector: 'app-payment-risk',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-risk.component.html',
  styleUrls: ['./payment-risk.component.css']
})
export class PaymentRiskComponent implements OnInit {
  risks: DealerRisk[] = [];
  loading = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<ApiResponse<DealerRisk[]>>(`${environment.apiUrl}/ai/payment-risk`).subscribe({
      next: (res) => { this.risks = res.data.sort((a, b) => b.riskScore - a.riskScore); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getRiskClass(level: string): string {
    const map: any = { HIGH: 'risk-high', MEDIUM: 'risk-medium', LOW: 'risk-low' };
    return map[level] || 'risk-low';
  }

  getRiskIcon(level: string): string {
    const map: any = { HIGH: 'fas fa-exclamation-triangle', MEDIUM: 'fas fa-exclamation-circle', LOW: 'fas fa-check-circle' };
    return map[level] || 'fas fa-circle';
  }

  getHighCount(): number { return this.risks.filter(r => r.riskLevel === 'HIGH').length; }
  getMediumCount(): number { return this.risks.filter(r => r.riskLevel === 'MEDIUM').length; }
  getLowCount(): number { return this.risks.filter(r => r.riskLevel === 'LOW').length; }
}
