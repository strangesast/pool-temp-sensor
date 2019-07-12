import * as d3 from 'd3';
import runtime from 'serviceworker-webpack-plugin/lib/runtime';

const SERVICE = '0000ffe0-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC = '0000ffe1-0000-1000-8000-00805f9b34fb';

(async function() {
  if ('serviceWorker' in navigator) {
    let reg;
    try {
      reg = runtime.register();

      return;
    } catch (error) {
    }
  }
  console.log('Service worker failed to register.');
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

const curve = d3.curveStep;
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
const options = svg.selectAll('g.option').data([{title: 'Demo', id: 'demo'}, {title: 'Bluetooth', id: 'bluetooth'}]).enter().append('g').classed('option', true);
options.append('rect').attr('transform', (_, i) => `translate(0,${i * 100})`).attr('stoke', 'black');
options.append('text').attr('text-anchor', 'middle').attr('x', 100).attr('y', 50).text(d => d.title);
options.on('click', d => {
  console.log('option', d);
});

const rect = svg.append('g');
rect.append('rect').attr('width', 200).attr('height', 100).attr('fill', 'blue');
rect.node().addEventListener('click', async function main() {
  rect.node().removeEventListener('click', main);
  rect.remove();

  const gen = setupBluetooth();
  gen.next();

  let data = [];
  let {value, done} = await gen.next();
  while (!done) {
    const ret = Object.values(parseValue(value));

    let date = new Date();
    let obj = {date};
    for (let j = 0; j < ret.length; j++) {
      obj[`value${j}`] = ret[j];
    }
    data.push(obj);

    draw(data);

    data = data.slice(-100);
    ({value, done} = await gen.next());
  }
  gen.return();
});
