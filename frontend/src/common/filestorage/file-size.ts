import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import { formatNumber } from '@angular/common';

const nonBreakableSpace = '\u00A0';
const unitSize = 1024;
const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];

export function fileSizeToHuman({bytes, locale, digitsInfo}: {
  bytes: number;
  locale: string,
  digitsInfo?: string
}): string {

  if (Math.abs(bytes) < unitSize) {
    return `${bytes} ${units[0]}`;
  }

  let u = 0;

  do {
    bytes /= unitSize;
    u++;
  } while (Math.round(bytes * 100) / 100 >= unitSize && u < units.length - 1);

  return `${formatNumber(bytes, locale, digitsInfo)}${nonBreakableSpace}${units[u]}`;
}

/**
 * Transforms number to file size with corresponding binary unit
 *
 * @example `208.45 KiB`
 */
@Pipe({
  name: 'fileSizeForHuman',
  standalone: true,
})
export class FileSizeForHumanPipe implements PipeTransform {

  private readonly defaultLocale = inject(LOCALE_ID);

  transform(fileSizeBytes?: number | null, digitsInfo?: string, locale?: string): string {
    if (fileSizeBytes || fileSizeBytes === 0) {
      return fileSizeToHuman({
        bytes: fileSizeBytes,
        digitsInfo: digitsInfo || '1.0-2',
        locale: locale || this.defaultLocale,
      });
    }
    return '';
  }
}
