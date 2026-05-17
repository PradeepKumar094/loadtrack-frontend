import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TripService } from '../../../core/services/trip.service';
import { TruckService } from '../../../core/services/truck.service';
import { DriverService } from '../../../core/services/driver.service';
import { DealerService } from '../../../core/services/dealer.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Trip, TripRequest } from '../../../core/models/trip.model';
import { Truck } from '../../../core/models/truck.model';
import { Driver } from '../../../core/models/driver.model';
import { Dealer } from '../../../core/models/dealer.model';
import { ApiResponse } from '../../../core/models/auth.model';

import { sortData, SortState } from '../../../core/utils/sort.util';

interface SandType { id: number; name: string; pricePerTon: number; }

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trips.component.html',
  styleUrls: ['./trips.component.css']
})
export class TripsComponent implements OnInit {
  trips: Trip[] = [];
  filtered: Trip[] = [];
  allTrucks: Truck[] = [];
  suitableTrucks: Truck[] = [];
  drivers: Driver[] = [];
  dealers: Dealer[] = [];
  sandTypes: SandType[] = [];
  loading = true;
  showModal = false;
  isEdit = false;
  editId: number | null = null;
  successMsg = '';
  errorMsg = '';
  filterStatus = '';
  filterSandType = 0;
  sort: SortState = { column: '', direction: '' };
  calculatedAmount = 0;
  baseAmount = 0;
  extraCharge = 0;
  driverExtraShare = 0;
  baseDistanceKm = 12;      // from settings
  ratePerExtraKm = 30;      // from settings
  driverExtraSharePct = 50; // from settings

  // Column search
  searchColumn = 'all';
  searchTerm = '';

  readonly searchColumns = [
    { value: 'all',                 label: 'All Columns' },
    { value: 'truck.truckNumber',   label: 'Truck Number' },
    { value: 'driver.name',         label: 'Driver Name' },
    { value: 'dealer.name',         label: 'Dealer Name' },
    { value: 'sandType.name',       label: 'Sand Type' },
    { value: 'sourceLocation',      label: 'Source' },
    { value: 'destinationLocation', label: 'Destination' },
    { value: 'tripDate',            label: 'Trip Date' },
    { value: 'status',              label: 'Status' },
    { value: 'totalAmount',         label: 'Total Amount' },
  ];
  capacityWarning = '';

  @ViewChild('tripForm') tripForm!: NgForm;
  form: TripRequest = this.emptyForm();

  constructor(
    private tripService: TripService,
    private truckService: TruckService,
    private driverService: DriverService,
    private dealerService: DealerService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadTrips();
    this.truckService.getAll().subscribe(r => { this.allTrucks = r.data; this.suitableTrucks = r.data; });
    this.driverService.getAll().subscribe(r => this.drivers = r.data);
    this.dealerService.getAll().subscribe(r => this.dealers = r.data);
    this.http.get<ApiResponse<SandType[]>>(`${environment.apiUrl}/sand-types`).subscribe(r => this.sandTypes = r.data);
    // Load settings for distance charge config
    this.http.get<any>(`${environment.apiUrl}/settings`).subscribe(r => {
      if (r.data) {
        this.baseDistanceKm = r.data.baseDistanceKm || 12;
        this.ratePerExtraKm = r.data.extraChargePerKm || 30;
        this.driverExtraSharePct = r.data.driverExtraSharePct || 50;
      }
    });
  }

