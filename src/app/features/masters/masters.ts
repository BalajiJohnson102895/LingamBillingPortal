import { Component, OnInit, inject } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material/material-module';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddProductDialog } from './add-product-dialog/add-product-dialog';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

// ✅ Removed: ChangeDetectorRef, Inject (capital I) — no longer needed
// ✅ Using inject() consistently instead of constructor injection mix

@Component({
  selector: 'app-masters',
  imports: [FormsModule, CommonModule, MATERIAL_MODULES],
  templateUrl: './masters.html',
  styleUrl: './masters.scss',
  standalone: true
})
export class Masters implements OnInit {

  // ✅ inject() is the modern Angular 14+ way — cleaner than constructor params
  private dialog = inject(MatDialog);
  private productService = inject(ProductService);

  searchText = '';
  priceSortAsc = true;

  // ✅ BehaviorSubject holds the live product list locally.
  // Using a Subject instead of a plain array means any change to it
  // automatically propagates to filteredProducts$ without manual refreshTable() calls.
  // Starts empty — gets populated once the API responds.
  private productsSubject = new BehaviorSubject<Product[]>([]);

  // ✅ BehaviorSubject for search text — emits whenever the user types.
  // Starting with '' means the full list shows before any search.
  private searchSubject = new BehaviorSubject<string>('');

  // ✅ BehaviorSubject for sort direction — emits when user clicks price header.
  private sortSubject = new BehaviorSubject<boolean>(true); // true = ascending

  // ✅ filteredProducts$ is a derived stream — it reacts automatically whenever
  // products, search text, or sort direction changes. No manual refresh needed.
  // combineLatest waits for ALL three streams to emit at least once, then re-runs
  // the map() function whenever any of them emit a new value.
  filteredProducts$!: Observable<Product[]>;

  ngOnInit(): void {
    // ✅ Fetch once from API and push into the subject.
    // All downstream observables (filteredProducts$) react automatically.
    this.productService.getAll().subscribe({
      next: (data) => this.productsSubject.next(data),
      error: (err) => console.error('Failed to load products', err)
    });

    // ✅ Declare the derived stream — combining products + search + sort.
    // This replaces filterProducts(), refreshTable(), and cdr.detectChanges().
    this.filteredProducts$ = combineLatest([
      this.productsSubject,
      this.searchSubject,
      this.sortSubject
    ]).pipe(
      map(([products, search, sortAsc]) => {
        // Step 1: filter by search text across code and description
        const filtered = products.filter(p =>
          p.productCode.toLowerCase().includes(search) ||
          p.productDescription.toLowerCase().includes(search)
        );

        // Step 2: sort by price
        return [...filtered].sort((a, b) =>
          sortAsc
            ? a.priceInclGST - b.priceInclGST
            : b.priceInclGST - a.priceInclGST
        );
      })
    );
  }

  // ✅ Just push the new search value — filteredProducts$ reacts automatically
  onSearch() {
    this.searchSubject.next(this.searchText.toLowerCase());
  }

  // ✅ Just toggle sort direction — filteredProducts$ reacts automatically
  sortByPrice() {
    this.priceSortAsc = !this.priceSortAsc;
    this.sortSubject.next(this.priceSortAsc);
  }

  openProductDialog(product: Product | null = null) {
    const dialogRef = this.dialog.open(AddProductDialog, {
      width: '550px',
      maxHeight: '95vh',
      disableClose: true,
      data: product
    });

    dialogRef.afterClosed().subscribe((result: Product) => {
      if (!result?.productCode) return;

      const current = this.productsSubject.getValue();

      if (product) {
        // ✅ Edit: when API is ready, call productService.update(result) here
        // and inside its next() callback do the productsSubject.next() below
        const updated = current.map(p =>
          p.productId === product.productId ? { ...result, productId: product.productId } : p
        );
        this.productsSubject.next(updated);
      } else {
        // ✅ Add: when API is ready, call productService.create(result) here
        // and use the returned product (with real DB id) instead of maxId trick
        const maxId = current.length > 0 ? Math.max(...current.map(p => p.productId)) : 0;
        this.productsSubject.next([...current, { ...result, productId: maxId + 1 }]);
      }
      // ✅ No refreshTable(), no cdr.detectChanges() — productsSubject.next()
      // triggers combineLatest which updates filteredProducts$ automatically
    });
  }

  deleteProduct(productId: number) {
    if (!confirm('Delete this product?')) return;

    // ✅ Delete: when API is ready, call productService.delete(productId) here
    // and do the filter inside its next() callback
    const updated = this.productsSubject.getValue().filter(p => p.productId !== productId);
    this.productsSubject.next(updated);
  }
}
