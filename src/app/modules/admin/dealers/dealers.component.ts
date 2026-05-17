import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DealerService } from '../../../core/services/dealer.service';
import { UserService } from '../../../core/services/user.service';
import { Dealer, DealerRequest } from '../../../core/models/dealer.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.model';

interface UserAccount {
  id: number; username: string; status: boolean; role: string; linkedDealerId?: number;
}

@Component({
  selector: 'app-dealers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dealers.component.html',
  styleUrls: ['./dealers.component.css']
})
export class DealersComponent implements OnInit {
  dealers: Dealer[] = [];
  filtered: Dealer[] = [];
  _allAccounts: UserAccount[] = [];
  loading = true;
  showModal = false;
  isEdit = false;
  editId: number | null = null;
  successMsg = '';
  errorMsg = '';
  searchTerm = '';
  form: DealerRequest = this.emptyForm();
  showPassword = false;

  showResetModal = false;
  resetUserId: number | null = null;
  resetUsername = '';
  resetNewPassword = '';
  showResetPwd = false;
  resetting = false;

  usernameStatus: 'idle' | 'checking' | 'available' | 'taken' = 'idle';
  private usernameCheck$ = new Subject<string>();

  @ViewChild('dealerForm') dealerForm!: NgForm;

  constructor(
    private dealerService: DealerService,
    private userService: UserService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadDealers();
    this.usernameCheck$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(username => {
      if (!username || username.length < 3) { this.usernameStatus = 'idle'; return; }
      this.usernameStatus = 'checking';
      this.userService.checkUsernameAvailable(username).subscribe({
        next: (res) => { this.usernameStatus = res.data ? 'available' : 'taken'; },
        error: () => { this.usernameStatus = 'idle'; }
      });
    });
  }

  loadDealers() {
    this.loading = true;
    this.dealerService.getAll().subscribe({
      next: (res) => {
        this.dealers = res.data;
        this.filtered = res.data;
        this.loading = false;
        this.loadAccounts();
      },
      error: () => { this.loading = false; }
    });
  }

  loadAccounts() {
    this.http.get<ApiResponse<UserAccount[]>>(`${environment.apiUrl}/users`).subscribe({
      next: (res) => { this._allAccounts = res.data; }
    });
  }

  getDealerAccount(dealerId: number): UserAccount | undefined {
    return this._allAccounts.find((u: any) => u.linkedDealerId === dealerId);
  }

  applyFilters() {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.dealers.filter(d =>
      d.name.toLowerCase().includes(term) || d.phone.includes(term)
    );
  }

  onUsernameInput() { this.usernameCheck$.next(this.form.username); }

  autoFillUsername() {
    if (!this.form.username && this.form.name) {
      this.form.username = this.form.name.toLowerCase().replace(/\s+/g, '.') + '_dealer';
      this.usernameCheck$.next(this.form.username);
    }
  }

  openAdd() {
    this.isEdit = false; this.editId = null;
    this.form = this.emptyForm();
    this.usernameStatus = 'idle'; this.showPassword = false;
    this.showModal = true; this.errorMsg = '';
    setTimeout(() => { if (this.dealerForm) this.dealerForm.resetForm(this.form); }, 0);
  }

  openEdit(dealer: Dealer) {
    this.isEdit = true; this.editId = dealer.id;
    this.form = { name: dealer.name, phone: dealer.phone, address: dealer.address, username: '', password: '' };
    this.usernameStatus = 'idle';
    this.showModal = true; this.errorMsg = '';
  }

  save() {
    if (this.dealerForm) this.dealerForm.form.markAllAsTouched();
    if (this.dealerForm && this.dealerForm.invalid) return;
    if (!this.isEdit && this.usernameStatus === 'taken') {
      this.errorMsg = 'Username is already taken. Please choose another.'; return;
    }
    const obs = this.isEdit && this.editId
      ? this.dealerService.update(this.editId, this.form)
      : this.dealerService.create(this.form);
    obs.subscribe({
      next: () => {
        this.showModal = false;
        this.successMsg = this.isEdit ? 'Dealer updated' : 'Dealer added with login account';
        setTimeout(() => this.successMsg = '', 3000);
        this.loadDealers();
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Operation failed'; }
    });
  }

  delete(id: number) {
    if (confirm('Delete this dealer and their login account?')) {
      this.dealerService.delete(id).subscribe({
        next: () => { this.successMsg = 'Dealer deleted'; setTimeout(() => this.successMsg = '', 3000); this.loadDealers(); },
        error: (err) => { this.errorMsg = err.error?.message || 'Delete failed'; setTimeout(() => this.errorMsg = '', 3000); }
      });
    }
  }

  toggleAccount(account: UserAccount) {
    this.http.put<ApiResponse<any>>(`${environment.apiUrl}/users/${account.id}/toggle-status`, {}).subscribe({
      next: (res) => { this.successMsg = res.message; setTimeout(() => this.successMsg = '', 3000); this.loadAccounts(); },
      error: (err) => { this.errorMsg = err.error?.message || 'Failed'; setTimeout(() => this.errorMsg = '', 3000); }
    });
  }

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
        this.resetting = false; this.showResetModal = false;
        this.successMsg = 'Password reset successfully'; setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => { this.resetting = false; this.errorMsg = err.error?.message || 'Failed'; }
    });
  }

  private emptyForm(): DealerRequest {
    return { name: '', phone: '', address: '', username: '', password: '' };
  }
}