  loadTrips() {
    this.loading = true;
    this.tripService.getAll().subscribe({
      next: (res) => { this.trips = res.data; this.applyFilters(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyFilters() {
    let result = [...this.trips];

    // Column-specific search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      if (this.searchColumn === 'all') {
        result = result.filter(t =>
          t.truck.truckNumber.toLowerCase().includes(term) ||
          t.driver.name.toLowerCase().includes(term) ||
          t.dealer.name.toLowerCase().includes(term) ||
          t.sandType.name.toLowerCase().includes(term) ||
          t.sourceLocation.toLowerCase().includes(term) ||
          t.destinationLocation.toLowerCase().includes(term) ||
          t.tripDate.includes(term) ||
          t.status.toLowerCase().includes(term) ||
          String(t.totalAmount).includes(term)
        );
      } else {
        result = result.filter(t => {
          const val = this.getNestedVal(t, this.searchColumn);
          return String(val ?? '').toLowerCase().includes(term);
        });
      }
    }

    if (this.filterStatus) result = result.filter(t => t.status === this.filterStatus);
    if (this.filterSandType) result = result.filter(t => t.sandType.id === this.filterSandType);
    this.filtered = sortData(result, this.sort);
  }

  private getNestedVal(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }

  sortBy(column: string) {
    if (this.sort.column === column) {
      this.sort.direction = this.sort.direction === 'asc' ? 'desc' : this.sort.direction === 'desc' ? '' : 'asc';
      if (this.sort.direction === '') this.sort.column = '';
    } else {
      this.sort = { column, direction: 'asc' };
    }
    this.applyFilters();
  }

  getSortIcon(column: string): string {
    if (this.sort.column !== column) return 'fas fa-sort';
    return this.sort.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }

  clearFilters() {
    this.searchTerm = '';
    this.searchColumn = 'all';
    this.filterStatus = '';
    this.filterSandType = 0;
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.filterStatus || this.filterSandType);
  }

  getSearchPlaceholder(): string {
    const col = this.searchColumns.find(c => c.value === this.searchColumn);
    return col ? `Search by ${col.label}...` : 'Search...';
  }

  // When tons changes — filter trucks by capacity and recalculate amount
  onTonsChange() {
    const tons = Number(this.form.tons);
    if (tons > 0) {
      // Filter trucks: only AVAILABLE trucks with capacity >= requested tons
      this.suitableTrucks = this.allTrucks.filter(t =>
        t.capacityTons >= tons && t.status === 'AVAILABLE'
      );

      // If currently selected truck is no longer suitable, clear it
      if (this.form.truckId) {
        const selectedTruck = this.allTrucks.find(t => t.id === this.form.truckId);
        if (selectedTruck && selectedTruck.capacityTons < tons) {
          this.capacityWarning = `Warning: Selected truck (${selectedTruck.truckNumber}) capacity is ${selectedTruck.capacityTons} tons, which is less than requested ${tons} tons. Please select a suitable truck.`;
          this.form.truckId = 0;
        } else {
          this.capacityWarning = '';
        }
      }

      if (this.suitableTrucks.length === 0) {
        this.capacityWarning = `No available trucks with capacity ≥ ${tons} tons. Please add a suitable truck first.`;
      }
    } else {
      this.suitableTrucks = this.allTrucks.filter(t => t.status === 'AVAILABLE');
      this.capacityWarning = '';
    }
    this.recalculateAmount();
  }

  onSandTypeChange() { this.recalculateAmount(); }

  onDistanceChange() { this.recalculateAmount(); }

  onTruckChange() {
    const tons = Number(this.form.tons);
    const selectedTruck = this.allTrucks.find(t => t.id === this.form.truckId);
    if (selectedTruck && tons > 0 && selectedTruck.capacityTons < tons) {
      this.capacityWarning = `Cannot assign: Truck ${selectedTruck.truckNumber} capacity is ${selectedTruck.capacityTons} tons but you need ${tons} tons.`;
      this.form.truckId = 0;
    } else {
      this.capacityWarning = '';
    }
  }

  private recalculateAmount() {
    const st = this.sandTypes.find(s => s.id === Number(this.form.sandTypeId));
    const tons = Number(this.form.tons) || 0;
    const dist = Number(this.form.distanceKm) || 0;

    if (st && tons > 0) {
      this.baseAmount = st.pricePerTon * tons;
      if (dist > this.baseDistanceKm) {
        const extraKm = dist - this.baseDistanceKm;
        this.extraCharge = extraKm * this.ratePerExtraKm;
        this.driverExtraShare = this.extraCharge * (this.driverExtraSharePct / 100);
      } else {
        this.extraCharge = 0;
        this.driverExtraShare = 0;
      }
      this.calculatedAmount = this.baseAmount + this.extraCharge;
    } else {
      this.baseAmount = 0; this.extraCharge = 0;
      this.driverExtraShare = 0; this.calculatedAmount = 0;
    }
  }

  openAdd() {
    this.isEdit = false; this.editId = null;
    this.form = this.emptyForm();
    this.calculatedAmount = 0;
    this.capacityWarning = '';
    this.suitableTrucks = this.allTrucks.filter(t => t.status === 'AVAILABLE');
    this.showModal = true; this.errorMsg = '';
  }

  openEdit(trip: Trip) {
    this.isEdit = true; this.editId = trip.id;
    this.form = {
      truckId: trip.truck.id, driverId: trip.driver.id,
      dealerId: trip.dealer.id, sandTypeId: trip.sandType.id,
      tons: trip.tons, sourceLocation: trip.sourceLocation,
      destinationLocation: trip.destinationLocation,
      distanceKm: trip.distanceKm || 0,
      tripDate: trip.tripDate, status: trip.status,
      initialPayment: 0, paymentRemarks: ''
    };
    this.calculatedAmount = trip.totalAmount;
    this.baseAmount = trip.totalAmount - (trip.extraDistanceCharge || 0);
    this.extraCharge = trip.extraDistanceCharge || 0;
    this.driverExtraShare = trip.driverExtraAmount || 0;
    this.capacityWarning = '';
    this.suitableTrucks = this.allTrucks;
    this.showModal = true; this.errorMsg = '';
  }

  save() {
    // Mark all fields touched — shows all validation errors at once on submit
    if (this.tripForm) {
      this.tripForm.form.markAllAsTouched();
    }

    if (this.tripForm && this.tripForm.invalid) {
      return;
    }

    if (this.capacityWarning) {
      this.errorMsg = this.capacityWarning;
      return;
    }
    const obs = this.isEdit && this.editId
      ? this.tripService.update(this.editId, this.form)
      : this.tripService.create(this.form);
    obs.subscribe({
      next: () => {
        this.showModal = false;
        this.successMsg = this.isEdit ? 'Trip updated' : 'Trip created';
        setTimeout(() => this.successMsg = '', 3000);
        this.loadTrips();
        this.truckService.getAll().subscribe(r => { this.allTrucks = r.data; this.applyFilters(); });
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Operation failed'; }
    });
  }

  delete(id: number) {
    if (confirm('Delete this trip?')) {
      this.tripService.delete(id).subscribe({
        next: () => { this.successMsg = 'Trip deleted'; setTimeout(() => this.successMsg = '', 3000); this.loadTrips(); },
        error: (err) => { this.errorMsg = err.error?.message || 'Delete failed'; setTimeout(() => this.errorMsg = '', 3000); }
      });
    }
  }

  getStatusClass(status: string): string {
    const map: any = { PENDING: 'badge-warning', COMPLETED: 'badge-success', CANCELLED: 'badge-danger' };
    return map[status] || 'badge-secondary';
  }

  private emptyForm(): TripRequest {
    return {
      truckId: 0, driverId: 0, dealerId: 0, sandTypeId: 0,
      tons: 0, sourceLocation: '', destinationLocation: '',
      distanceKm: 0, tripDate: '', status: 'PENDING',
      initialPayment: 0, paymentRemarks: ''
    };
  }
}
