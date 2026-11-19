import { Pipe, PipeTransform } from '@angular/core';

export type FuncToPipe<T, R> = (item: T, ...args: unknown[]) => R;

@Pipe({
  name: 'funcToPipe',
  standalone: true,
})
export class FuncToPipePipe<T, R> implements PipeTransform {
  transform(value: T, func: FuncToPipe<T, R>, ...args: unknown[]): R {
    return func(value, ...args);
  }
}
