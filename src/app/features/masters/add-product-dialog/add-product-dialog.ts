import { Component, Inject } from '@angular/core';
import { MATERIAL_MODULES } from '../../../shared/material/material-module';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-add-product-dialog',
  imports: [CommonModule, ReactiveFormsModule, MATERIAL_MODULES],
  templateUrl: './add-product-dialog.html',
  styleUrl: './add-product-dialog.scss',
})
export class AddProductDialog {
  productForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddProductDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog
  ) {
    this.createForm();

    if (data) {
      this.productForm.patchValue(data);
    }
  }

  createForm() {
    this.productForm = this.fb.group({
      productCode: ['', Validators.required],
      productShortName: ['', Validators.required],
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

    if (this.productForm.dirty && this.productForm.valid) {

      const yes = confirm('Do you want to save the existing product?');

      if (yes) {
        this.saveProduct();
        return;
      }
    }

    this.dialogRef.close(null);
  }
}
