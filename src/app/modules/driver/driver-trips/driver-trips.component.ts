import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TripService } from '../../../core/services/trip.service';
import { AuthService } from '../../../core/services/auth.service';
import { Trip } from '../../../core/models/trip.model';

@Component({
  selector: 'app-driver-trips',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './driver-trips.component.html',
  styleUrls: ['./driver-trips.component.css']
})
export class DriverTripsComponent implements OnInit {
  trips: Trip[] = [];
  filtered: Trip[] = [];
  loading = true;
  searchTerm = '';
  filterStatus = '';
  linkedId: number | null = null;
  successMsg = '';
  errorMsg = '';

  totalTrips = 0;
  completedTrips = 0;
  totalTons = 0;

  constructor(private tripService: TripService, private authService: AuthService) {}

  ngOnInit() {
    this.linkedId = this.authService.getLinkedId();
    this.loadTrips();
  }

  loadTrips() {
    if (!this.linkedId) { this.loading = false; return; }
    this.tripService.getByDriver(this.linkedId).subscribe({
      next: (res) => {
        this.trips = res.data;
        this.filtered = res.data;
        this.calcSummary();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  calcSummary() {
    this.totalTrips = this.trips.length;
    this.completedTrips = this.trips.filter(t => t.status === 'COMPLETED').length;
    this.totalTons = this.trips.reduce((s, t) => s + Number(t.tons), 0);
  }

  applyFilters() {
    let result = [...this.trips];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(t =>
        t.truck.truckNumber.toLowerCase().includes(term) ||
        t.dealer.name.toLowerCase().includes(term) ||
        t.sourceLocation.toLowerCase().includes(term) ||
        t.destinationLocation.toLowerCase().includes(term)
      );
    }
    if (this.filterStatus) result = result.filter(t => t.status === this.filterStatus);
    this.filtered = result;
  }

  acknowledge(trip: Trip) {
    if (!this.linkedId) return;
    this.tripService.acknowledge(trip.id, this.linkedId).subscribe({
      next: () => {
        this.successMsg = 'Trip acknowledged! Admin has been notified.';
        setTimeout(() => this.successMsg = '', 3000);
        this.loadTrips();
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Failed'; setTimeout(() => this.errorMsg = '', 3000); }
    });
  }

  markComplete(trip: Trip) {
    if (!this.linkedId) return;
    if (!confirm('Mark this trip as completed?')) return;
    this.tripService.driverComplete(trip.id, this.linkedId).subscribe({
      next: () => {
        this.successMsg = 'Trip marked as completed!';
        setTimeout(() => this.successMsg = '', 3000);
        this.loadTrips();
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Failed'; setTimeout(() => this.errorMsg = '', 3000); }
    });
  }

  getStatusClass(status: string): string {
    const map: any = {
      PENDING: 'badge-warning', ACKNOWLEDGED: 'badge-info',
      IN_PROGRESS: 'badge-primary', COMPLETED: 'badge-success', CANCELLED: 'badge-danger'
    };
    return map[status] || 'badge-secondary';
  }
}
