import { SimpleChanges, Input, ViewChild, ElementRef, AfterViewInit, Component, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { HttpParams, HttpClient } from '@angular/common/http';
import { concat, from, BehaviorSubject, ReplaySubject, Subject, Observable } from 'rxjs';
import { startWith, map, scan, tap, takeUntil, switchMap } from 'rxjs/operators';
import * as d3 from 'd3';

import { convertValue } from '../temperature.service';

interface Record {
  addr: string;
  date: Date;
  sample: string;
  value: number;
}

@Component({
  selector: 'app-scrolling-graph',
  template: `<svg width="100%" height="400px" #svg></svg>`,
  styleUrls: ['./scrolling-graph.component.scss']
})
export class ScrollingGraphComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('svg')
  svg: ElementRef;

  xScale = d3.scaleTime();
  yScale = d3.scaleLinear();

  @Input()
  from: Date;

  @Input()
  to: Date;


  currentData = {} as any;

  @Input()
  data: Observable<any>;

  sub$ = new ReplaySubject<Observable<Record>>(1);
  destroyed$ = new Subject();

  range$ = new BehaviorSubject((d) => d3.timeHour.offset(d, -1));

  @Input()
  range: (d: Date) => Date;

  constructor(public http: HttpClient) { }

  ngOnInit() {
    this.range$.pipe(
      switchMap(range => {
        const params = {from: range(new Date()).toISOString(), seconds: '4'};
        const req = this.http.get<{addr: string, value: number, date: Date}[]>('/api/data', {params});

        return req.pipe(
          switchMap(arr => {
            const init = arr.reduce((acc, record) => {
              if (acc[record.addr] == null) {
                acc[record.addr] = [];
              }
              const {date, value} = convertValue(record);
              date.setHours(date.getHours() - 4);
              acc[record.addr].unshift([date, value]);
              return acc;
            }, {});
            for (const value of Object.values(init)) {
            }
            return this.sub$.pipe(
              switchMap(ob => ob),
              scan((acc, records) => {
                for (const [key, record] of Object.entries(records)) {
                  if (!acc[key]) {
                    acc[key] = [];
                  }
                  acc[key] = [...acc[key], [record.date, record.value]]
                    .sort((a, b) => a[0] < b[0] ? -1 : 1)
                    .filter(v => v[0] > this.xScale.domain()[0]);
                }
                return acc;
              }, init),
            );
          }),
        );
      }),
      takeUntil(this.destroyed$),
    ).subscribe(values => {
      this.currentData = values;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('data' in changes) {
      const data = changes.data.currentValue;
      this.sub$.next(data);
    }
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngAfterViewInit() {
    const el = this.svg.nativeElement;
    const {width: outerWidth, height: outerHeight} = el.getBoundingClientRect();
    const svg = d3.select(el);

    const margin = {top: 20, left: 20, bottom: 20, right: 20};
    const width = outerWidth - margin.left - margin.right;
    const height = outerHeight - margin.top - margin.bottom;

    this.xScale.range([0, width]);
    this.yScale.range([height, 0]);

    const line = d3.line()
        .x(d => this.xScale(d[0]))
        .y(d => this.yScale(d[1]))
        .curve(d3.curveStep);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`).call(s =>
      s.append('defs').append('clipPath')
        .attr('id', 'clip')
      .append('rect')
        .attr('width', width)
        .attr('height', height))
      .attr('clip-path', 'url(#clip)');

    const interval = 2000;

    const sel = g.append('g');

    const component = this;

    let now = new Date();

    sel.attr('transform', null)
      .transition()
      .duration(interval)
      .ease(d3.easeLinear)
      .on('start', tick);

    function tick() {
      now = new Date();

      const domain = [component.range$.getValue()(now), now];

      component.xScale.domain(domain);

      const [ymin, ymax] = (d3.extent(Object.values(component.currentData)
        .reduce((a: any[], b: any[]) => a.concat(b), []) as any, (v: any) => v[1]) as any[]);

      component.yScale.domain([ymin - 1, ymax + 1]);

      const dx = component.xScale(now) - component.xScale(d3.timeMillisecond.offset(now, interval));

      sel.selectAll('path')
        .data(Object.entries(component.currentData), d => d[0])
        .join(enter => enter.append('path')
          .attr('stroke', 'black')
          .attr('stroke-width', '1px')
          .attr('fill', 'none')
        )
        .datum(d => {
          let datum = d[1] as any[];
          if (datum.length > 0) {
            datum = [...datum, [component.xScale.invert(width - dx), datum[datum.length - 1][1]]];
          }
          return datum;
        })
        .attr('d', line);

      sel.attr('transform', null);

      d3.active(this).attr('transform', `translate(${dx},0)`).transition().on('start', tick);

      // const data = [...component.currentData]ne;
      // if (data.length > 0) {
      //   data.push({...component.currentData[component.currentData.length - 1], date: now});
      // }
    }
    // setInterval(tick, interval);
  }

}
