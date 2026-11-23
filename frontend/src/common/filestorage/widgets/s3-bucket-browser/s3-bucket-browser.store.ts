import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { S3Config } from '../../model/s3-config';
import { S3Breadcrumb } from '../../model/s3-breadcrumb';
import { S3CommonPrefix, S3Object } from '@bradenmacdonald/s3-lite-client';
import { catchError, filter, map, pipe, switchMap, tap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { TuiNotificationService } from '@taiga-ui/core';
import { createS3Client } from '../../s3-client';
import { lastSegmentOf } from '../../model/s3-path';

export const S3BucketBrowserStore = signalStore(
  {providedIn: 'root'},
  withState({
    bucket: null as S3Config | null,
    currentPrefix: '',
    entries: [] as (S3CommonPrefix | S3Object)[],
    busy: false,
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
          // Exclude 0-length files. Actually such files creates to place empty prefix,
          // that is "directory marker"
          return entry.type === 'Object' && entry.size > 0;
        });
      }),
      breadcrumbs: computed(() => buildBreadcrumbs(store.currentPrefix())),
    }
  }),
  withComputed((store) => {
    return {
      canDeleteCurrentFolder: computed(
        () => store.currentPrefix() !== '' && store.directories().length === 0 && store.files().length === 0,
      ),
    };
  }),
  withMethods((store, notificationService = inject(TuiNotificationService)) => {
    return {
      wireBucket: rxMethod<S3Config | null | undefined>(
        pipe(
          filter((bucketOrNull): bucketOrNull is S3Config => !!bucketOrNull),
          tap({
            next: (bucket) => {
              patchState(store, {bucket});
            },
          }),
          switchMap((bucket) => {
            return loadEntries({
              currentPrefix: store.currentPrefix(),
              bucket,
            });
          }),
          map((entries) => entries),
          tap({
            next: (entries) => {
              patchState(store, {entries});
            },
          }),
          // We have to restart stream, else next emit from wireBucket will not pass in stream
          catchError((error, caught) => {
            errorToast({notificationService, error});
            patchState(store, {entries: []});
            return caught;
          }),
        ),
      ),
      choosePrefix: rxMethod<string>(
        pipe(
          switchMap(async (prefix) => {
            const bucket = store.bucket();
            if (!bucket) {
              throw new Error('Missing s3 bucket config');
            }

            const entries = await loadEntries({
              currentPrefix: prefix,
              bucket,
            });

            return {entries, prefix};
          }),
          tap({
            next: ({entries, prefix}) => {
              patchState(store, {entries, currentPrefix: prefix});
            },
          }),
          // We have to restart stream, else next emit from wireBucket will not pass in stream
          catchError((error, caught) => {
            errorToast({notificationService, error});
            patchState(store, {entries: []});
            return caught;
          }),
        ),
      ),
      chooseParentPrefix: rxMethod<void>(
        pipe(
          map(() => {
            return extractParentPrefix(store.currentPrefix());
          }),
          switchMap(async (prefix) => {
            const bucket = store.bucket();
            if (!bucket) {
              throw new Error('Missing s3 bucket config');
            }

            const entries = await loadEntries({
              currentPrefix: prefix,
              bucket,
            });

            return {entries, prefix}
          }),
          tap({
            next: ({entries, prefix}) => {
              patchState(store, {entries, currentPrefix: prefix});
            },
          }),
          // We have to restart stream, else next emit from wireBucket will not pass in stream
          catchError((error, caught) => {
            errorToast({notificationService, error});
            patchState(store, {entries: []});
            return caught;
          }),
        ),
      ),
    };
  }),
  // Second withMethods block, so these methods can call methods from the block above.
  withMethods((store, notificationService = inject(TuiNotificationService)) => {
    return {
      createFolder: async (name: string): Promise<boolean> => {
        const bucket = store.bucket();
        if (!bucket) {
          return false;
        }

        const trimmedName = name.trim();
        if (!trimmedName) {
          return false;
        }

        patchState(store, {busy: true});

        try {
          const client = createS3Client(bucket);
          const newPrefix = store.currentPrefix() + trimmedName + '/';
          await client.putObject(newPrefix, '');

          const newEntry: S3CommonPrefix = {type: 'CommonPrefix', prefix: newPrefix};
          patchState(store, {entries: [newEntry, ...store.entries()]});
          return true;
        } catch (error: unknown) {
          errorToast({notificationService, error});
          return false;
        } finally {
          patchState(store, {busy: false});
        }
      },
      deleteCurrentFolder: async (): Promise<boolean> => {
        const bucket = store.bucket();
        if (!bucket || store.currentPrefix() === '') {
          return false;
        }

        patchState(store, {busy: true});

        try {
          const client = createS3Client(bucket);
          await client.deleteObject(store.currentPrefix());

          store.chooseParentPrefix();
          return true;
        } catch (error: unknown) {
          errorToast({notificationService, error});
          return false;
        } finally {
          patchState(store, {busy: false});
        }
      },
      deleteFile: async (fileKey: string): Promise<boolean> => {
        const bucket = store.bucket();
        if (!bucket) {
          throw new Error('Missing bucket config');
        }

        patchState(store, {busy: true});
        try {
          const client = createS3Client(bucket);
          await client.deleteObject(fileKey);
          patchState(store, {
            entries: store.entries().filter(
              (e) => !(e.type === 'Object' && e.key === fileKey),
            ),
          });
          return true;
        } catch (error: unknown) {
          errorToast({notificationService, error});
          return false;
        } finally {
          patchState(store, {busy: false});
        }
      },
      insertEntry: (entry: S3Object) => {
        patchState(store, {entries: [entry, ...store.entries()]});
      },
      copyFile: async (file: S3Object, newName: string): Promise<boolean> => {
        const bucket = store.bucket();
        if (!bucket) {
          throw new Error('Missing bucket config');
        }

        const fileName = lastSegmentOf(file.key);
        const newKey = file.key.slice(0, file.key.length - fileName.length) + newName.trim();

        patchState(store, {busy: true});
        try {
          const client = createS3Client(bucket);
          const copied = await client.copyObject({sourceKey: file.key}, newKey);
          patchState(store, {
            entries: [
              ...store.entries(),
              {
                type: 'Object',
                key: newKey,
                size: file.size,
                etag: copied.etag,
                lastModified: copied.lastModified,
              },
            ],
          });
          return true;
        } catch (error: unknown) {
          errorToast({notificationService, error});
          return false;
        } finally {
          patchState(store, {busy: false});
        }
      },
    };
  }),
);

function loadEntries({bucket, currentPrefix}: { bucket: S3Config, currentPrefix?: string }) {
  const client = createS3Client(bucket);

  return (
    async () => {
      const entries: (S3CommonPrefix | S3Object)[] = [];
      for await (const entry of client.listObjectsGrouped({
        prefix: currentPrefix,
        delimiter: '/',
      })) {
        entries.push(entry);
      }
      return entries;
    }
  )();
}

function errorToast({error, notificationService}: { error: unknown, notificationService: TuiNotificationService }) {
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
  return parts.length ? `${parts.join('/')}/` : '';
}

export function buildBreadcrumbs(currentPrefix: string): S3Breadcrumb[] {
  const segments = currentPrefix.split('/').filter(Boolean);

  const breadcrumbs: S3Breadcrumb[] = [{label: 'Root', prefix: ''}];
  let acc = '';

  for (const segment of segments) {
    acc = acc ? `${acc}/${segment}` : segment;
    // Trailing slash is the prefix format expected by listObjectsGrouped
    breadcrumbs.push({label: segment, prefix: `${acc}/`});
  }

  return breadcrumbs;
}
