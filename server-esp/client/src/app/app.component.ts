import { Component } from '@angular/core';
import { scan, tap, map } from 'rxjs/operators';

import { TemperatureService } from './temperature.service';


@Component({
  selector: 'app-root',
  template: `
  <ng-container *ngIf="val$ | async as value">
    <div>
      <div class="grid">
        <span>IN</span>
        <span>{{value[1]?.toFixed(3)}}</span>
        <span>OUT</span>
        <span>{{value[0]?.toFixed(3)}}</span>
        <span>DIFF</span>
        <span>{{(value[0] - value[1]).toFixed(3)}}</span>
      </div>
    </div>
    <app-category-dial [a]="value[1]" [b]="value[0]"></app-category-dial>
    <div class="asof">
      <span>As of: {{ (asof$ | async | date:'medium') || 'null' }}</span>
    </div>
  </ng-container>
  <app-scrolling-graph [data]="value$"></app-scrolling-graph>
  <!--<pre *ngFor="let h of history$ | async">{{ h | json }}</pre>-->

  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  value$ = this.service.value$;
  asof$ = this.service.asof$;

  val$ = this.value$.pipe(
    map(value => [
      value['28790994970803ca']?.value,
      value['282b2694970e03b7']?.value,
    ]),
  );

  history$ = this.value$.pipe(
    scan((acc, value) => [value, ...acc].slice(0, 10), []),
  );

  constructor(public service: TemperatureService) {
    this.service.asof$.subscribe();
  }
}
