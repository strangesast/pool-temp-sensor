import { OnDestroy, ViewChild, ElementRef, Input, SimpleChanges, OnChanges, AfterViewInit, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReplaySubject, Subject } from 'rxjs';
import { finalize, takeUntil, withLatestFrom, switchMap, tap, map } from 'rxjs/operators';
import * as d3 from 'd3';
import { Selection } from 'd3';

enum Mode {
  minute = 'minute',
  hour = 'hour',
  day = 'day'
}

@Component({
  selector: 'app-v2',
  template: `
    <svg #svg></svg>
    <div *ngIf='loading'><mat-spinner></mat-spinner></div>
  `,
  styleUrls: ['./v2.component.scss']
})
export class V2Component implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('svg')
  el: ElementRef;

  loading = true;

  svg: Selection<SVGElement, {}, any, any>;
  yScale = d3.scaleLinear();
  xScale = d3.scaleTime();
  xAxis;
  yAxis;
  line = d3.line()
    .x(d => this.xScale(d[0]))
    .y(d => this.yScale(d[1]))
    .curve(d3.curveStep);
  margin = {top: 20, left: 40, bottom: 20, right: 20};

  @Input()
  mode = Mode.minute;

  lastData: {[key: string]: any[]};

  mode$ = new ReplaySubject<Mode>(1);
  destroyed$ = new Subject();

  constructor(public http: HttpClient) {}

  ngOnInit(): void {
    const range$ = this.mode$.pipe(
      map(mode => {
        const lt = new Date();
        const gt = new Date(lt);
        switch (mode) {
          case Mode.minute:
            gt.setMinutes(gt.getMinutes() - 1);
            break;
          case Mode.hour:
            gt.setHours(gt.getHours() - 1);
            break;
          case Mode.day:
            gt.setDate(gt.getDate() - 1);
            break;
        }
        return [gt, lt];
      }),
    );
    const data$ = range$.pipe(
      switchMap(([gt, lt]) => {
        this.loading = true;
        const res = Math.floor((+lt - +gt) / 60000).toString();
        const params = {res, gt: gt.toISOString()};
        return this.http.get<{[key: string]: any[]}>('/api/data', {params}).pipe(
          tap(data => {
            this.lastData = data;
          }),
          finalize(() => {
            this.loading = false;
          }),
        );
      }),
    );

    data$.pipe(withLatestFrom(range$)).pipe(
      tap(([data, range]) => {
        this.xScale.domain(range);
        const [ymin, ymax] = d3.extent(Object.values(data).reduce((a, b) => a.concat(b), []), d => d.avg);
        this.yScale.domain([ymin - 1, ymax + 1]);
        this.draw(data);
      }),
    ).subscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('mode' in changes) {
      this.mode$.next(changes.mode.currentValue);
    }
  }

  ngAfterViewInit() {
    const {nativeElement} = this.el;
    this.svg = d3.select(nativeElement);
    const {width, height} = nativeElement.getBoundingClientRect();
    const {top, right, bottom, left} = this.margin;
    this.xAxis = (g) => g
      .attr('transform', `translate(0,${height - this.margin.bottom})`)
      .call(d3.axisBottom(this.xScale).ticks(width / 80).tickSizeOuter(0));
    this.yAxis = g => g
      .attr('transform', `translate(${this.margin.left},0)`)
      .call(d3.axisLeft(this.yScale))
      .call(gg => gg.select('.domain').remove());

    this.svg.append('g').attr('class', 'x-axis');
    this.svg.append('g').attr('class', 'y-axis');
    this.svg.append('g').attr('class', 'data');

    this.xScale.range([left, width - right]);
    this.yScale.range([height - bottom, top]);
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  draw(data: {[key: string]: {avg: number, interval: string, addr: string}[]}) {
    this.svg.select('.x-axis').call(this.xAxis);
    this.svg.select('.y-axis').call(this.yAxis);
    this.svg.select('.data').selectAll('path').data(Object.entries(data), d => d[0]).join(
      enter => enter.append('path')
        .attr('stroke', 'black')
        .attr('stroke-width', '1px')
        .attr('fill', 'none')
    )
    .datum(d => d[1].map(({avg, interval}) => {
      const date = new Date(interval);
      return [date, avg];
    }))
    .attr('d', this.line);
  }

  hover(svg, path) {
    //   if ('ontouchstart' in document) svg
    //       .style('-webkit-tap-highlight-color', 'transparent')
    //       .on('touchmove', moved)
    //       .on('touchstart', entered)
    //       .on('touchend', left)
    //   else svg
    //       .on('mousemove', moved)
    //       .on('mouseenter', entered)
    //       .on('mouseleave', left);
    //
    const dot = svg.append('g')
        .attr('display', 'none');

    dot.append('circle')
        .attr('r', 2.5);

    dot.append('text')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 10)
        .attr('text-anchor', 'middle')
        .attr('y', -8);

    const {xScale, yScale} = this;

    /*
    function moved() {
      d3.event.preventDefault();
      const mouse = d3.mouse(this);
      const xm = xScale.invert(mouse[0]);
      const ym = yScale.invert(mouse[1]);
      const i1 = d3.bisectLeft(data.dates, xm, 1);
      const i0 = i1 - 1;
      const i = xm - data.dates[i0] > data.dates[i1] - xm ? i1 : i0;
      const s = d3.least(data.series, d => Math.abs(d.values[i] - ym));
      path.attr('stroke', d => d === s ? null : '#ddd').filter(d => d === s).raise();
      dot.attr('transform', `translate(${x(data.dates[i])},${y(s.values[i])})`);
      dot.select('text').text(s.name);
    }
    */

    function entered() {
      path.style('mix-blend-mode', null).attr('stroke', '#ddd');
      dot.attr('display', null);
    }

    function left() {
      path.style('mix-blend-mode', 'multiply').attr('stroke', null);
      dot.attr('display', 'none');
    }
  }

}
