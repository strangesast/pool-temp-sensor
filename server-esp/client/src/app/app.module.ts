import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MaterialModule } from './material/material.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CategoryDialComponent } from './category-dial/category-dial.component';
import { ScrollingGraphComponent } from './scrolling-graph/scrolling-graph.component';
import { V2Component } from './v2/v2.component';

@NgModule({
  declarations: [
    AppComponent,
    CategoryDialComponent,
    ScrollingGraphComponent,
    V2Component
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MaterialModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
