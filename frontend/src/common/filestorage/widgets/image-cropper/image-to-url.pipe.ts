import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'imageToUrl',
  standalone: true,
})
export class ImageToUrlPipe implements PipeTransform {
  private urlCache = new Map<string, string>();

  transform(value: string | File | null): string | null {
    if (!value) return null;

    if (value instanceof File) {
      // Clean up old URL if exists
      const cachedUrl = this.urlCache.get(value.name);
      if (cachedUrl) {
        URL.revokeObjectURL(cachedUrl);
      }
      const url = URL.createObjectURL(value);
      this.urlCache.set(value.name, url);
      return url;
    }

    return value;
  }
}