import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, concat } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { map, exhaustMap, scan } from 'rxjs/operators';


interface Value {
  id: number;
  addr: number;
  value: number;
  date: string;
}

function convertRaw(raw: number) {
  return raw * 0.0140625 + 32;
}

function convertValue(rawValue) {
  const {id, addr, sample, date, value} = rawValue;
  return {id, sample, date: new Date(date), value: convertRaw(value)};
}


@Injectable({
  providedIn: 'root'
})
export class TemperatureService {

  constructor(public http: HttpClient) {}
  socket$ = webSocket<Value>(`ws://${location.origin.slice(location.protocol.length)}/ws`);

  value$ = this.http.get<Value[]>('/api/latest').pipe(
    map(latest => latest.map(convertValue).reduce((acc, value) => ({...acc, [value.id]: value}), {})),
    exhaustMap(first => concat(
      of(first),
      this.socket$.pipe(map(convertValue), scan((acc, value) => ({...acc, [value.id]: value}), first)))
    ),
  );
}
