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
