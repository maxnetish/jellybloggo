import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiButton, TuiIcon, TuiSlider } from '@taiga-ui/core';
import type { CropperImage, CropperSelection } from 'cropperjs';
import 'cropperjs';

@Component({
  selector: 'app-image-cropper',
  imports: [TuiButton, TuiIcon, FormsModule, TuiSlider],
  templateUrl: './image-cropper.html',
  styleUrl: './image-cropper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // We use webcomponents, so...
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ImageCropper {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cropperImageRef = viewChild<ElementRef<CropperImage>>('cropperImageRef');
  private readonly cropperSelectionRef = viewChild<ElementRef<CropperSelection>>('cropperSelectionRef');

  /**
   * Input image as url or `File`
   */
  readonly source = input<string | File | null>(null);

  readonly imageBoxWidth = input(200);

  readonly imageBoxHeight = input(200);

  protected readonly imageSourceAsUrl = signal<string | null>(null);

  protected readonly hasSource = computed(() => this.source() !== null);

  protected readonly fineRotation = signal(0);

  constructor() {
    effect(onCleanup => {
      const source = this.source();

      if (!(source instanceof File)) {
        this.imageSourceAsUrl.set(source);
        return;
      }

      if (!isPlatformBrowser(this.platformId)) {
        this.imageSourceAsUrl.set(null);
        return;
      }

      const url = URL.createObjectURL(source);
      this.imageSourceAsUrl.set(url);
      onCleanup(() => URL.revokeObjectURL(url));
    });
  }

  /**
   * Extract result as `Blob`.
   *
   * type, quality: same parameters as in `HTMLCanvasElement.toBlob`
   */
  async fetchResult({type, quality}: {
    type?: Parameters<HTMLCanvasElement['toBlob']>[1];
    quality?: Parameters<HTMLCanvasElement['toBlob']>[2];
  } = {}): Promise<Blob | null> {
    const selection = this.cropperSelectionRef()?.nativeElement;
    const cropperImage = this.cropperImageRef()?.nativeElement;
    if (!selection || !cropperImage) return null;

    try {
      // 1. Получаем нативный <img> внутри <cropper-image>, чтобы узнать реальные пиксели (naturalWidth)
      const nativeImg = await cropperImage.$ready();
      const imgRect = cropperImage.getBoundingClientRect();

      // 2. Считаем коэффициент масштабирования: сколько оригинальных пикселей в 1 экранном пикселе
      // (учитываем поворот на 90°/270°, когда ширина и высота на экране меняются местами)
      // const isRotated90 = Math.abs(this.baseAngle % 180) === 90;
      // Не будем учитывать поворот
      const isRotated90 = false;
      const naturalW = isRotated90 ? nativeImg.naturalHeight : nativeImg.naturalWidth;
      const scaleRatio = imgRect.width > 0 ? naturalW / imgRect.width : 1;

      // 3. Вычисляем итоговые размеры в оригинальных пикселях (но не меньше экранных)
      const targetWidth = Math.round(selection.width * Math.max(1, scaleRatio));
      const targetHeight = Math.round(selection.height * Math.max(1, scaleRatio));

      const croppedCanvas = await selection.$toCanvas({
        width: targetWidth,
        height: targetHeight,
      });
      if (!croppedCanvas) return null;

      return new Promise<Blob | null>(resolve => {
        croppedCanvas.toBlob(
          resolve,
          type,
          quality,
        );
      });
    } catch {
      return null;
    }
  }

  protected rotate90() {
    const imageEl = this.cropperImageRef()?.nativeElement;
    if (!imageEl) return;

    imageEl.$rotate('90deg');
    imageEl.$center('contain');
  }

  protected onFineRotationChange(value: number) {
    const imageEl = this.cropperImageRef()?.nativeElement;
    if (!imageEl) return;

    const delta = value - this.fineRotation();
    if (delta !== 0) {
      imageEl.$rotate(`${delta}deg`);
      imageEl.$center('contain');
    }
    this.fineRotation.set(value);
  }

  protected zoomIn() {
    const imageEl = this.cropperImageRef()?.nativeElement;
    if (!imageEl) return;
    imageEl.$zoom(0.1);
  }

  protected zoomOut() {
    const imageEl = this.cropperImageRef()?.nativeElement;
    if (!imageEl) return;
    imageEl.$zoom(-0.1);
  }

  protected flipHorizontal() {
    const imageEl = this.cropperImageRef()?.nativeElement;
    if (!imageEl) return;
    imageEl.$scale(-1, 1);
  }

  protected flipVertical() {
    const imageEl = this.cropperImageRef()?.nativeElement;
    if (!imageEl) return;
    imageEl.$scale(1, -1);
  }

  protected resetAll() {
    const imageEl = this.cropperImageRef()?.nativeElement;
    if (!imageEl) return;
    imageEl.$resetTransform();
    imageEl.$center('contain');
    this.fineRotation.set(0);
  }

}
