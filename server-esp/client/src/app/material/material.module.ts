import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

const components = [
  MatButtonToggleModule,
];


@NgModule({
  imports: [
    CommonModule,
    ...components,
  ],
  exports: components,
})
export class MaterialModule {}
