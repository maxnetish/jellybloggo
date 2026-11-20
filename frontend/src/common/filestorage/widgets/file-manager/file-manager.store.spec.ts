import { TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import { of } from 'rxjs';
import { S3ConfigResponse } from '../../model/s3-config';
import { S3ConfigService } from '../../s3config.service';
import { FileManagerStore } from './file-manager.store';

describe('FileManagerStore', () => {
  const configs: S3ConfigResponse[] = [createConfig('a'), createConfig('b')];

  function createStore(): InstanceType<typeof FileManagerStore> {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: S3ConfigService,
          useValue: {getAll: () => of(configs)},
        },
      ],
    });

    return TestBed.inject(FileManagerStore);
  }

  it('should keep the chosen bucket if it is present in the loaded list', () => {
    const store = createStore();
    patchState(unprotected(store), {chosenConfigId: 'b'});

    store.loadS3Configs();

    expect(store.chosenConfigId()).toBe('b');
  });

  it('should fall back to the first bucket if the chosen one is missing', () => {
    const store = createStore();
    patchState(unprotected(store), {chosenConfigId: 'missing'});

    store.loadS3Configs();

    expect(store.chosenConfigId()).toBe('a');
  });

  it('should reset the chosen bucket if the loaded list is empty', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: S3ConfigService,
          useValue: {getAll: () => of([])},
        },
      ],
    });
    const store = TestBed.inject(FileManagerStore);
    patchState(unprotected(store), {chosenConfigId: 'a'});

    store.loadS3Configs();

    expect(store.chosenConfigId()).toBeNull();
  });
});

function createConfig(id: string): S3ConfigResponse {
  return {
    id,
    config_name: `Config ${id}`,
    s3_access_key: 'access',
    s3_access_secret: 'secret',
    s3_endpoint: 'https://s3.example.com',
    s3_region: 'us-east-1',
    s3_bucket: `bucket-${id}`,
    s3_public_end_point: 'https://cdn.example.com',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}