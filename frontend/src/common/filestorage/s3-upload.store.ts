import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { S3Config } from './model/s3-config';
import { S3UploadService } from './s3-upload.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, mergeMap, of, pipe, tap } from 'rxjs';
import { inject } from '@angular/core';
import { nanoid } from 'nanoid';
import { TuiNotificationService } from '@taiga-ui/core';

export const S3UploadStore = signalStore(
  {providedIn: 'root'},
  withState({
    queue: [] as {
      id: string;
      bucket: S3Config;
      file: File;
      prefix: string;
      overrideFileName?: string;
      progress: ReturnType<S3UploadService['upload']> | null;
      canceled: boolean;
    }[],
  }),
  withMethods((store, notificationService = inject(TuiNotificationService)) => {
    return {
      _errorToast(error: any) {
        const message =
          error instanceof Error
            ? error.message
            : 'An unknown error occurred';

        notificationService.open(message, {
          appearance: 'negative',
          label: 'Upload fails',
        }).subscribe();
      }
    };
  }),
  withMethods((store, uploadService = inject(S3UploadService)) => {
    return {
      /**
       * Добавить в очередь новый файл для загрузки
       */
      add: rxMethod<{
        bucket: S3Config;
        file: File;
        prefix: string;
        overrideFileName?: string;
      }>(
        pipe(
          map((emit) => {
            return {
              ...emit,
              id: nanoid(),
            };
          }),
          tap({
            next: (emit) => {
              patchState(store, {
                  queue: [
                    {
                      ...emit,
                      progress: null,
                      canceled: false,
                    },
                    ...store.queue(),
                  ],
                },
              );
            },
          }),
          mergeMap((emit) => {
            const queueEntry = store.queue().find((entry) => entry.id === emit.id);
            if(queueEntry?.canceled) {
              // canceled in cancelById before upload starts,
              // skip upload
              return of(null);
            }

            const progress = uploadService.upload({
              bucket: emit.bucket,
              file: emit.file,
              overrideFileName: emit.overrideFileName,
              prefix: emit.prefix,
            });
            patchState(store, {
              queue: store.queue().map((entry) => {
                if (entry.id === emit.id) {
                  return {
                    ...entry,
                    progress: progress,
                  };
                }
                return entry;
              })
            });
            return progress.stream$;
            // concurrency: 3
          }, 3),
          catchError((error, caught) => {
            store._errorToast(error);
            return caught;
          }),
        ),
      ),
      /**
       * Cancel pending upload or uplod in progress
       */
      cancelById(id: string) {
        const queue = store.queue();
        const queueEntry = queue.find((entry) => entry.id === id);
        if (queueEntry) {
          if (queueEntry.progress) {
            // uploading already started, call cancel() to abort request
            queueEntry.progress.cancel();
          } else {
            // uploading not started yet, mark entry as canceled, so uploading will not start
            patchState(store, {
              queue: queue.map((entry) => {
                if (entry === queueEntry) {
                  return {
                    ...entry,
                    canceled: true,
                  };
                }
                return entry;
              }),
            });
          }
        } else {
          throw new Error(`Missing upload progress at id: ${id}`);
        }
      },
      /**
       * Remove completed/canceled/failed entry from queue
       */
      removeById(id: string) {
        patchState(store, {
          queue: store.queue().filter((entry) => entry.id !== id),
        });
      },
    };
  }),
);
