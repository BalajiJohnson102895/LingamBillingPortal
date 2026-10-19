// services/purchase.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Purchase, PurchaseSummary } from '../models/purchase.model';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private http = inject(HttpClient);
  private api = 'https://localhost:44340/api/purchase';

  create(purchase: Purchase): Observable<Purchase> {
    return this.http.post<Purchase>(this.api, purchase);
  }

  getById(id: number): Observable<Purchase> {
    return this.http.get<Purchase>(`${this.api}/${id}`);
  }

  getByNumber(number: string): Observable<Purchase> {
    return this.http.get<Purchase>(`${this.api}/by-number/${number}`);
  }

  getByDate(date: string): Observable<PurchaseSummary[]> {
    return this.http.get<PurchaseSummary[]>(`${this.api}/by-date/${date}`);
  }

  getCalendarDates(year: number, month: number): Observable<PurchaseSummary[]> {
    return this.http.get<PurchaseSummary[]>(`${this.api}/calendar/${year}/${month}`);
  }

  update(purchase: Purchase): Observable<Purchase> {
    return this.http.put<Purchase>(`${this.api}/${purchase.purchaseId}`, purchase);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  getAllPurchaseNumbers(): Observable<string[]> {
    return this.http.get<string[]>(`${this.api}/purchase-numbers`);
  }
}
