const SERVICE = '0000ffe0-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC = '0000ffe1-0000-1000-8000-00805f9b34fb';

(async function() {
  if ('serviceWorker' in navigator) {
    let reg;
    try {
      reg = await navigator.serviceWorker.register('/sw.js');
      console.log('Registration succeeded.', reg);
    } catch (error) {
      console.log('Registration failed with ' + error);
    }
  } else {
    console.log('service worker not available');
  }
})();

async function* setupBluetooth() {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{services: [SERVICE]}],
  })
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(SERVICE);
  const characteristic = await service.getCharacteristic(CHARACTERISTIC);
  await characteristic.startNotifications();

  let ready = null;
  const queue = [];

  try {
    characteristic.addEventListener('characteristicvaluechanged', function cb () {
      queue.push(characteristic.value);
      if (ready != null) {
        ready(queue.shift());
        ready = null;
      }
    });

    while (true) {
      if (queue.length > 0) {
        yield queue.shift();
      } else {
        yield new Promise(resolve => ready = resolve);
      }
    }
  } finally {
    characteristic.removeEventListener('characteristicvaluechanged', cb);
  }
}

function* mockValues() {
  let [temp0, temp1] = [60, 62]; // Array.from(Array(2), () => 60 + Math.random() * 30);
  while (true) {
    ([temp0, temp1] = [temp0, temp1].map(v => v + -0.5 + Math.random()));
    const [a, b] = [temp0, temp1].map(v => (v - 32) / 0.0140625);
    const value = new DataView(new ArrayBuffer(20));
    value.setInt16(4,  0);
    value.setInt16(6,  a);
    value.setInt16(14, 1);
    value.setInt16(16, b);
    yield value;
  }
}

async function* delay(gen) {
  const queue = [];
  let ready = null;

  const interval = setInterval(() => {
    const {value, done} = gen.next();
    if (done) {
      clearInterval(interval);
      return;
    }
    queue.push(value);
    if (ready != null) {
      ready(queue.shift());
      ready = null;
    }
  }, 1000);

  try {
    while (true) {
      if (queue.length > 0) {
        yield queue.shift();
      } else {
        yield new Promise(resolve => ready = resolve);
      }
    }
  } finally {
    clearInterval(interval);
  }
}

async function* mock() {
  const queue = [];
  let ready = null;

  let [temp0, temp1] = [60, 62]; // Array.from(Array(2), () => 60 + Math.random() * 30);

  const interval = setInterval(() => {
    ([temp0, temp1] = [temp0, temp1].map(v => v + -0.5 + Math.random()))

    const [a, b] = [temp0, temp1].map(v => (v - 32) / 0.0140625);

    const value = new DataView(new ArrayBuffer(20));
    value.setInt16(4,  0);
    value.setInt16(6,  a);
    value.setInt16(14, 1);
    value.setInt16(16, b);

    queue = queue.concat(value).slice(-1);

    if (ready != null) {
      ready(queue.shift());
      ready = null;
    }
  }, 10);

  try {
    while (true) {
      if (queue.length > 0) {
        yield queue.shift();
      } else {
        yield new Promise(resolve => ready = resolve);
      }
    }
  } finally {
    clearInterval(interval);
  }
}

function convert(v) {
  return v * 0.0140625 + 32;
}

function parseValue(dv) {
  const obj = {};

  for (let i = 0; i < dv.byteLength; i+=10) {
    let id = '';
    for (let j = 0; j < 6; j+=2) {
      id += ('0'.repeat(4) + dv.getInt16(i+j).toString(16)).slice(-4);
    }
    const temp = convert(dv.getInt16(i+6));
    obj[id] = temp;
  }

  return obj;
}

(async function main() {
  // const gen = setupBluetooth();
  const gen = mockValues();
  gen.next();

  let data = [];
  let i = 0;
  let {value, done} = await gen.next();
  let date = new Date();
  while (!done) {
    const ret = Object.values(parseValue(value));

    let obj = {date};
    for (let j = 0; j < ret.length; j++) {
      obj[`value${j}`] = ret[j];
    }
    data.push(obj);

    if (i > 100) {
      data = data.slice(-100);
      draw(data);
      await new Promise(r => setTimeout(r, 1000));
    }
    i++;
    ({value, done} = await gen.next());
    date = new Date(date);
    date.setHours(date.getHours() + 1);
  }
  gen.return();


})();

const curve = d3.curveStep;
// const colors = [d3.schemeRdYlBu[3][2], d3.schemeRdYlBu[3][0]];
const colors = ['red', 'blue'];

const [width, height] = [600, 600];

const margin = {
  top: 20,
  right: 80,
  bottom: 30,
  left: 30,
};

const x = d3.scaleTime()
  .range([margin.left, width - margin.right])

const y = d3.scaleLinear()
  .nice(5)
  .range([height - margin.bottom, margin.top])

