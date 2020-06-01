import { HostBinding, Input, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-category-dial',
  template: `
  <div>
    <span></span>
    <span></span>
    <span></span>
  </div>
  `,
  styleUrls: ['./category-dial.component.scss']
})
export class CategoryDialComponent implements OnInit {
  @HostBinding('style.--rot')
  get rotation() {
    const diff = this.b - this.a;
    const a = Math.max(-1, diff);
    const b = Math.min(a - -1, 4) / 4;
    const c = (b - 0.5) * 48 * 3;
    return c + 'deg';
  }

  @Input()
  a = -1;

  @Input()
  b = 1;

  constructor() { }

  ngOnInit(): void {
  }

}
