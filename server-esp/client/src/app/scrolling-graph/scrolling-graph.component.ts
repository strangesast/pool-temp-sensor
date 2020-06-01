import { SimpleChanges, Input, ViewChild, ElementRef, AfterViewInit, Component, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { ReplaySubject, Subject, Observable } from 'rxjs';
import { scan, tap, takeUntil, switchMap } from 'rxjs/operators';
import * as d3 from 'd3';

interface Record {
  addr: string;
  date: Date;
  sample: string;
  value: number;
}

@Component({
  selector: 'app-scrolling-graph',
  template: `<svg #svg></svg>`,
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

  constructor() { }

  currentData = {} as any;

  @Input()
  data: Observable<any>;

  sub$ = new ReplaySubject<Observable<Record>>(1);
  destroyed$ = new Subject();

  ngOnInit() {
    this.sub$.pipe(
      switchMap(ob => ob),
      takeUntil(this.destroyed$),
      scan((acc, records) => {
        for (const [key, record] of Object.entries(records)) {
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key] = [...acc[key], [record.date, record.value]].filter(v => v[0] > this.xScale.domain()[0]);
        }
        return acc;
      }, []),
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
    this.yScale.range([height, 0]).domain([58, 64]);

    const line = d3.line()
        .x(d => this.xScale(d[0]))
        .y(d => this.yScale(d[1]));

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`).call(s =>
      s.append('defs').append('clipPath')
        .attr('id', 'clip')
      .append('rect')
        .attr('width', width)
        .attr('height', height))
      .attr('clip-path', 'url(#clip)');

    const interval = 2000;

    const sel = g.append('g');


    // .append('path')
    //   .datum(this.currentData)
    //   .attr('fill', 'none')
    //   .attr('stroke', 'black')
    //   .attr('stroke-width', '1px');

    // .transition()
    //   .duration(500)
    //   .ease(d3.easeLinear)
    //   .on('start', tick);

    // const interp = d3.curveStep();

    const component = this;

    let now = new Date();
    const calc = () => this.xScale(now) - this.xScale(d3.timeMillisecond.offset(now, interval));

    sel.attr('transform', null)
      .transition()
      .duration(interval)
      .ease(d3.easeLinear)
      .on('start', tick);

    function tick() {
      now = new Date();
      const domain = [d3.timeMinute.offset(now, -1), now];
      component.xScale.domain(domain);

      const [ymin, ymax] = (d3.extent(Object.values(component.currentData)
        .reduce((a: any[], b: any[]) => a.concat(b), []) as any, (v: any) => v[1]) as any[]);

      component.yScale.domain([ymin - 1, ymax + 1]);

      const dx = calc();

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
