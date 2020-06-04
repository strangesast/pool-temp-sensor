import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


const components = [
  MatButtonToggleModule,
  MatProgressSpinnerModule,
];


@NgModule({
  imports: [
    CommonModule,
    ...components,
  ],
  exports: components,
})
export class MaterialModule {}
