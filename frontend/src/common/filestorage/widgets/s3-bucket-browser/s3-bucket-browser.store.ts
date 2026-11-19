import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { S3Config } from '../../model/s3-config';
import { S3Client, S3CommonPrefix, S3Object } from '@bradenmacdonald/s3-lite-client';
import { catchError, filter, from, map, pipe, switchMap, tap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { TuiNotificationService } from '@taiga-ui/core';

export const S3BucketBrowserStore = signalStore(
  withState({
    bucket: null as S3Config | null,
    currentPrefix: '',
    entries: [] as (S3CommonPrefix | S3Object)[],
  }),
  withComputed((store) => {
    return {
      directories: computed(() => {
        return store.entries().filter((entry) => {
          return entry.type === 'CommonPrefix';
        });
      }),
      files: computed(() => {
        return store.entries().filter((entry): entry is S3Object => {
          // Exclude 0-length files. Actually such files creates to place empty prefix
          return entry.type === 'Object' && entry.size > 0;
        });
      }),
    }
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
            return loadEntries({
              currentPrefix: store.currentPrefix(),
              bucket,
            });
          }),
          tap({
            next: (entry) => {
              patchState(store, {entries: [...store.entries(), entry]});
            },
          }),
          // We have to restart stream, else next emit from wireBucket will not pass in stream
          catchError((error, caught) => {
            errorToast({notificationService, error});
            return caught;
          }),
        ),
      ),
      choosePrefix: rxMethod<string>(
        pipe(
          tap({
            next: (prefix) => {
              patchState(store, {entries: [], currentPrefix: prefix});
            },
          }),
          switchMap((prefix) => {
            const bucket = store.bucket();
            if (!bucket) {
              throw new Error('Missing s3 bucket config');
            }

            return loadEntries({
              currentPrefix: prefix,
              bucket,
            });
          }),
          tap({
            next: (entry) => {
              patchState(store, {entries: [...store.entries(), entry]});
            },
          }),
          // We have to restart stream, else next emit from wireBucket will not pass in stream
          catchError((error, caught) => {
            errorToast({notificationService, error});
            return caught;
          }),
        ),
      ),
      chooseParentPrefix: rxMethod<void>(
        pipe(
          map(() => {
            const prefix = extractParentPrefix(store.currentPrefix());
            return prefix;
          }),
          tap({
            next: (prefix) => {
              patchState(store, {entries: [], currentPrefix: prefix});
            },
          }),
          switchMap((prefix) => {
            const bucket = store.bucket();
            if (!bucket) {
              throw new Error('Missing s3 bucket config');
            }

            return loadEntries({
              currentPrefix: prefix,
              bucket,
            });
          }),
          tap({
            next: (entry) => {
              patchState(store, {entries: [...store.entries(), entry]});
            },
          }),
          // We have to restart stream, else next emit from wireBucket will not pass in stream
          catchError((error, caught) => {
            errorToast({notificationService, error});
            return caught;
          }),
        ),
      )
    };
  }),
);

function loadEntries({bucket, currentPrefix}: { bucket: S3Config, currentPrefix?: string }) {
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
      prefix: currentPrefix,
      delimiter: '/',
    }),
  );
}

function errorToast({error, notificationService}: { error: any, notificationService: TuiNotificationService }) {
  const message =
    error instanceof Error
      ? error.message
      : 'An unknown error occurred';

  notificationService.open(message, {
    appearance: 'negative',
    label: 'S3 Error',
  }).subscribe();
}

function extractParentPrefix(prefix: string) {
  const parts = prefix.replace(/\/+$/, '').split('/');
  parts.pop();
  return parts.join('/');
}
