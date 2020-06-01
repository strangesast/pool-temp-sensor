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
          acc[key] = [...acc[key], [record.date, record.value]];
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

    const x = d3.scaleTime().range([0, width]);

    const y = d3.scaleLinear()
        .domain([58, 64])
        .range([height, 0]);

    const line = d3.line()
        .x(d => x(d[0]))
        .y(d => y(d[1]));

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('defs').append('clipPath')
      .attr('id', 'clip')
    .append('rect')
      .attr('width', width)
      .attr('height', height);

    const sel = g.append('g')
      .attr('clip-path', 'url(#clip)');

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
    function tick() {
      const now = new Date();
      const domain = [d3.timeMinute.offset(now, -1), now];
      x.domain(domain);

      const [ymin, ymax] = (d3.extent(Object.values(component.currentData)
        .reduce((a: any[], b: any[]) => a.concat(b)) as any, (v: any) => v[1]) as any[]);
      y.domain([ymin - 1, ymax + 1]);

      sel.selectAll('path').data(Object.entries(component.currentData), d => d[0]).join(
        enter => enter.append('path').attr('stroke', 'black').attr('stroke-width', '1px').attr('fill', 'none')
      ).datum(d => {
        const datum = d[1];
        return datum;
      }).attr('d', line);
      // const data = [...component.currentData]ne;
      // if (data.length > 0) {
      //   data.push({...component.currentData[component.currentData.length - 1], date: now});
      // }

    }

    setInterval(tick, 500);
  }

}
