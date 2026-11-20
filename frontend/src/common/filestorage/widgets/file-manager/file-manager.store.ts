import { S3ConfigResponse } from '../../model/s3-config';
import { LoadingStatus } from '../../../utils/loading-status';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { S3ConfigService } from '../../s3config.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { map, pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { TuiNotificationService } from '@taiga-ui/core';

export const FileManagerStore = signalStore(
  {providedIn: 'root'},
  withState({
    s3Configs: [] as S3ConfigResponse[],
    s3ConfigLoadingStatus: LoadingStatus.INITIAL,
    bucketMenuOpen: false,
    chosenConfigId: null as string | null,
  }),

  withComputed(({chosenConfigId, s3Configs}) => {
    return {
      chosenBucket: computed(() => {
        return s3Configs().find((entry) => entry.id === chosenConfigId()) || null;
      })
    };
  }),

  withComputed(({s3ConfigLoadingStatus, chosenBucket}) => {
    return {
      isLoading: computed(() => s3ConfigLoadingStatus() === LoadingStatus.LOADING),
      chooseBucketLabel: computed(() => {
        const chosenBucketValue = chosenBucket();
        if (chosenBucketValue) {
          return chosenBucketValue.config_name || chosenBucketValue.s3_bucket;
        }
        return 'Choose storage bucket or add new one';
      }),
    };
  }),

  withComputed(({s3Configs}) => {
    return {
      s3ConfigsNumber: computed(() => s3Configs().length),
    };
  }),

  withMethods((store, s3ConfigService = inject(S3ConfigService), notificationService = inject(TuiNotificationService)) => {
    return {
      /**
       * Load s3 user configs
       */
      loadS3Configs: rxMethod<void>(
        pipe(
          tap({
            next: () => {
              patchState(store, {
                s3ConfigLoadingStatus: LoadingStatus.LOADING,
              });
            },
          }),
          switchMap(() => {
            return s3ConfigService.getAll();
          }),
          tapResponse({
            next: (response) => {
              patchState(store, (state) => ({
                s3ConfigLoadingStatus: LoadingStatus.SUCCESS,
                s3Configs: response,
                // Keep the previously chosen bucket if it still exists in the
                // loaded list, otherwise fall back to the first one.
                chosenConfigId: response.some((config) => config.id === state.chosenConfigId)
                  ? state.chosenConfigId
                  : response[0]?.id ?? null,
              }));
            },
            error: (error: any) => {
              patchState(store, {
                s3ConfigLoadingStatus: LoadingStatus.FAIL,
              });
              notificationService.open(
                error.error?.error || error.message || 'An error occurred',
                { appearance: 'negative', label: 'Error loading file storage buckets configs' },
              ).subscribe();
            },
          })
        ),
      ),
      /**
       * Remove bucket config
       */
      removeS3Config: rxMethod<S3ConfigResponse>(
        pipe(
          switchMap((config) => {
            return s3ConfigService.delete({id: config.id}).pipe(
              map(() => config),
            );
          }),
          tapResponse({
            next: (removedConfig) => {
              patchState(store, (state) => {
                const updatedConfigs = state.s3Configs.filter((entry) => entry.id !== removedConfig.id);
                return {
                  s3Configs: updatedConfigs,
                  chosenConfigId: updatedConfigs[0]?.id || null,
                }
              })
            },
            error: (error: any) => {
              notificationService.open(
                error.error?.error || error.message || 'An error occurred',
                { appearance: 'negative', label: 'Error removing file storage bucket config' },
              ).subscribe();
            }
          }),
        )
      ),
      /**
       * After update or add bucket config. Config already saved
       */
      updateOrAddS3Config(config: S3ConfigResponse) {
        patchState(store, (state) => {
          const existentConfigs = state.s3Configs;
          const existentIndex = existentConfigs.findIndex((entry) => entry.id === config.id);
          if (existentIndex > -1) {
            // Отредактирован существующий конфиг -> заменяем существующий
            return {
              s3Configs: [
                ...existentConfigs.slice(0, existentIndex),
                {...config},
                ...existentConfigs.slice(existentIndex + 1),
              ],
            }
          }
          // Добавили новый -> кладем в начало
          return {
            s3Configs: [
              {...config},
              ...existentConfigs,
            ],
            chosenConfigId: config.id,
          };
        });
      },
      /**
       * Open/close dropdown menu with bucket configs
       * @param value
       */
      bucketMenuToggle(value?: boolean) {
        patchState(store, (state) => {
          return {
            bucketMenuOpen: typeof value === 'boolean'
              ? value
              : !state.bucketMenuOpen,
          };
        });
      },
      /**
       * Makes bucket "chosen"
       */
      chooseBucket(value?: S3ConfigResponse | null) {
        patchState(store, {
          chosenConfigId: value?.id || null,
          bucketMenuOpen: false,
        });
      },
    };
  }),
)
