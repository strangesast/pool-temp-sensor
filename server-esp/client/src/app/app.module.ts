import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CategoryDialComponent } from './category-dial/category-dial.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ScrollingGraphComponent } from './scrolling-graph/scrolling-graph.component';

@NgModule({
  declarations: [
    AppComponent,
    CategoryDialComponent,
    ScrollingGraphComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
