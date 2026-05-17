import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DriverService } from '../../../core/services/driver.service';
import { TruckService } from '../../../core/services/truck.service';
import { UserService } from '../../../core/services/user.service';
import { Driver, DriverRequest } from '../../../core/models/driver.model';
import { Truck } from '../../../core/models/truck.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.model';

interface UserAccount {
  id: number; username: string; status: boolean; role: string;
}

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.css']
})
export class DriversComponent implements OnInit {
  drivers: Driver[] = [];
  trucks: Truck[] = [];
  filtered: Driver[] = [];
  driverAccounts: Map<number, UserAccount> = new Map();
  loading = true;
  showModal = false;
  isEdit = false;
  editId: number | null = null;
  successMsg = '';
  errorMsg = '';
  searchTerm = '';
  filterAssigned = '';
  form: DriverRequest = this.emptyForm();
  showPassword = false;

  // Reset password modal
  showResetModal = false;
  resetUserId: number | null = null;
  resetUsername = '';
  resetNewPassword = '';
  showResetPwd = false;
  resetting = false;

  usernameStatus: 'idle' | 'checking' | 'available' | 'taken' = 'idle';
  private usernameCheck$ = new Subject<string>();

  @ViewChild('driverForm') driverForm!: NgForm;

  constructor(
    private driverService: DriverService,
    private truckService: TruckService,
    private userService: UserService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadDrivers();
    this.truckService.getAll().subscribe(res => this.trucks = res.data);
    this.usernameCheck$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(username => {
      if (!username || username.length < 3) { this.usernameStatus = 'idle'; return; }
      this.usernameStatus = 'checking';
      this.userService.checkUsernameAvailable(username).subscribe({
        next: (res) => { this.usernameStatus = res.data ? 'available' : 'taken'; },
        error: () => { this.usernameStatus = 'idle'; }
      });
    });
  }

  loadDrivers() {
    this.loading = true;
    this.driverService.getAll().subscribe({
      next: (res) => {
        this.drivers = res.data;
        this.applyFilters();
        this.loading = false;
        this.loadAccounts();
      },
      error: () => { this.loading = false; }
    });
  }

  loadAccounts() {
    this.http.get<ApiResponse<UserAccount[]>>(`${environment.apiUrl}/users`).subscribe({
      next: (res) => {
        this._allAccounts = res.data;
      }
    });
  }

  _allAccounts: UserAccount[] = [];

  getDriverAccount(driverId: number): UserAccount | undefined {
    return this._allAccounts.find((u: any) => u.linkedDriverId === driverId);
  }

  applyFilters() {
    let result = [...this.drivers];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(term) ||
        d.phone.includes(term) ||
        d.licenseNumber.toLowerCase().includes(term)
      );
    }
    if (this.filterAssigned === 'yes') result = result.filter(d => !!d.assignedTruck);
    else if (this.filterAssigned === 'no') result = result.filter(d => !d.assignedTruck);
    this.filtered = result;
  }

  onUsernameInput() { this.usernameCheck$.next(this.form.username); }

  autoFillUsername() {
    if (!this.form.username && this.form.name) {
      this.form.username = this.form.name.toLowerCase().replace(/\s+/g, '.') + '_driver';
      this.usernameCheck$.next(this.form.username);
    }
  }

  openAdd() {
    this.isEdit = false; this.editId = null;
    this.form = this.emptyForm();
    this.usernameStatus = 'idle'; this.showPassword = false;
    this.showModal = true; this.errorMsg = '';
    setTimeout(() => { if (this.driverForm) this.driverForm.resetForm(this.form); }, 0);
  }

  openEdit(driver: Driver) {
    this.isEdit = true; this.editId = driver.id;
    this.form = {
      name: driver.name, phone: driver.phone,
      licenseNumber: driver.licenseNumber, address: driver.address,
      salaryPerTrip: driver.salaryPerTrip,
      assignedTruckId: driver.assignedTruck?.id || null,
      username: '', password: ''
    };
    this.usernameStatus = 'idle';
    this.showModal = true; this.errorMsg = '';
  }

  save() {
    if (this.driverForm) this.driverForm.form.markAllAsTouched();
    if (this.driverForm && this.driverForm.invalid) return;
    if (!this.isEdit && this.usernameStatus === 'taken') {
      this.errorMsg = 'Username is already taken. Please choose another.'; return;
    }
    const obs = this.isEdit && this.editId
      ? this.driverService.update(this.editId, this.form)
      : this.driverService.create(this.form);
    obs.subscribe({
      next: () => {
        this.showModal = false;
        this.showSuccess(this.isEdit ? 'Driver updated' : 'Driver added with login account');
        this.loadDrivers();
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Operation failed'; }
    });
  }

  delete(id: number) {
    if (confirm('Delete this driver and their login account?')) {
      this.driverService.delete(id).subscribe({
        next: () => { this.showSuccess('Driver deleted'); this.loadDrivers(); },
        error: (err) => { this.showError(err.error?.message || 'Delete failed'); }
      });
    }
  }

  // Toggle account active/inactive
  toggleAccount(account: UserAccount) {
    this.http.put<ApiResponse<any>>(`${environment.apiUrl}/users/${account.id}/toggle-status`, {}).subscribe({
      next: (res) => { this.showSuccess(res.message); this.loadAccounts(); },
      error: (err) => { this.showError(err.error?.message || 'Failed'); }
    });
  }

  // Open reset password modal
  openResetPassword(account: UserAccount) {
    this.resetUserId = account.id;
    this.resetUsername = account.username;
    this.resetNewPassword = '';
    this.showResetPwd = false;
    this.showResetModal = true;
  }

  resetPassword() {
    if (!this.resetNewPassword || this.resetNewPassword.length < 6) return;
    this.resetting = true;
    this.http.put<ApiResponse<void>>(
      `${environment.apiUrl}/users/${this.resetUserId}/reset-password`,
      { newPassword: this.resetNewPassword }
    ).subscribe({
      next: () => {
        this.resetting = false;
        this.showResetModal = false;
        this.showSuccess('Password reset successfully');
      },
      error: (err) => { this.resetting = false; this.showError(err.error?.message || 'Failed'); }
    });
  }

  private showSuccess(msg: string) { this.successMsg = msg; setTimeout(() => this.successMsg = '', 3000); }
  private showError(msg: string)   { this.errorMsg = msg;   setTimeout(() => this.errorMsg = '', 3000); }
  private emptyForm(): DriverRequest {
    return { name: '', phone: '', licenseNumber: '', address: '', salaryPerTrip: 0, assignedTruckId: null, username: '', password: '' };
  }
}
