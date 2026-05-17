import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, ApiResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/auth/login`, request).pipe(
      tap(res => {
        if (res.success) {
          localStorage.setItem('token',    res.data.token);
          localStorage.setItem('username', res.data.username);
          localStorage.setItem('role',     res.data.role);
          localStorage.setItem('userId',   String(res.data.userId));
          if (res.data.linkedId) {
            localStorage.setItem('linkedId', String(res.data.linkedId));
          }
        }
      })
    );
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  getUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? Number(id) : null;
  }

  getLinkedId(): number | null {
    const id = localStorage.getItem('linkedId');
    return id ? Number(id) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  isDriver(): boolean {
    return this.getRole() === 'DRIVER';
  }

  isDealer(): boolean {
    return this.getRole() === 'DEALER';
  }
}
