import { ViewChild, ElementRef, AfterViewInit, Component, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-scrolling-graph',
  template: `<svg #svg></svg>`,
  styleUrls: ['./scrolling-graph.component.scss']
})
export class ScrollingGraphComponent implements OnInit, AfterViewInit {
  @ViewChild('svg')
  svg: ElementRef;

  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    const el = this.svg.nativeElement;
    const {width: outerWidth, height: outerHeight} = el.getBoundingClientRect();
    const svg = d3.select();

    const n = 40;
    const random = d3.randomNormal(0, .2);
    const data = d3.range(n).map(random);


    const margin = {top: 20, left: 20, bottom: 20, right: 20};
    const width = outerWidth - margin.left - margin.right;
    const height = outerHeight - margin.top - margin.bottom;

    const x = d3.scaleLinear()
        .domain([0, n - 1])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([-1, 1])
        .range([height, 0]);

    const line = d3.line()
        .x((d, i) => x(i))
        .y((d, i) => y(d));

    const tick = () => {
      // Push a new data point onto the back.
      data.push(random());

      // Redraw the line.
      d3.select(this)
          .attr('d', line)
          .attr('transform', null);

      // Slide it to the left.
      d3.active(this)
          .attr('transform', `translate(${x(-1)},0)`)
        .transition()
          .on('start', tick);

      // Pop the old data point off the front.
      data.shift();
    };

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('defs').append('clipPath')
      .attr('id', 'clip')
    .append('rect')
      .attr('width', width)
      .attr('height', height);

    g.append('g')
      .attr('clip-path', 'url(#clip)')
    .append('path')
      .datum(data)
      .attr('class', 'line')
    .transition()
      .duration(500)
      .ease(d3.easeLinear)
      .on('start', tick);

    const interp = d3.curveStep();
  }

}
