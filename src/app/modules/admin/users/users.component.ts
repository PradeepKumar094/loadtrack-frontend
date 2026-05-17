import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.model';

interface UserResponse {
  id: number;
  username: string;
  role: string;
  status: boolean;
  phone: string;
  linkedDriverId: number;
  linkedDriverName: string;
  linkedDealerId: number;
  linkedDealerName: string;
}

interface AvailableDriver { id: number; name: string; phone: string; }
interface AvailableDealer { id: number; name: string; phone: string; }

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: UserResponse[] = [];
  filtered: UserResponse[] = [];
  availableDrivers: AvailableDriver[] = [];
  availableDealers: AvailableDealer[] = [];
  loading = true;

  // Filters
  searchTerm = '';
  filterRole = '';

  // Create modal
  showCreateModal = false;
  createRole: 'DRIVER' | 'DEALER' = 'DRIVER';
  createUsername = '';
  createPassword = '';
  showCreatePwd = false;
  selectedDriverId: number = 0;
  selectedDealerId: number = 0;
  createError = '';
  creating = false;

  // Credentials popup (shown after creation)
  showCredentials = false;
  createdUsername = '';
  createdPassword = '';
  createdFor = '';

  // Reset password modal
  showResetModal = false;
  resetUserId: number | null = null;
  resetUsername = '';
  resetNewPassword = '';
  showResetPwd = false;
  resetError = '';
  resetting = false;

  successMsg = '';
  errorMsg = '';

  @ViewChild('createForm') createForm!: NgForm;

  private url = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading = true;
    this.http.get<ApiResponse<UserResponse[]>>(this.url).subscribe({
      next: (res) => { this.users = res.data; this.applyFilters(); this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.http.get<ApiResponse<AvailableDriver[]>>(`${this.url}/available-drivers`).subscribe({
      next: (res) => { this.availableDrivers = res.data; }
    });
    this.http.get<ApiResponse<AvailableDealer[]>>(`${this.url}/available-dealers`).subscribe({
      next: (res) => { this.availableDealers = res.data; }
    });
  }

  applyFilters() {
    let result = [...this.users];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(u =>
        u.username.toLowerCase().includes(term) ||
        (u.linkedDriverName || '').toLowerCase().includes(term) ||
        (u.linkedDealerName || '').toLowerCase().includes(term)
      );
    }
    if (this.filterRole) result = result.filter(u => u.role === this.filterRole);
    this.filtered = result;
  }

  openCreate() {
    this.showCreateModal = true;
    this.createRole = 'DRIVER';
    this.createUsername = '';
    this.createPassword = '';
    this.selectedDriverId = 0;
    this.selectedDealerId = 0;
    this.createError = '';
    this.showCreatePwd = false;
  }

  onRoleChange() {
    this.selectedDriverId = 0;
    this.selectedDealerId = 0;
    this.createUsername = '';
  }

  // Auto-fill username from selected driver/dealer
  onDriverSelect() {
    const driver = this.availableDrivers.find(d => d.id === this.selectedDriverId);
    if (driver) {
      this.createUsername = driver.name.toLowerCase().replace(/\s+/g, '.') + '_driver';
    }
  }

  onDealerSelect() {
    const dealer = this.availableDealers.find(d => d.id === this.selectedDealerId);
    if (dealer) {
      this.createUsername = dealer.name.toLowerCase().replace(/\s+/g, '.') + '_dealer';
    }
  }

  generatePassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#';
    this.createPassword = Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    this.showCreatePwd = true;
  }

  createUser() {
    if (this.createForm) this.createForm.form.markAllAsTouched();
    if (this.createForm && this.createForm.invalid) return;

    if (this.createRole === 'DRIVER' && !this.selectedDriverId) {
      this.createError = 'Please select a driver'; return;
    }
    if (this.createRole === 'DEALER' && !this.selectedDealerId) {
      this.createError = 'Please select a dealer'; return;
    }

    this.creating = true;
    this.createError = '';

    const body: any = {
      username: this.createUsername,
      password: this.createPassword,
      role: this.createRole
    };
    if (this.createRole === 'DRIVER') body.linkedDriverId = this.selectedDriverId;
    if (this.createRole === 'DEALER') body.linkedDealerId = this.selectedDealerId;

    this.http.post<ApiResponse<UserResponse>>(this.url, body).subscribe({
      next: (res) => {
        this.creating = false;
        this.showCreateModal = false;

        // Show credentials popup
        this.createdUsername = this.createUsername;
        this.createdPassword = this.createPassword;
        this.createdFor = this.createRole === 'DRIVER'
          ? this.availableDrivers.find(d => d.id === this.selectedDriverId)?.name || ''
          : this.availableDealers.find(d => d.id === this.selectedDealerId)?.name || '';
        this.showCredentials = true;

        this.loadAll();
      },
      error: (err) => {
        this.creating = false;
        this.createError = err.error?.message || 'Failed to create account';
      }
    });
  }

  toggleStatus(user: UserResponse) {
    this.http.put<ApiResponse<UserResponse>>(`${this.url}/${user.id}/toggle-status`, {}).subscribe({
      next: (res) => {
        this.showSuccess(res.message);
        this.loadAll();
      },
      error: (err) => { this.showError(err.error?.message || 'Failed'); }
    });
  }

  openReset(user: UserResponse) {
    this.resetUserId = user.id;
    this.resetUsername = user.username;
    this.resetNewPassword = '';
    this.resetError = '';
    this.showResetPwd = false;
    this.showResetModal = true;
  }

  resetPassword() {
    if (!this.resetNewPassword || this.resetNewPassword.length < 6) {
      this.resetError = 'Password must be at least 6 characters'; return;
    }
    this.resetting = true;
    this.http.put<ApiResponse<void>>(`${this.url}/${this.resetUserId}/reset-password`, {
      newPassword: this.resetNewPassword
    }).subscribe({
      next: () => {
        this.resetting = false;
        this.showResetModal = false;
        this.showSuccess('Password reset successfully');
      },
      error: (err) => { this.resetting = false; this.resetError = err.error?.message || 'Failed'; }
    });
  }

  deleteUser(user: UserResponse) {
    if (!confirm(`Delete account for "${user.username}"? This cannot be undone.`)) return;
    this.http.delete<ApiResponse<void>>(`${this.url}/${user.id}`).subscribe({
      next: () => { this.showSuccess('Account deleted'); this.loadAll(); },
      error: (err) => { this.showError(err.error?.message || 'Delete failed'); }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.showSuccess('Copied to clipboard');
    });
  }

  getRoleClass(role: string): string {
    const map: any = { ADMIN: 'badge-info', DRIVER: 'badge-success', DEALER: 'badge-warning' };
    return map[role] || 'badge-secondary';
  }

  private showSuccess(msg: string) { this.successMsg = msg; setTimeout(() => this.successMsg = '', 3000); }
  private showError(msg: string)   { this.errorMsg = msg;   setTimeout(() => this.errorMsg = '', 4000); }
}
