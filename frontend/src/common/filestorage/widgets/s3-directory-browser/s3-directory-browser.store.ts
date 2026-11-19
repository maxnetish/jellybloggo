import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { S3Config } from '../../model/s3-config';
import { S3Client, S3CommonPrefix } from '@bradenmacdonald/s3-lite-client';
import { catchError, filter, from, pipe, switchMap, tap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { TuiNotificationService } from '@taiga-ui/core';

export const S3DirectoryBrowserStore = signalStore(
  withState({
    bucket: null as S3Config | null,
    currentPrefix: '',
    entries: [] as S3CommonPrefix[],
  }),
  withMethods((store, notificationService = inject(TuiNotificationService)) => {
    return {
      wireBucket: rxMethod<S3Config | null | undefined>(
        pipe(
          filter((bucketOrNull): bucketOrNull is S3Config => !!bucketOrNull),
          tap({
            next: (bucket) => {
              patchState(store, {entries: [], bucket});
            },
          }),
          switchMap((bucket) => {
            if (!bucket.s3_endpoint) {
              throw new Error('Missing s3_endpoint');
            }

            const client = new S3Client({
              endPoint: bucket.s3_endpoint,
              region: bucket.s3_region || 'us-east-1',
              bucket: bucket.s3_bucket,
              accessKey: bucket.s3_access_key,
              secretKey: bucket.s3_access_secret,
            });

            return from(
              client.listObjectsGrouped({
                prefix: store.currentPrefix(),
                delimiter: '/',
              }),
            );
          }),
          filter((entry): entry is S3CommonPrefix => entry.type === 'CommonPrefix'),
          tap({
            next: (entry: S3CommonPrefix) => {
              patchState(store, {entries: [...store.entries(), entry]});
            },
          }),
          // We have to restart stream, else next emit from wireBucket will not pass in stream
          catchError((error, caught) => {
            const message =
              error instanceof Error ? error.message : 'An unknown error occurred';
            notificationService
              .open(message, {
                appearance: 'negative',
                label: 'S3 Error',
              })
              .subscribe();
            return caught;
          }),
        ),
      ),
    };
  }),
);
