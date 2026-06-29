import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:44340/api/product';

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl + '/GetAll');
  }
}
