import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Dealer, DealerRequest } from '../models/dealer.model';
import { ApiResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class DealerService {
  private url = `${environment.apiUrl}/dealers`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Dealer[]>> {
    return this.http.get<ApiResponse<Dealer[]>>(this.url);
  }
  getById(id: number): Observable<ApiResponse<Dealer>> {
    return this.http.get<ApiResponse<Dealer>>(`${this.url}/${id}`);
  }
  create(data: DealerRequest): Observable<ApiResponse<Dealer>> {
    return this.http.post<ApiResponse<Dealer>>(this.url, data);
  }
  update(id: number, data: DealerRequest): Observable<ApiResponse<Dealer>> {
    return this.http.put<ApiResponse<Dealer>>(`${this.url}/${id}`, data);
  }
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.url}/${id}`);
  }
}
