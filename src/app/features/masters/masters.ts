import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material/material-module';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddProductDialog } from './add-product-dialog/add-product-dialog';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-masters',
  imports: [FormsModule, CommonModule, MATERIAL_MODULES],
  templateUrl: './masters.html',
  styleUrl: './masters.scss',
  standalone: true
})
export class Masters implements OnInit {
  private dialog = inject(MatDialog);
  private productService = inject(ProductService);
  private snackBar = inject(MatSnackBar);

  searchText = '';

  // ✅ MatTableDataSource replaces BehaviorSubject + combineLatest entirely
  // It has built-in filter and sort — no manual stream wiring needed
  dataSource = new MatTableDataSource<Product>([]);

  displayedColumns = [
    'productCode', 'productDescription', 'priceInclGST',
    'gstPercent', 'caseQuantity', 'hsnCode', 'action'
  ];

  // ✅ setter pattern ensures sort is linked even after tab switch
  // because mat-tab lazily renders content — ViewChild may be undefined
  // on ngOnInit if the tab isn't active yet
  @ViewChild(MatSort) set sort(s: MatSort) {
    if (s) this.dataSource.sort = s;
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts() {
    this.productService.getAll().subscribe({
      next: (data) => this.dataSource.data = data,
      error: (error) => this.handleApiError(error, 'load')
    });
  }

  onSearch() {
    // ✅ MatTableDataSource filters across all columns automatically
    this.dataSource.filter = this.searchText.trim().toLowerCase();
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

      if (product) {
        this.editProduct({ ...result, productId: product.productId });
      } else {
        this.addProduct(result);
      }
    });
  }

  private addProduct(product: Product) {
    this.productService.create(product).subscribe({
      next: (created) => {
        this.dataSource.data = [...this.dataSource.data, created];
        this.notify('Product added successfully', 'success');
      },
      error: (error) => this.handleApiError(error, 'add')
    });
  }

  private editProduct(product: Product) {
    this.productService.update(product).subscribe({
      next: (updated) => {
        this.dataSource.data = this.dataSource.data.map(p =>
          p.productId === updated.productId ? updated : p
        );
        this.notify('Product updated successfully', 'success');
      },
      error: (error) => this.handleApiError(error, 'update')
    });
  }

  deleteProduct(productId: number) {
    if (!confirm('Delete this product?')) return;

    this.productService.delete(productId).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter(p => p.productId !== productId);
        this.notify('Product deleted', 'success');
      },
      error: (error) => this.handleApiError(error, 'delete')
    });
  }

  // ✅ Centralised error handler — reads the HTTP status and picks the right message
  private handleApiError(err: any, operation: 'add' | 'update' | 'delete' | 'load') {
    if (err.status === 409) {
      // Backend told us exactly what the duplicate is
      const message = err.error?.message ?? 'A product with this code already exists.';
      this.notify(message, 'error');
      return;
    }

    if (err.status === 404) {
      this.notify('Product not found. It may have been deleted.', 'error');
      return;
    }

    // Fallback for 500 or network errors
    this.notify(`Failed to ${operation} product. Please try again.`, 'error');
  }

  private notify(
    message: string,
    type: 'success' | 'warning' | 'error' = 'success'
  ): void {

    const panelClass = {
      success: 'snack-success',
      warning: 'snack-warning',
      error: 'snack-error'
    };

    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: panelClass[type]
    });
  }
}
