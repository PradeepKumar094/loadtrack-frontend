import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  errorMsg = '';
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.redirectByRole();
    }
  }

  login() {
    if (!this.username || !this.password) {
      this.errorMsg = 'Please enter username and password';
      return;
    }
    this.loading = true;
    this.errorMsg = '';

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.redirectByRole();
        } else {
          this.errorMsg = res.message;
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Invalid username or password';
      }
    });
  }

  private redirectByRole() {
    const role = this.authService.getRole();
    if (role === 'ADMIN')  this.router.navigate(['/admin/dashboard']);
    else if (role === 'DRIVER') this.router.navigate(['/driver/dashboard']);
    else if (role === 'DEALER') this.router.navigate(['/dealer/dashboard']);
    else this.router.navigate(['/login']);
  }
}
