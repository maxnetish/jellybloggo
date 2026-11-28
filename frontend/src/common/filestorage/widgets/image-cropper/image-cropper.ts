import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnDestroy, computed, effect, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiIcon, TuiSlider } from '@taiga-ui/core';
import { ImageToUrlPipe } from './image-to-url.pipe';
import type { CropperImage, CropperSelection } from 'cropperjs';
import 'cropperjs';

@Component({
  selector: 'app-image-cropper',
  imports: [TuiButton, TuiIcon, FormsModule, ImageToUrlPipe, TuiSlider],
  templateUrl: './image-cropper.html',
  styleUrl: './image-cropper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ImageCropper implements OnDestroy {
  private readonly imageRef = viewChild<ElementRef<CropperImage>>('imageRef');
  private readonly selectionRef = viewChild<ElementRef<CropperSelection>>('selectionRef');
  private originalMimeType = 'image/jpeg';
  private imageUrl: string | null = null;
  private updateTimer: ReturnType<typeof setTimeout> | null = null;

  readonly source = input<string | File | null>(null);
  readonly size = input<{ width: number; height: number }>({ width: 200, height: 200 });

  readonly result = output<Blob | null>();

  protected readonly hasSource = computed(() => this.source() !== null);
  protected readonly fineRotation = signal(0);

  ngOnDestroy() {
    if (this.updateTimer) clearTimeout(this.updateTimer);
    if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
  }

  private getMimeTypeFromUrl(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp',
    };
    return mimeTypes[ext || ''] || 'image/jpeg';
  }

  private scheduleResultUpdate() {
    if (this.updateTimer) clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => this.emitResult(), 300);
  }

  private async emitResult() {
    const selection = this.selectionRef()?.nativeElement;
    if (!selection) return;

    try {
      const croppedCanvas = await selection.$toCanvas();
      if (!croppedCanvas) {
        this.result.emit(null);
        return;
      }

      const src = this.source();
      if (src && !(src instanceof File)) {
        this.originalMimeType = this.getMimeTypeFromUrl(src);
      }

      const blob = await new Promise<Blob | null>(resolve => {
        croppedCanvas.toBlob(resolve, this.originalMimeType, 0.92);
      });
      this.result.emit(blob);
    } catch {
      this.result.emit(null);
    }
  }

  async getResult(): Promise<Blob | null> {
    const selection = this.selectionRef()?.nativeElement;
    if (!selection) return null;

    try {
      const croppedCanvas = await selection.$toCanvas();
      if (!croppedCanvas) return null;

      return new Promise<Blob | null>(resolve => {
        croppedCanvas.toBlob(resolve, this.originalMimeType, 0.92);
      });
    } catch {
      return null;
    }
  }

  protected rotate90() {
    const imageEl = this.imageRef()?.nativeElement;
    if (!imageEl) return;

    imageEl.$rotate('90deg');
    imageEl.$center('contain');
    this.scheduleResultUpdate();
  }

  protected onFineRotationChange(value: number) {
    const imageEl = this.imageRef()?.nativeElement;
    if (!imageEl) return;

    const delta = value - this.fineRotation();
    if (delta !== 0) {
      imageEl.$rotate(`${delta}deg`);
      imageEl.$center('contain');
    }
    this.fineRotation.set(value);
    this.scheduleResultUpdate();
  }

  protected zoomIn() {
    const imageEl = this.imageRef()?.nativeElement;
    if (!imageEl) return;
    imageEl.$zoom(0.1);
    this.scheduleResultUpdate();
  }

  protected zoomOut() {
    const imageEl = this.imageRef()?.nativeElement;
    if (!imageEl) return;
    imageEl.$zoom(-0.1);
    this.scheduleResultUpdate();
  }

  protected flipHorizontal() {
    const imageEl = this.imageRef()?.nativeElement;
    if (!imageEl) return;
    imageEl.$scale(-1, 1);
    this.scheduleResultUpdate();
  }

  protected flipVertical() {
    const imageEl = this.imageRef()?.nativeElement;
    if (!imageEl) return;
    imageEl.$scale(1, -1);
    this.scheduleResultUpdate();
  }

  protected resetAll() {
    const imageEl = this.imageRef()?.nativeElement;
    if (!imageEl) return;
    imageEl.$resetTransform();
    imageEl.$center('contain');
    this.fineRotation.set(0);
    this.scheduleResultUpdate();
  }
}