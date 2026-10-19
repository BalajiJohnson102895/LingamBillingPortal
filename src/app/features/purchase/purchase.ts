import { Component, OnInit, ViewChildren, QueryList, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MATERIAL_MODULES } from '../../shared/material/material-module';
import { ProductService } from '../../services/product.service';
import { PurchaseService } from '../../services/purchase.service';
import { Product } from '../../models/product.model';
import { Purchase, PurchaseItem, PurchaseSummary } from '../../models/purchase.model';
import { ConfirmationDialog, ConfirmDialogData } from '../../shared/components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MATERIAL_MODULES],
  templateUrl: './purchase.html',
  styleUrl: './purchase.scss'
})
export class PurchaseComponent implements OnInit {
  private productService = inject(ProductService);
  private purchaseService = inject(PurchaseService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // ── State ────────────────────────────────────────────────
  activeTabIndex = 0;
  purchaseNumber = '';         // for jump-to-purchase input
  supplierName = 'Hatsun';     // fixed — single-supplier business, no longer user-editable
  purchaseDate: Date = new Date();
  currentPurchaseId: number | null = null;

  // ── Product autocomplete ─────────────────────────────────
  allProducts: Product[] = [];
  // per-row filtered lists keyed by row index
  filteredByCode: Map<number, Product[]> = new Map();
  filteredByDesc: Map<number, Product[]> = new Map();

  // ── Purchase number autocomplete ─────────────────────────
  allPurchaseNumbers: string[] = [];
  filteredPurchaseNumbers: string[] = [];

  // ── Editable table ───────────────────────────────────────
  // 'select' and 'actions' columns removed: rows are managed automatically —
  // a trailing blank row is always kept, and rows with no quantity are
  // silently ignored on save (see savePurchase()).
  displayedColumns = [
    'sno', 'productCode', 'productDescription',
    'qtyCase', 'qtyPiece', 'totalPieces', 'pricePerPiece', 'gstPercent',
    'cgstValue', 'sgstValue', 'total', 'remarks'
  ];


  dataSource = new MatTableDataSource<PurchaseItem>([]);

  // Focus management: lets us jump the cursor straight into the Case
  // column right after a product is picked from the Code/Description dropdown.
  @ViewChildren('caseInput') caseInputs!: QueryList<ElementRef<HTMLInputElement>>;

  // Focus management: lets Enter (pressed in Case or Piece) jump straight
  // to the next row's Code column, for fast keyboard-only line entry.
  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef<HTMLInputElement>>;

  // ── Calendar / Summary tab ───────────────────────────────
  selectedDate: Date = new Date();
  purchasesOnDate: PurchaseSummary[] = [];
  datesWithPurchases: Set<string> = new Set(); // ISO strings for highlighting

  ngOnInit(): void {
    this.productService.getAll().subscribe({
      next: (data) => this.allProducts = data
    });
    // TODO: add `getAllPurchaseNumbers(): Observable<string[]>` to PurchaseService
    // (and a matching backend endpoint) that returns every existing purchase
    // number, e.g. GET /api/purchases/numbers -> string[]
    this.purchaseService.getAllPurchaseNumbers().subscribe({
      next: (list) => {
        this.allPurchaseNumbers = list;
        this.filteredPurchaseNumbers = list;
      }
    });
    this.loadCalendarMonth(new Date());
    this.addRow(); // start with one empty row
  }

  // ── Helpers ──────────────────────────────────────────────
  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  createEmptyRow(): PurchaseItem {
    return {
      productId: null, productCode: '', productDescription: '',
      qtyCase: 0, qtyPiece: 0, totalPieces: 0,
      pricePerPiece: 0, gstPercent: 0,
      cgstValue: 0, sgstValue: 0, basicAmount: 0,
      total: 0, remarks: '', selected: false
    };
  }

  addRow(): void {
    this.dataSource.data = [...this.dataSource.data, this.createEmptyRow()];
  }

  /** Focuses the Case (qtyCase) input for the given row index, once Angular
   *  has finished re-rendering the table (setTimeout defers past this tick). */
  private suppressCaseAdvanceUntil = 0;

private focusCaseInput(rowIndex: number): void {
  this.suppressCaseAdvanceUntil = Date.now() + 150;
  setTimeout(() => {
    const el = this.caseInputs?.toArray()[rowIndex]?.nativeElement;
    el?.focus();
    el?.select();
  });
}

onCaseEnter(rowIndex: number): void {
  if (Date.now() < this.suppressCaseAdvanceUntil) return; // stray Enter from product selection — ignore
  this.focusNextRowCode(rowIndex);
}

  /** Enter pressed in Case or Piece: jump straight to next row's Code field,
   *  skipping the remaining (usually untouched) cells in the current row.
   *  Adds a fresh trailing row first if this was already the last one. */
  focusNextRowCode(rowIndex: number): void {
    const rows = this.dataSource.data;
    if (rowIndex === rows.length - 1) {
      this.addRow();
    }
    setTimeout(() => {
      const el = this.codeInputs?.toArray()[rowIndex + 1]?.nativeElement;
      el?.focus();
      el?.select();
    });
  }

  // ── Autocomplete: products ───────────────────────────────
  filterByCode(value: string, rowIndex: number): void {
    const txt = value.toLowerCase();
    this.filteredByCode.set(rowIndex,
      this.allProducts.filter(p =>
        p.productCode.toLowerCase().includes(txt) ||
        p.productDescription.toLowerCase().includes(txt)
      )
    );
  }

  filterByDesc(value: string, rowIndex: number): void {
    const txt = value.toLowerCase();
    this.filteredByDesc.set(rowIndex,
      this.allProducts.filter(p =>
        p.productDescription.toLowerCase().includes(txt)
      )
    );
  }

  selectProduct(product: Product, row: PurchaseItem, rowIndex: number): void {
    row.productId    = product.productId;
    row.productCode  = product.productCode;
    row.productDescription = product.productDescription;
    row.pricePerPiece = product.priceInclGST;
    row.gstPercent   = product.gstPercent;
    this.filteredByCode.delete(rowIndex);
    this.filteredByDesc.delete(rowIndex);
    this.calculateRow(row);

    // Auto-add a new trailing row when the last row gets a product selected,
    // so there is always exactly one blank row ready at the end.
    const rows = this.dataSource.data;
    if (rowIndex === rows.length - 1) this.addRow();

    // Move the cursor straight into Case so the user can type quantity immediately.
    this.focusCaseInput(rowIndex);
  }

  // ── Autocomplete: purchase number ────────────────────────
  filterPurchaseNumbers(value: string): void {
    const txt = (value ?? '').toLowerCase();
    this.filteredPurchaseNumbers = this.allPurchaseNumbers.filter(n =>
      n.toLowerCase().includes(txt)
    );
  }

  onPurchaseNumberSelected(num: string): void {
    this.purchaseNumber = num;
    this.jumpToPurchase();
  }

  // ── Calculations ─────────────────────────────────────────
  calculateRow(row: PurchaseItem): void {
    // CaseQuantity from product master drives the multiplier
    const product = this.allProducts.find(p => p.productId === row.productId);
    const caseQty = product?.caseQuantity ?? 1;

    row.totalPieces = (row.qtyCase * caseQty) + row.qtyPiece;
    row.basicAmount = row.totalPieces * row.pricePerPiece;

    const halfGst   = row.gstPercent / 2;
    row.cgstValue   = parseFloat(((row.basicAmount * halfGst) / 100).toFixed(2));
    row.sgstValue   = parseFloat(((row.basicAmount * halfGst) / 100).toFixed(2));
    row.total       = parseFloat((row.basicAmount + row.cgstValue + row.sgstValue).toFixed(2));

    this.dataSource.data = [...this.dataSource.data]; // trigger table refresh
  }

  get grandTotal(): number {
    return parseFloat(
      this.dataSource.data.reduce((s, r) => s + r.total, 0).toFixed(2)
    );
  }

  get grandGST(): number {
    return parseFloat(
      this.dataSource.data.reduce((s, r) => s + r.cgstValue + r.sgstValue, 0).toFixed(2)
    );
  }

  // ── Save / New / Delete ──────────────────────────────────
  savePurchase(): void {
    // Rows with no product selected, or no quantity entered, are silently
    // dropped here — the trailing blank row (and any accidental empty
    // entries) never need manual removal.
    const validItems = this.dataSource.data.filter(r => r.productId && r.totalPieces > 0);
    if (!validItems.length) {
      this.notify('Add at least one item with quantity', 'error');
      return;
    }

    const purchase: Purchase = {
      purchaseId: this.currentPurchaseId ?? undefined,
      purchaseDate: this.toIsoDate(this.purchaseDate),
      supplierName: this.supplierName,
      totalAmount: validItems.reduce((s, r) => s + r.basicAmount, 0),
      totalGST: this.grandGST,
      netAmount: this.grandTotal,
      items: validItems
    };

    const op$ = this.currentPurchaseId
      ? this.purchaseService.update(purchase)
      : this.purchaseService.create(purchase);

    op$.subscribe({
      next: (saved) => {
        this.currentPurchaseId = saved.purchaseId!;
        this.purchaseNumber = saved.purchaseNumber!;
        if (!this.allPurchaseNumbers.includes(saved.purchaseNumber!)) {
          this.allPurchaseNumbers = [...this.allPurchaseNumbers, saved.purchaseNumber!];
        }
        this.notify(`Purchase ${saved.purchaseNumber} saved successfully`);
        this.loadCalendarMonth(this.purchaseDate);
      },
      error: () => this.notify('Failed to save purchase', 'error')
    });
  }

  newPurchase(): void {
    this.currentPurchaseId = null;
    this.purchaseNumber = '';
    this.purchaseDate = new Date();
    this.dataSource.data = [];
    this.addRow();
  }

  deletePurchase(): void {
    if (!this.currentPurchaseId) return;

    this.dialog.open(ConfirmationDialog, {
      width: '380px',
      data: {
        title: 'Delete Purchase',
        message: `Delete purchase ${this.purchaseNumber}? This cannot be undone.`,
        confirmText: 'Delete', type: 'danger'
      } as ConfirmDialogData
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.purchaseService.delete(this.currentPurchaseId!).subscribe({
        next: () => {
          this.notify('Purchase deleted');
          this.newPurchase();
          this.loadCalendarMonth(this.purchaseDate);
        },
        error: () => this.notify('Failed to delete', 'error')
      });
    });
  }

  // ── Jump to purchase number ──────────────────────────────
  jumpToPurchase(): void {
    if (!this.purchaseNumber.trim()) return;

    this.purchaseService.getByNumber(this.purchaseNumber.trim()).subscribe({
      next: (p) => this.loadPurchaseIntoForm(p),
      error: () => this.notify(`Purchase ${this.purchaseNumber} not found`, 'error')
    });
  }

  // ── Calendar ─────────────────────────────────────────────
  loadCalendarMonth(date: Date): void {
    this.purchaseService.getCalendarDates(date.getFullYear(), date.getMonth() + 1)
      .subscribe({
        next: (list) => {
          this.datesWithPurchases = new Set(
            list.map(p => new Date(p.purchaseDate).toDateString())
          );
        }
      });
  }

  onMonthChanged(date: Date): void {
    this.loadCalendarMonth(date);
  }

  onDateSelected(date: Date | null): void {
    if (!date) return;
    this.selectedDate = date;
    const iso = date.toISOString().split('T')[0];

    this.purchaseService.getByDate(iso).subscribe({
      next: (list) => { this.purchasesOnDate = list; }
    });
  }

  loadPurchaseFromSummary(summary: PurchaseSummary): void {
    this.purchaseService.getById(summary.purchaseId).subscribe({
      next: (p) => {
        this.loadPurchaseIntoForm(p);
        this.activeTabIndex = 0; // switch to entry tab
      }
    });
  }

  private loadPurchaseIntoForm(p: Purchase): void {
    this.currentPurchaseId = p.purchaseId!;
    this.purchaseNumber = p.purchaseNumber!;
    this.purchaseDate = new Date(p.purchaseDate);
    this.dataSource.data = p.items.map(i => ({ ...i, selected: false }));
    this.addRow(); // trailing empty row for new additions
  }

  // ── Date highlighting ─────────────────────────────────────
  dateClass = (date: Date): string => {
    return this.datesWithPurchases.has(date.toDateString())
      ? 'has-purchase' : '';
  };

  hasPurchase(date: Date): boolean {
    return this.datesWithPurchases.has(date.toDateString());
  }

  private notify(msg: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(msg, 'Close', {
      duration: 3000,
      panelClass: type === 'error' ? 'snack-error' : 'snack-success'
    });
  }
}
export type { Purchase };
