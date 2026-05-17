import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ApiResponse } from '../../../core/models/auth.model';

interface SandType { id: number; name: string; pricePerTon: number; }

interface SandRequest {
  id: number;
  sandType: { id: number; name: string; pricePerTon: number };
  tons: number;
  sourceLocation: string;
  destinationLocation: string;
  distanceKm: number;
  requestedDate: string;
  remarks: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'DELIVERED';
  adminRemarks: string;
  trip?: { id: number };
  createdAt: string;
}

@Component({
  selector: 'app-dealer-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dealer-requests.component.html',
  styleUrls: ['./dealer-requests.component.css']
})
export class DealerRequestsComponent implements OnInit {
  requests: SandRequest[] = [];
  sandTypes: SandType[] = [];
  loading = true;
  showModal = false;
  successMsg = '';
  errorMsg = '';
  submitting = false;
  linkedId: number | null = null;

  form = {
    sandTypeId: 0,
    tons: 0,
    sourceLocation: '',
    destinationLocation: '',
    distanceKm: 0,
    requestedDate: '',
    remarks: ''
  };

  estimatedAmount = 0;

  @ViewChild('reqForm') reqForm!: NgForm;

  private url = `${environment.apiUrl}/sand-requests`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    this.linkedId = this.authService.getLinkedId();
    this.loadRequests();
    this.http.get<ApiResponse<SandType[]>>(`${environment.apiUrl}/sand-types`).subscribe({
      next: (res) => { this.sandTypes = res.data; }
    });
  }

  loadRequests() {
    this.loading = true;
    if (!this.linkedId) { this.loading = false; return; }
    this.http.get<ApiResponse<SandRequest[]>>(`${this.url}/dealer/${this.linkedId}`).subscribe({
      next: (res) => { this.requests = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openNew() {
    this.form = { sandTypeId: 0, tons: 0, sourceLocation: '', destinationLocation: '', distanceKm: 0, requestedDate: '', remarks: '' };
    this.estimatedAmount = 0;
    this.showModal = true;
    this.errorMsg = '';
    setTimeout(() => { if (this.reqForm) this.reqForm.resetForm(this.form); }, 0);
  }

  onSandTypeChange() { this.calcEstimate(); }
  onTonsChange()     { this.calcEstimate(); }

  calcEstimate() {
    const st = this.sandTypes.find(s => s.id === Number(this.form.sandTypeId));
    this.estimatedAmount = st && this.form.tons > 0 ? st.pricePerTon * this.form.tons : 0;
  }

  submit() {
    if (this.reqForm) this.reqForm.form.markAllAsTouched();
    if (this.reqForm && this.reqForm.invalid) return;

    this.submitting = true;
    this.http.post<ApiResponse<SandRequest>>(`${this.url}/dealer/${this.linkedId}`, this.form).subscribe({
      next: () => {
        this.submitting = false;
        this.showModal = false;
        this.successMsg = 'Sand request submitted! Admin will review and assign a trip.';
        setTimeout(() => this.successMsg = '', 5000);
        this.loadRequests();
      },
      error: (err) => {
        this.submitting = false;
        this.errorMsg = err.error?.message || 'Failed to submit request';
      }
    });
  }

  getStatusClass(status: string): string {
    const map: any = {
      PENDING:   'badge-warning',
      ACCEPTED:  'badge-info',
      REJECTED:  'badge-danger',
      DELIVERED: 'badge-success'
    };
    return map[status] || 'badge-secondary';
  }

  getStatusIcon(status: string): string {
    const map: any = {
      PENDING:   'fas fa-clock',
      ACCEPTED:  'fas fa-check-circle',
      REJECTED:  'fas fa-times-circle',
      DELIVERED: 'fas fa-truck-moving'
    };
    return map[status] || 'fas fa-circle';
  }
}
