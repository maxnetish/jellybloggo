import { S3ConfigResponse } from '../../model/s3-config';
import { LoadingStatus } from '../../../utils/loading-status';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { S3ConfigService } from '../../s3config.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { TuiNotificationService } from '@taiga-ui/core';

export const FileManagerStore = signalStore(
  withState({
    s3Configs: [] as S3ConfigResponse[],
    s3ConfigLoadingStatus: LoadingStatus.INITIAL,
  }),

  withComputed(({s3ConfigLoadingStatus}) => {
    return {
      isLoading: computed(() => s3ConfigLoadingStatus() === LoadingStatus.LOADING),
    };
  }),

  withComputed(({s3Configs}) => {
    return {
      s3ConfigsNumber: computed(() => s3Configs().length),
    };
  }),

  withMethods((store, s3ConfigService = inject(S3ConfigService), notificationService = inject(TuiNotificationService)) => {
    return {
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
              patchState(store, {
                s3ConfigLoadingStatus: LoadingStatus.SUCCESS,
                s3Configs: response,
              });
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
          };
        });
      },
    }
  }),
)
