import { Component, inject, Inject } from '@angular/core';
import { MATERIAL_MODULES } from '../../../shared/material/material-module';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog, ConfirmDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-add-product-dialog',
  imports: [CommonModule, ReactiveFormsModule, MATERIAL_MODULES],
  templateUrl: './add-product-dialog.html',
  styleUrl: './add-product-dialog.scss',
})
export class AddProductDialog {
  productForm!: FormGroup;
  private dialog = inject(MatDialog);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddProductDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.createForm();

    if (data) {
      this.productForm.patchValue(data);
    }
  }

  createForm() {
    this.productForm = this.fb.group({
      productCode: ['', Validators.required],
      productDescription: [''],
      priceInclGST: [0, Validators.required],
      gstPercent: [0],
      caseQuantity: [0],
      hsnCode: ['']
    });
  }

  saveProduct() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.productForm.value);
  }

  cancelDialog() {
    if (!this.productForm.dirty) {
      // ✅ Nothing changed — close immediately, no confirmation needed
      this.dialogRef.close(null);
      return;
    }

    // ✅ Form was touched — ask before discarding
    this.dialog.open(ConfirmationDialog, {
      width: '380px',
      data: {
        title: 'Discard Changes',
        message: 'You have unsaved changes. Are you sure you want to cancel?',
        confirmText: 'Discard',
        cancelText: 'Keep Editing'
      } as ConfirmDialogData
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) this.dialogRef.close(null);
    });
  }
}
