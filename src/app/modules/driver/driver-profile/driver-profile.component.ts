import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ApiResponse } from '../../../core/models/auth.model';

interface UserProfile {
  id: number; username: string; phone: string;
  profilePhoto: string; role: { name: string }; status: boolean;
}

@Component({
  selector: 'app-driver-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './driver-profile.component.html',
  styleUrls: ['./driver-profile.component.css']
})
export class DriverProfileComponent implements OnInit {
  profile: UserProfile | null = null;
  loading = true;
  activePanel: 'edit' | 'password' | null = null;

  editUsername = ''; editPhone = ''; editPhoto = '';
  profileSuccessMsg = ''; profileErrorMsg = ''; savingProfile = false;

  currentPassword = ''; newPassword = ''; confirmPassword = '';
  showCurrentPwd = false; showNewPwd = false; showConfirmPwd = false;
  pwdSuccessMsg = ''; pwdErrorMsg = ''; savingPwd = false;

  private url = `${environment.apiUrl}/profile`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() { this.loadProfile(); }

  loadProfile() {
    this.loading = true;
    this.http.get<ApiResponse<UserProfile>>(this.url).subscribe({
      next: (res) => {
        this.profile = res.data;
        this.editUsername = res.data.username;
        this.editPhone = res.data.phone || '';
        this.editPhoto = res.data.profilePhoto || '';
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  openEdit() {
    this.activePanel = this.activePanel === 'edit' ? null : 'edit';
    this.profileErrorMsg = '';
    if (this.activePanel === 'edit' && this.profile) {
      this.editUsername = this.profile.username;
      this.editPhone = this.profile.phone || '';
      this.editPhoto = this.profile.profilePhoto || '';
    }
  }

  openChangePassword() {
    this.activePanel = this.activePanel === 'password' ? null : 'password';
    this.pwdErrorMsg = '';
    this.currentPassword = ''; this.newPassword = ''; this.confirmPassword = '';
  }

  onPhotoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { this.profileErrorMsg = 'Image must be less than 2MB'; return; }
    const reader = new FileReader();
    reader.onload = () => { this.editPhoto = reader.result as string; };
    reader.readAsDataURL(file);
  }

  saveProfile() {
    this.savingProfile = true; this.profileErrorMsg = '';
    this.http.put<ApiResponse<UserProfile>>(this.url, {
      username: this.editUsername, phone: this.editPhone, profilePhoto: this.editPhoto
    }).subscribe({
      next: (res) => {
        this.profile = res.data; this.savingProfile = false;
        this.profileSuccessMsg = 'Profile updated'; this.activePanel = null;
        localStorage.setItem('username', res.data.username);
        setTimeout(() => this.profileSuccessMsg = '', 3000);
      },
      error: (err) => { this.savingProfile = false; this.profileErrorMsg = err.error?.message || 'Update failed'; }
    });
  }

  changePassword() {
    if (this.newPassword !== this.confirmPassword) { this.pwdErrorMsg = 'Passwords do not match'; return; }
    if (this.newPassword.length < 6) { this.pwdErrorMsg = 'Min 6 characters'; return; }
    this.savingPwd = true; this.pwdErrorMsg = '';
    this.http.put<ApiResponse<void>>(`${this.url}/change-password`, {
      currentPassword: this.currentPassword, newPassword: this.newPassword, confirmPassword: this.confirmPassword
    }).subscribe({
      next: () => {
        this.savingPwd = false; this.pwdSuccessMsg = 'Password changed! Logging out...';
        this.activePanel = null;
        setTimeout(() => this.authService.logout(), 2000);
      },
      error: (err) => { this.savingPwd = false; this.pwdErrorMsg = err.error?.message || 'Failed'; }
    });
  }

  getInitials(): string { return this.profile?.username.charAt(0).toUpperCase() || 'D'; }
}
