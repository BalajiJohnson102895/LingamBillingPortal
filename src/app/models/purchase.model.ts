// models/purchase.model.ts
export interface PurchaseItem {
  purchaseItemId?: number;
  purchaseId?: number;
  productId: number | null;
  productCode: string;
  productDescription: string;
  qtyCase: number;
  qtyPiece: number;
  totalPieces: number;
  pricePerPiece: number;
  gstPercent: number;
  cgstValue: number;
  sgstValue: number;
  basicAmount: number;
  total: number;
  remarks: string;
  selected: boolean; // UI only — for checkbox deletion
}

export interface Purchase {
  purchaseId?: number;
  purchaseNumber?: string;
  purchaseDate: string;
  supplierName: string;
  totalAmount: number;
  totalGST: number;
  netAmount: number;
  financialYear?: string;
  items: PurchaseItem[];
}

export interface PurchaseSummary {
  purchaseId: number;
  purchaseNumber: string;
  purchaseDate: string;
  supplierName: string;
  netAmount: number;
}
