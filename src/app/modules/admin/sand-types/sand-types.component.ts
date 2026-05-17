import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/auth.model';

interface SandType { id: number; name: string; pricePerTon: number; }

@Component({
  selector: 'app-sand-types',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sand-types.component.html',
  styleUrls: ['./sand-types.component.css']
})
export class SandTypesComponent implements OnInit {
  sandTypes: SandType[] = [];
  loading = true;
  showModal = false;
  isEdit = false;
  editId: number | null = null;
  successMsg = '';
  errorMsg = '';
  form = { name: '', pricePerTon: 0 };
  private url = `${environment.apiUrl}/sand-types`;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.http.get<ApiResponse<SandType[]>>(this.url).subscribe({
      next: (res) => { this.sandTypes = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openAdd() { this.isEdit = false; this.editId = null; this.form = { name: '', pricePerTon: 0 }; this.showModal = true; this.errorMsg = ''; }

  openEdit(s: SandType) {
    this.isEdit = true; this.editId = s.id;
    this.form = { name: s.name, pricePerTon: s.pricePerTon };
    this.showModal = true; this.errorMsg = '';
  }

  save() {
    const obs = this.isEdit && this.editId
      ? this.http.put<ApiResponse<SandType>>(`${this.url}/${this.editId}`, this.form)
      : this.http.post<ApiResponse<SandType>>(this.url, this.form);
    obs.subscribe({
      next: () => { this.showModal = false; this.successMsg = this.isEdit ? 'Updated' : 'Added'; setTimeout(() => this.successMsg = '', 3000); this.load(); },
      error: (err) => { this.errorMsg = err.error?.message || 'Failed'; }
    });
  }

  delete(id: number) {
    if (confirm('Delete this sand type?')) {
      this.http.delete<ApiResponse<void>>(`${this.url}/${id}`).subscribe({
        next: () => { this.successMsg = 'Deleted'; setTimeout(() => this.successMsg = '', 3000); this.load(); },
        error: (err) => { this.errorMsg = err.error?.message || 'Delete failed'; setTimeout(() => this.errorMsg = '', 3000); }
      });
    }
  }
}
