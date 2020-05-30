import { Component } from '@angular/core';
import { map } from 'rxjs/operators';

import { TemperatureService } from './temperature.service';


@Component({
  selector: 'app-root',
  template: `
  <ng-container *ngIf="val$ | async as value">
    <div>
      <div class="grid">
        <span>OUT</span>
        <span>{{value[0].toFixed(3)}}</span>
        <span>IN</span>
        <span>{{value[1].toFixed(3)}}</span>
      </div>
    </div>
    <app-category-dial [a]="value[0]" [b]="value[1]"></app-category-dial>
  </ng-container>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  value$ = this.service.value$;

  val$ = this.value$.pipe(
    map(value => {
      return [value['0'].value, value['1'].value];
    }),
  );

  constructor(public service: TemperatureService) {}
}
