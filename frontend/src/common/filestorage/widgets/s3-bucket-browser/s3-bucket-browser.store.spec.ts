import { TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import { TuiNotificationService } from '@taiga-ui/core';
import { S3BucketBrowserStore } from './s3-bucket-browser.store';
import { S3Config } from '../../model/s3-config';
import type { S3CommonPrefix, S3Object } from '@bradenmacdonald/s3-lite-client';

type Store = InstanceType<typeof S3BucketBrowserStore>;

// Create mock client methods at module level so they survive across test runs.
const mockPutObject = vi.fn();
const mockDeleteObject = vi.fn();
const mockCopyObject = vi.fn();
const mockListObjectsGrouped = vi.fn().mockImplementation(async function* () {});

// Mock the S3Client class at the npm-module level (Angular allows vi.mock for non-relative imports).
vi.mock('@bradenmacdonald/s3-lite-client', () => ({
  S3Client: class {
    putObject = mockPutObject;
    deleteObject = mockDeleteObject;
    copyObject = mockCopyObject;
    listObjectsGrouped = mockListObjectsGrouped as unknown as () => AsyncGenerator<S3CommonPrefix | S3Object, string | undefined>;
  },
}));

const mockBucket: S3Config = {
  id: 'cfg-1',
  config_name: 'Test',
  s3_access_key: 'access',
  s3_access_secret: 'secret',
  s3_endpoint: 'https://s3.example.com',
  s3_region: 'us-east-1',
  s3_bucket: 'bucket',
  s3_public_end_point: 'https://cdn.example.com',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('S3BucketBrowserStore', () => {
  let store: Store;
  let notificationOpen: ReturnType<typeof vi.fn>;

  function createStore(): Store {
    notificationOpen = vi.fn().mockReturnValue({ subscribe: vi.fn() });

    TestBed.configureTestingModule({
      providers: [
        { provide: TuiNotificationService, useValue: { open: notificationOpen } },
      ],
    });

    return TestBed.inject(S3BucketBrowserStore);
  }

  function setState(partial: {
    bucket?: S3Config | null;
    currentPrefix?: string;
    entries?: (S3CommonPrefix | S3Object)[];
    busy?: boolean;
  }) {
    patchState(unprotected(store), {
      bucket: partial.bucket ?? null,
      currentPrefix: partial.currentPrefix ?? '',
      entries: partial.entries ?? [],
      busy: partial.busy ?? false,
    });
  }

  beforeEach(() => {
    mockPutObject.mockReset().mockResolvedValue({ etag: '"mock"' });
    mockDeleteObject.mockReset().mockResolvedValue(undefined);
    mockCopyObject.mockReset().mockResolvedValue({
      etag: '"copied"',
      versionId: null,
      lastModified: new Date('2026-02-01T00:00:00Z'),
      copySourceVersionId: null,
    });
    mockListObjectsGrouped.mockReset().mockImplementation(async function* () {});
    store = createStore();
  });

  describe('canDeleteCurrentFolder', () => {
    it('returns false for the root directory', () => {
      setState({ currentPrefix: '', entries: [] });

      expect(store.canDeleteCurrentFolder()).toBe(false);
    });

    it('returns false when the current directory is not empty', () => {
      setState({
        currentPrefix: 'photos/',
        entries: [
          {
            type: 'Object',
            key: 'photos/file.txt',
            etag: '',
            size: 100,
            lastModified: new Date(),
          },
        ],
      });

      expect(store.canDeleteCurrentFolder()).toBe(false);
    });

    it('returns true for an empty nested directory', () => {
      setState({ currentPrefix: 'photos/', entries: [] });

      expect(store.canDeleteCurrentFolder()).toBe(true);
    });
  });

  describe('createFolder', () => {
    it('returns false when no bucket is configured', async () => {
      setState({ bucket: null, currentPrefix: '' });

      const result = await store.createFolder('new-folder');

      expect(result).toBe(false);
    });

    it('returns false for an empty name', async () => {
      setState({ bucket: mockBucket, currentPrefix: '' });

      const result = await store.createFolder('');

      expect(result).toBe(false);
    });

    it('returns false for a whitespace-only name', async () => {
      setState({ bucket: mockBucket, currentPrefix: '' });

      const result = await store.createFolder('   ');

      expect(result).toBe(false);
    });

    it('puts an empty marker object for the new prefix', async () => {
      setState({ bucket: mockBucket, currentPrefix: 'photos/', entries: [] });

      await store.createFolder('vacation');

      expect(mockPutObject).toHaveBeenCalledWith('photos/vacation/', '');
    });

    it('adds the new CommonPrefix at the beginning of entries on success', async () => {
      setState({
        bucket: mockBucket,
        currentPrefix: 'photos/',
        entries: [
          {
            type: 'Object',
            key: 'photos/file.txt',
            etag: '',
            size: 10,
            lastModified: new Date(),
          },
        ],
      });

      const result = await store.createFolder('vacation');

      expect(result).toBe(true);
      expect(store.entries()).toHaveLength(2);
      expect(store.entries()[0]).toEqual({
        type: 'CommonPrefix',
        prefix: 'photos/vacation/',
      });
    });

    it('creates a top-level folder when in root', async () => {
      setState({ bucket: mockBucket, currentPrefix: '', entries: [] });

      const result = await store.createFolder('new-folder');

      expect(result).toBe(true);
      expect(mockPutObject).toHaveBeenCalledWith('new-folder/', '');
      expect(store.entries()[0]).toEqual({
        type: 'CommonPrefix',
        prefix: 'new-folder/',
      });
    });

    it('shows an error toast and keeps entries on S3 failure', async () => {
      mockPutObject.mockRejectedValueOnce(new Error('S3 Error: Access Denied'));
      setState({ bucket: mockBucket, currentPrefix: 'photos/', entries: [] });

      const result = await store.createFolder('restricted');

      expect(result).toBe(false);
      expect(store.entries()).toEqual([]);
      expect(notificationOpen).toHaveBeenCalledWith(
        'S3 Error: Access Denied',
        expect.objectContaining({ appearance: 'negative', label: 'S3 Error' }),
      );
    });

    it('sets busy during the operation', async () => {
      setState({ bucket: mockBucket, currentPrefix: 'photos/', entries: [] });

      const promise = store.createFolder('new');
      expect(store.busy()).toBe(true);

      await promise;

      expect(store.busy()).toBe(false);
    });
  });

  describe('deleteCurrentFolder', () => {
    it('returns false when no bucket is configured', async () => {
      setState({ bucket: null, currentPrefix: 'photos/' });

      const result = await store.deleteCurrentFolder();

      expect(result).toBe(false);
    });

    it('returns false for the root directory', async () => {
      setState({ bucket: mockBucket, currentPrefix: '' });

      const result = await store.deleteCurrentFolder();

      expect(result).toBe(false);
    });

    it('deletes the marker object of the current prefix and navigates to the parent', async () => {
      setState({ bucket: mockBucket, currentPrefix: 'photos/vacation/', entries: [] });

      const result = await store.deleteCurrentFolder();

      expect(result).toBe(true);
      expect(mockDeleteObject).toHaveBeenCalledWith('photos/vacation/');
      await vi.waitFor(() => {
        expect(store.currentPrefix()).toBe('photos/');
      });
      expect(mockListObjectsGrouped).toHaveBeenCalledWith({
        prefix: 'photos/',
        delimiter: '/',
      });
    });

    it('does not navigate up on S3 failure', async () => {
      mockDeleteObject.mockRejectedValueOnce(new Error('S3 Error: Object not found'));
      setState({ bucket: mockBucket, currentPrefix: 'photos/vacation/', entries: [] });

      const result = await store.deleteCurrentFolder();

      expect(result).toBe(false);
      expect(store.currentPrefix()).toBe('photos/vacation/');
      expect(mockListObjectsGrouped).not.toHaveBeenCalled();
      expect(notificationOpen).toHaveBeenCalledWith(
        'S3 Error: Object not found',
        expect.objectContaining({ appearance: 'negative', label: 'S3 Error' }),
      );
    });

    it('sets busy during the operation', async () => {
      setState({ bucket: mockBucket, currentPrefix: 'photos/', entries: [] });

      const promise = store.deleteCurrentFolder();
      expect(store.busy()).toBe(true);

      await promise;

      expect(store.busy()).toBe(false);
    });
  });

  describe('deleteFile', () => {
    it('returns false when no bucket is configured', async () => {
      setState({ bucket: null, entries: [] });

      await expect(store.deleteFile('photos/vacation/image.jpg')).rejects.toThrow('Missing bucket config');
    });

    it('deletes the file from entries on success', async () => {
      const entries: (S3CommonPrefix | S3Object)[] = [
        {
          type: 'Object',
          key: 'photos/vacation/image.jpg',
          etag: '',
          size: 100,
          lastModified: new Date(),
        },
        {
          type: 'Object',
          key: 'photos/vacation/thumb.png',
          etag: '',
          size: 50,
          lastModified: new Date(),
        },
      ];
      setState({ bucket: mockBucket, currentPrefix: 'photos/vacation/', entries });

      const result = await store.deleteFile('photos/vacation/image.jpg');

      expect(result).toBe(true);
      expect(mockDeleteObject).toHaveBeenCalledWith('photos/vacation/image.jpg');
      expect(store.entries()).toHaveLength(1);
      expect(store.entries()[0]).toEqual({
        type: 'Object',
        key: 'photos/vacation/thumb.png',
        etag: '',
        size: 50,
        lastModified: expect.any(Date),
      });
    });

    it('keeps remaining entries when S3 returns error', async () => {
      mockDeleteObject.mockRejectedValueOnce(new Error('S3 Error: Access Denied'));
      const entries: (S3CommonPrefix | S3Object)[] = [
        {
          type: 'Object',
          key: 'photos/vacation/image.jpg',
          etag: '',
          size: 100,
          lastModified: new Date(),
        },
      ];
      setState({ bucket: mockBucket, currentPrefix: 'photos/vacation/', entries });

      const result = await store.deleteFile('photos/vacation/image.jpg');

      expect(result).toBe(false);
      expect(store.entries()).toEqual(entries);
      expect(notificationOpen).toHaveBeenCalledWith(
        'S3 Error: Access Denied',
        expect.objectContaining({ appearance: 'negative', label: 'S3 Error' }),
      );
    });

    it('sets busy during the operation', async () => {
      const entries: (S3CommonPrefix | S3Object)[] = [
        {
          type: 'Object',
          key: 'photos/vacation/image.jpg',
          etag: '',
          size: 100,
          lastModified: new Date(),
        },
      ];
      setState({ bucket: mockBucket, currentPrefix: 'photos/vacation/', entries });

      const promise = store.deleteFile('photos/vacation/image.jpg');
      expect(store.busy()).toBe(true);

      await promise;

      expect(store.busy()).toBe(false);
    });
  });

  describe('copyFile', () => {
    const sourceFile: S3Object = {
      type: 'Object',
      key: 'photos/vacation/image.jpg',
      etag: '',
      size: 100,
      lastModified: new Date('2026-01-01T00:00:00Z'),
    };

    it('throws when no bucket is configured', async () => {
      setState({ bucket: null, entries: [] });

      await expect(store.copyFile(sourceFile, 'copy.jpg')).rejects.toThrow('Missing bucket config');
    });

    it('copies the file and appends the new entry', async () => {
      setState({ bucket: mockBucket, currentPrefix: 'photos/vacation/', entries: [sourceFile] });

      const result = await store.copyFile(sourceFile, 'copy.jpg');

      expect(result).toBe(true);
      expect(mockCopyObject).toHaveBeenCalledWith(
        { sourceKey: 'photos/vacation/image.jpg' },
        'photos/vacation/copy.jpg',
      );
      expect(store.entries()).toEqual([
        sourceFile,
        {
          type: 'Object',
          key: 'photos/vacation/copy.jpg',
          size: 100,
          etag: '"copied"',
          lastModified: new Date('2026-02-01T00:00:00Z'),
        },
      ]);
    });


    it('keeps entries untouched and shows a toast on S3 failure', async () => {
      mockCopyObject.mockRejectedValueOnce(new Error('S3 Error: Access Denied'));
      setState({ bucket: mockBucket, currentPrefix: 'photos/vacation/', entries: [sourceFile] });

      const result = await store.copyFile(sourceFile, 'copy.jpg');

      expect(result).toBe(false);
      expect(store.entries()).toEqual([sourceFile]);
      expect(notificationOpen).toHaveBeenCalledWith(
        'S3 Error: Access Denied',
        expect.objectContaining({ appearance: 'negative', label: 'S3 Error' }),
      );
    });

    it('sets busy during the operation', async () => {
      setState({ bucket: mockBucket, currentPrefix: 'photos/vacation/', entries: [sourceFile] });

      const promise = store.copyFile(sourceFile, 'copy.jpg');
      expect(store.busy()).toBe(true);

      await promise;

      expect(store.busy()).toBe(false);
    });
  });
});
