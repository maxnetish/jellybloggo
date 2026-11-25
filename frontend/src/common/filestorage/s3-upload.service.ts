import { createEnvironmentInjector, DestroyRef, EnvironmentInjector, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpEventType, provideHttpClient, withXhr } from '@angular/common/http';
import { createS3Client } from './s3-client';
import { S3Config } from './model/s3-config';
import { from, shareReplay, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type FileUploadStatus = 'presign' | 'uploading' | 'success' | 'error' | 'cancelled';

@Injectable({
  providedIn: 'root',
})
export class S3UploadService {
  private readonly envInjector = createEnvironmentInjector(
    [
      provideHttpClient(withXhr()),
    ],
    inject(EnvironmentInjector),
  );
  // We should use XHR backend to track progress
  private readonly http = this.envInjector.get(HttpClient);

  /**
   * Upload file in S3 storage
   * @param bucket in which bucket
   * @param file file to upload
   * @param prefix in which "directory" in bucket
   * @param overrideFileName name to use as last segment of object key, default: use file.name
   * @param destroyRef DestroyRef from component to cancel uploading if component destroyes
   *
   * @returns Reactive progress/status
   */
  upload({bucket, file, prefix, overrideFileName, destroyRef}: {
    bucket: S3Config;
    file: File;
    prefix: string;
    overrideFileName?: string;
    destroyRef?: DestroyRef
  }) {
    const cancel$ = new Subject<void>();
    const percents = signal(0);
    const status = signal<FileUploadStatus>('presign');
    const error = signal<unknown>(null);

    // 0. Берем данные для запроса из хранилища
    const stream$ = from(this.createPresignedData({bucket, file, overrideFileName, prefix})).pipe(
      tap({
        next: () => {
          status.set('uploading');
        },
      }),
      switchMap((presigned) => {
        const formData = new FormData();
        // 1. Сначала добавляем ВСЕ подписанные поля из presigned.fields
        Object.entries(presigned.fields).forEach(([key, value]) => {
          formData.append(key, value);
        });
        // 2. Поле 'file' ОБЯЗАТЕЛЬНО должно быть добавлено последним!
        formData.append('file', file);
        // 3. Отправляем POST на presigned.url с отслеживанием прогресса
        return this.http.post(presigned.url, formData, {
          reportUploadProgress: true,
          observe: 'events',
        });
      }),
      takeUntil(cancel$),
      // takeUntilDestroyed(destroyRef),
      shareReplay(1),
    );

    stream$.subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          // event.total может отсутствовать, если размер тела неизвестен
          const percent = event.total ? Math.round((
            100 * event.loaded
          ) / event.total) : 0;
          percents.set(percent);
        } else if (event.type === HttpEventType.Response) {
          percents.set(100);
          status.set('success');
        }
      },
      error: (err) => {
        error.set(err);
        status.set('error');
      },
    });

    return {
      // http client stream, completes when upload done/failed
      stream$,
      // Прогресс в процентах
      percents: percents.asReadonly(),
      // Статус: 'uploading' | 'success' | 'error' | 'cancelled'
      status: status.asReadonly(),
      // Ошибка
      error: error.asReadonly(),
      // Типа как AbortController, отменяет идущую загрузку файла.
      cancel: () => {
        if (status() === 'uploading') {
          status.set('cancelled');
          cancel$.next();
          cancel$.complete();
        }
      },
    };
  }

  private createPresignedData({bucket, file, prefix, overrideFileName}: {
    bucket: S3Config,
    file: File,
    prefix: string;
    overrideFileName?: string;
  }) {
    const s3Client = createS3Client(bucket);
    const objectName = `${prefix}${overrideFileName || file.name}`;
    // Content-Type в fields, а не в conditions — библиотека добавит его в policy
    // до подписи. Это важно: S3 требует все поля формы в policy, иначе отклоняет
    // с "InvalidPolicyDocument: Extra input fields". Поле добавляется в подпись
    // через fields → policy conditions, а не после подписи.
    return s3Client.presignedPostObject(objectName, {
      fields: {
        'Content-Type': file.type,
        // x-amz-meta-originalname кодируется через encodeURIComponent, т.к. btoa() в библиотеке
        // не работает с UTF-8. При чтении через statObject() нужно применить decodeURIComponent().
        'x-amz-meta-originalname': encodeURIComponent(file.name),
      },
    });
  }
}
