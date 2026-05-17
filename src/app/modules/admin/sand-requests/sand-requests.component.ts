import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.model';
import { Truck } from '../../../core/models/truck.model';
import { Driver } from '../../../core/models/driver.model';
import { TruckService } from '../../../core/services/truck.service';
import { DriverService } from '../../../core/services/driver.service';

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
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'DELIVERED';
  adminRemarks: string;
  trip?: { id: number };
  createdAt: string;
}

@Component({
  selector: 'app-sand-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sand-requests.component.html',
  styleUrls: ['./sand-requests.component.css']
})
export class SandRequestsComponent implements OnInit {
  requests: SandRequest[] = [];
  filtered: SandRequest[] = [];
  trucks: Truck[] = [];
  drivers: Driver[] = [];
  suitableTrucks: Truck[] = [];
  loading = true;
  filterStatus = '';
  successMsg = '';
  errorMsg = '';

  // Accept modal
  showAcceptModal = false;
  selectedRequest: SandRequest | null = null;
  acceptTruckId = 0;
  acceptDriverId = 0;
  acceptRemarks = '';
  accepting = false;

  // Reject modal
  showRejectModal = false;
  rejectRequestId: number | null = null;
  rejectRemarks = '';
  rejecting = false;

  private url = `${environment.apiUrl}/sand-requests`;

  constructor(
    private http: HttpClient,
    private truckService: TruckService,
    private driverService: DriverService
  ) {}

  ngOnInit() {
    this.loadAll();
    this.truckService.getAll().subscribe(r => this.trucks = r.data);
    this.driverService.getAll().subscribe(r => this.drivers = r.data);
  }

  loadAll() {
    this.loading = true;
    this.http.get<ApiResponse<SandRequest[]>>(this.url).subscribe({
      next: (res) => { this.requests = res.data; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyFilter() {
    this.filtered = this.filterStatus
      ? this.requests.filter(r => r.status === this.filterStatus)
      : [...this.requests];
  }

  openAccept(req: SandRequest) {
    this.selectedRequest = req;
    this.acceptTruckId = 0;
    this.acceptDriverId = 0;
    this.acceptRemarks = '';
    this.errorMsg = '';
    // Reload trucks fresh before filtering
    this.truckService.getAll().subscribe(r => {
      this.trucks = r.data;
      // Filter: capacity >= requested tons AND status is AVAILABLE
      // Use Number() to ensure proper numeric comparison
      this.suitableTrucks = this.trucks.filter(t =>
        Number(t.capacityTons) >= Number(req.tons) && t.status === 'AVAILABLE'
      );
    });
    this.showAcceptModal = true;
  }

  accept() {
    if (!this.selectedRequest || !this.acceptTruckId || !this.acceptDriverId) {
      this.errorMsg = 'Please select both truck and driver';
      return;
    }
    this.accepting = true;
    this.http.put<ApiResponse<SandRequest>>(
      `${this.url}/${this.selectedRequest.id}/accept`,
      { truckId: this.acceptTruckId, driverId: this.acceptDriverId, adminRemarks: this.acceptRemarks }
    ).subscribe({
      next: (res) => {
        this.accepting = false;
        this.showAcceptModal = false;
        this.successMsg = `Request accepted! Trip #${res.data.trip?.id} created for ${this.selectedRequest!.dealer.name}`;
        setTimeout(() => this.successMsg = '', 5000);
        this.loadAll();
      },
      error: (err) => { this.accepting = false; this.errorMsg = err.error?.message || 'Failed'; }
    });
  }

  openReject(req: SandRequest) {
    this.rejectRequestId = req.id;
    this.rejectRemarks = '';
    this.showRejectModal = true;
  }

  reject() {
    if (!this.rejectRequestId) return;
    this.rejecting = true;
    this.http.put<ApiResponse<SandRequest>>(
      `${this.url}/${this.rejectRequestId}/reject`,
      { adminRemarks: this.rejectRemarks }
    ).subscribe({
      next: () => {
        this.rejecting = false;
        this.showRejectModal = false;
        this.successMsg = 'Request rejected';
        setTimeout(() => this.successMsg = '', 3000);
        this.loadAll();
      },
      error: (err) => { this.rejecting = false; this.errorMsg = err.error?.message || 'Failed'; }
    });
  }

  getPendingCount(): number { return this.requests.filter(r => r.status === 'PENDING').length; }

  getStatusClass(status: string): string {
    const map: any = {
      PENDING:   'badge-warning',
      ACCEPTED:  'badge-success',
      REJECTED:  'badge-danger',
      DELIVERED: 'badge-info'
    };
    return map[status] || 'badge-secondary';
  }
}
