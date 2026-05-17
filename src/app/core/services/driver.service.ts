import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Driver, DriverRequest } from '../models/driver.model';
import { ApiResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class DriverService {
  private url = `${environment.apiUrl}/drivers`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Driver[]>> {
    return this.http.get<ApiResponse<Driver[]>>(this.url);
  }
  getById(id: number): Observable<ApiResponse<Driver>> {
    return this.http.get<ApiResponse<Driver>>(`${this.url}/${id}`);
  }
  create(data: DriverRequest): Observable<ApiResponse<Driver>> {
    return this.http.post<ApiResponse<Driver>>(this.url, data);
  }
  update(id: number, data: DriverRequest): Observable<ApiResponse<Driver>> {
    return this.http.put<ApiResponse<Driver>>(`${this.url}/${id}`, data);
  }
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.url}/${id}`);
  }
}
