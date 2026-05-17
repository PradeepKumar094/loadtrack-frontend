import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="unauth-page">
      <div class="unauth-card">
        <i class="fas fa-lock"></i>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <a routerLink="/login" class="btn btn-primary">
          <i class="fas fa-sign-in-alt"></i> Back to Login
        </a>
      </div>
    </div>
  `,
  styles: [`
    .unauth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f4f6f9; }
    .unauth-card { background: #fff; border-radius: 16px; padding: 48px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .unauth-card i { font-size: 56px; color: #e74c3c; margin-bottom: 16px; }
    .unauth-card h2 { font-size: 24px; font-weight: 700; color: #2c3e50; margin-bottom: 8px; }
    .unauth-card p { color: #888; margin-bottom: 24px; }
  `]
})
export class UnauthorizedComponent {}
