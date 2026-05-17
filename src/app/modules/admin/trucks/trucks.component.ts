import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TruckService } from '../../../core/services/truck.service';
import { Truck, TruckRequest } from '../../../core/models/truck.model';
import { sortData, SortState } from '../../../core/utils/sort.util';

@Component({
  selector: 'app-trucks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trucks.component.html',
  styleUrls: ['./trucks.component.css']
})
export class TrucksComponent implements OnInit {
  trucks: Truck[] = [];
  filtered: Truck[] = [];
  loading = true;
  showModal = false;
  isEdit = false;
  editId: number | null = null;
  successMsg = '';
  errorMsg = '';
  searchTerm = '';
  filterStatus = '';
  sort: SortState = { column: '', direction: '' };

  @ViewChild('truckForm') truckForm!: NgForm;
  form: TruckRequest = this.emptyForm();

  constructor(private truckService: TruckService) {}

  ngOnInit() { this.loadTrucks(); }

  loadTrucks() {
    this.loading = true;
    this.truckService.getAll().subscribe({
      next: (res) => { this.trucks = res.data; this.applyFilters(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyFilters() {
    let result = [...this.trucks];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(t =>
        t.truckNumber.toLowerCase().includes(term) ||
        t.model.toLowerCase().includes(term) ||
        t.rcNumber.toLowerCase().includes(term)
      );
    }
    if (this.filterStatus) result = result.filter(t => t.status === this.filterStatus);
    this.filtered = sortData(result, this.sort);
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

  openAdd() {
    this.isEdit = false; this.editId = null;
    this.form = this.emptyForm(); this.showModal = true; this.errorMsg = '';
    setTimeout(() => { if (this.truckForm) this.truckForm.resetForm(this.form); }, 0);
  }

  openEdit(truck: Truck) {
    this.isEdit = true; this.editId = truck.id;
    this.form = {
      truckNumber: truck.truckNumber, model: truck.model,
      capacityTons: truck.capacityTons, insuranceNumber: truck.insuranceNumber,
      rcNumber: truck.rcNumber, status: truck.status
    };
    this.showModal = true; this.errorMsg = '';
  }

  save() {
    if (this.truckForm) this.truckForm.form.markAllAsTouched();
    if (this.truckForm && this.truckForm.invalid) return;
    const obs = this.isEdit && this.editId
      ? this.truckService.update(this.editId, this.form)
      : this.truckService.create(this.form);
    obs.subscribe({
      next: () => { this.showModal = false; this.showSuccess(this.isEdit ? 'Truck updated' : 'Truck added'); this.loadTrucks(); },
      error: (err) => { this.errorMsg = err.error?.message || 'Operation failed'; }
    });
  }

  delete(id: number) {
    if (confirm('Are you sure you want to delete this truck?')) {
      this.truckService.delete(id).subscribe({
        next: () => { this.showSuccess('Truck deleted'); this.loadTrucks(); },
        error: (err) => { this.showError(err.error?.message || 'Delete failed'); }
      });
    }
  }

  getStatusClass(status: string): string {
    const map: any = { AVAILABLE: 'badge-success', ON_TRIP: 'badge-warning', MAINTENANCE: 'badge-danger' };
    return map[status] || 'badge-secondary';
  }

  private showSuccess(msg: string) { this.successMsg = msg; setTimeout(() => this.successMsg = '', 3000); }
  private showError(msg: string) { this.errorMsg = msg; setTimeout(() => this.errorMsg = '', 3000); }
  private emptyForm(): TruckRequest {
    return { truckNumber: '', model: '', capacityTons: 0, insuranceNumber: '', rcNumber: '', status: 'AVAILABLE' };
  }
}