let svg = d3.select(document.querySelector('svg'))
  .attr('viewBox', [0, 0, width, height])

svg.append('clipPath')
  .attr('id', 'clipAbove')
  .append('path');

svg.append('clipPath')
  .attr('id', 'clipBelow')
  .append('path');

svg.append('path')
  .attr('id', 'above')
  .attr('clip-path', 'url(#clipAbove)')
  .attr('fill', colors[1]);

svg.append('path')
  .attr('id', 'below')
  .attr('clip-path', 'url(#clipBelow)')
  .attr('fill', colors[0]);

svg.append('path')
  .attr('id', 'path')
  .attr('fill', 'none')
  .attr('stroke', 'black')
  .attr('stroke-width', 1.5)
  .attr('stroke-linejoin', 'round')
  .attr('stroke-linecap', 'round');

{
  const s = svg.append('g')
    .classed('x', true)
    .attr('transform', `translate(0,${height - margin.bottom})`)
  
  s.select('.domain').remove();
}
{
  const s = svg.append('g')
    .classed('y', true)
    .attr('transform', `translate(${margin.left},0)`)

  s.select('.domain').remove();
  s.select('.tick:last-of-type text').clone()
    .attr('x', 3)
    .attr('text-anchor', 'start')
    .attr('font-weight', 'bold')
    .text('°F');
}
svg.append('g').classed('temps', true);

const xAxis = d3.axisBottom(x)
  .ticks(width / 80)
  .tickSizeOuter(0);
const yAxis = d3.axisLeft(y);

const a1 = d3.area().curve(curve)
  .x(d => x(d.date))
  .y0(0)
  .y1(d => y(d.value1));

const a2 = d3.area().curve(curve)
  .x(d => x(d.date))
  .y0(height)
  .y1(d => y(d.value1));

const a3 = d3.area().curve(curve)
  .x(d => x(d.date))
  .y0(height)
  .y1(d => y(d.value0));

const a4 = d3.area().curve(curve)
  .x(d => x(d.date))
  .y0(0)
  .y1(d => y(d.value0));

const line = d3.line().curve(curve)
  .x(d => x(d.date))
  .y(d => y(d.value0));

function draw(data) {
  svg.datum(data);
  x.domain(d3.extent(data, d => d.date));
  y.domain([
    d3.min(data, d => Math.min(d.value0, d.value1)),
    d3.max(data, d => Math.max(d.value0, d.value1))
  ]);

  const t = d3.transition();
  svg.select('g.x').transition(t).call(xAxis);
  svg.select('g.y').transition(t).call(yAxis);

  const {value0, value1} = data.slice(-1)[0];
  console.log(data.slice(-1));

  {
    let s = svg.selectAll('.temp').data([value0, value1]);

    const e = s.enter().append('g').classed('temp', true).attr('text-anchor', 'start').attr('alignment-baseline', 'middle');
    s.append('text')

    s = e.merge(s);

    s.attr('transform', d => `translate(${width - margin.right + 10},${y(d)})`);

    s.select('text').text(d => d.toFixed(2));

    
  }
  

  svg.select('#clipAbove').select('path').attr('d', a1);
  svg.select('#clipBelow').select('path').attr('d', a2);
  svg.select('#above').attr('d', a3);
  svg.select('#below').attr('d', a4);
  svg.select('#path').attr('d', line);
}

// var tau = 2 * Math.PI; // http://tauday.com/tau-manifesto
// 
// // An arc function with all values bound except the endAngle. So, to compute an
// // SVG path string for a given angle, we pass an object with an endAngle
// // property to the `arc` function, and it will return the corresponding string.
// var arc = d3.arc()
//     .innerRadius(180)
//     .outerRadius(240)
//     .startAngle(-Math.PI * 2 / 3);
// 
// // Get the SVG container, and apply a transform such that the origin is the
// // center of the canvas. This way, we don’t need to position arcs individually.
// var svg = d3.select(document.querySelector('svg')),
//     width = +svg.attr("width"),
//     height = +svg.attr("height"),
//     g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
// 
// // Add the background arc, from 0 to 100% (tau).
// var background = g.append("path")
//     .datum({endAngle: Math.PI * 2 / 3})
//     .style("fill", "#ddd")
//     .attr("d", arc);
// 
// var title = g.append('text').classed('title', true).text('IN');
// var text = g.append('text').classed('temperature', true).text(72.5);
// 
// // Add the foreground arc in orange, currently showing 12.7%.
// var foreground = g.append("path")
//     .datum({endAngle: 0.127 * tau})
//     .style("fill", "orange")
//     .attr("d", arc);
// 
// function arcTween(newAngle) {
//   return function(d) {
//     var interpolate = d3.interpolate(d.endAngle, newAngle);
//     return function(t) {
//       d.endAngle = interpolate(t);
//       return arc(d);
//     };
//   };
// }
