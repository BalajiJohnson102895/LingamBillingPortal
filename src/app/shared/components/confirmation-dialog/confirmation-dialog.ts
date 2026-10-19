import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL_MODULES } from '../../material/material-module';

// ✅ Exported so any component can import and use it for typing
export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;  // optional — falls back to 'Confirm' if not passed
  cancelText?: string;   // optional — falls back to 'Cancel' if not passed
  type?: 'danger' | 'warning' | 'info'; // optional — controls confirm button color
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [MATERIAL_MODULES],
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.scss'
})
export class ConfirmationDialog {
  dialogRef = inject(MatDialogRef<ConfirmationDialog>);
  data: ConfirmDialogData = inject(MAT_DIALOG_DATA);

  // ✅ Maps type to Angular Material button color
  get confirmColor(): string {
    switch (this.data.type) {
      case 'danger':  return 'warn';    // red  — delete
      case 'warning': return 'accent';  // amber — discard changes
      case 'info':    return 'primary'; // blue  — general confirm
      default:        return 'warn';    // red as default
    }
  }
}
