import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, of, concat } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { publishBehavior, pluck, skip, share, tap, map, exhaustMap, scan } from 'rxjs/operators';


interface Value {
  addr: number;
  value: number;
  date: string;
}

function convertRaw(raw: number) {
  return raw * 0.0140625 + 32;
}

function convertValue(rawValue) {
  const {addr, sample, date, value} = rawValue;
  // yuck
  return {addr, sample, date: new Date(date + (date.endsWith('Z') ? '' : 'Z')), value: convertRaw(value)};
}


@Injectable({
  providedIn: 'root'
})
export class TemperatureService {
  socket$ = webSocket<Value>(`ws://${location.origin.slice(location.protocol.length)}/ws`);
  stream$ = this.http.get<Value[]>('/api/latest').pipe(
    exhaustMap(latest =>
      concat(from(latest), this.socket$)),
    map(convertValue),
    share(),
  );
  asof$ = this.stream$.pipe(pluck('date'));
  value$ = this.stream$.pipe(scan((acc, value) => ({...acc, [value.addr]: value}), {}));

  constructor(public http: HttpClient) {}
}
