import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";
import { MATERIAL_MODULES } from '../../shared/material/material-module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-purchase',
  imports: [ RouterLink, MATERIAL_MODULES,CommonModule, FormsModule ],
  templateUrl: './purchase.html',
  styleUrl: './purchase.scss',
})
export class Purchase {
  filteredProducts:any[] = [];

  products = [
    { productId:1, itemCode:'A500', productName:'Arokya Standard milk 500ml pack', pricePerPiece:30, cgst:0, sgst:0 },
    { productId:2, itemCode:'TB100', productName:'Hatsun Table Butter 100grams', pricePerPiece:40, cgst:2.5, sgst:2.5 }
  ];

  purchaseItems = [
    this.createEmptyRow()
  ];

  createEmptyRow(){
    return {
      productId:null,
      itemCode:'',
      description:'',
      qtyCase:0,
      qtyPiece:0,
      gstCgstPercent:0,
      gstSgstPercent:0,
      gstCgstValue:0,
      gstSgstValue:0,
      pricePerPiece:0,
      total:0
    };
  }

  loadProducts(){
    this.filteredProducts = this.products;
  }

  selectProduct(product:any,row:any){
    row.productId = product.productId;
    row.itemCode = product.itemCode;
    row.description = product.productName;
    row.pricePerPiece = product.pricePerPiece;
    row.gstCgstPercent = product.cgst;
    row.gstSgstPercent = product.sgst;
    this.calculateRow(row);
  }

  calculateRow(row:any){
    let totalPieces = (row.qtyCase * 30) + row.qtyPiece;

    let basic = totalPieces * row.pricePerPiece;

    row.gstCgstValue = (basic * row.gstCgstPercent)/100;
    row.gstSgstValue = (basic * row.gstSgstPercent)/100;

    row.total = basic + row.gstCgstValue + row.gstSgstValue;
  }


  addRow(){
    this.purchaseItems.push(this.createEmptyRow());
  }

  removeRow(index:number){
    this.purchaseItems.splice(index,1);
  }
}
