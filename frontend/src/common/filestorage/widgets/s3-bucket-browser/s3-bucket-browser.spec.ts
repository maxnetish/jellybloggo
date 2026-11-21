import { ComponentFixture, TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import { of } from 'rxjs';
import type { S3CommonPrefix, S3Object } from '@bradenmacdonald/s3-lite-client';
import { S3BucketBrowser } from './s3-bucket-browser';
import { S3BucketBrowserStore, buildBreadcrumbs } from './s3-bucket-browser.store';
import { S3FolderCreateModal } from '../s3-folder-create/s3-folder-create.modal';

describe('S3DirectoryBrowser', () => {
  let component: S3BucketBrowser;
  let fixture: ComponentFixture<S3BucketBrowser>;
  let store: InstanceType<typeof S3BucketBrowserStore>;
  let folderCreateShow: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    folderCreateShow = vi.fn(() => of({option: 'cancel'}));

    await TestBed.configureTestingModule({
      imports: [S3BucketBrowser],
      providers: [
        {provide: S3FolderCreateModal, useValue: {show: folderCreateShow}},
      ],
    }).compileComponents();

    // Resolve the root store first and mock wireBucket so the component
    // constructor does not trigger S3 loading and TuiNotificationService.
    store = TestBed.inject(S3BucketBrowserStore);
    vi.spyOn(store, 'wireBucket').mockReturnValue({destroy: () => undefined});

    fixture = TestBed.createComponent(S3BucketBrowser);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function findButton(text: string): HTMLButtonElement | undefined {
    return Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((button) => button.textContent?.trim() === text);
  }

  function render(state: {currentPrefix: string; entries?: (S3CommonPrefix | S3Object)[]}): void {
    patchState(unprotected(store), {
      bucket: null,
      currentPrefix: state.currentPrefix,
      entries: state.entries ?? [],
    });
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build only root breadcrumb for empty prefix', () => {
    expect(buildBreadcrumbs('')).toEqual([{label: 'Root', prefix: ''}]);
  });

  it('should build cumulative prefixes for nested prefix', () => {
    expect(buildBreadcrumbs('path/to/folder/')).toEqual([
      {label: 'Root', prefix: ''},
      {label: 'path', prefix: 'path/'},
      {label: 'to', prefix: 'path/to/'},
      {label: 'folder', prefix: 'path/to/folder/'},
    ]);
  });

  it('should render root as text without buttons', () => {
    patchState(unprotected(store), {
      bucket: null,
      currentPrefix: '',
      entries: [],
    });
    fixture.detectChanges();

    const breadcrumbs: HTMLElement = fixture.nativeElement.querySelector('tui-breadcrumbs');

    expect(breadcrumbs.textContent).toContain('Root');
    expect(breadcrumbs.querySelectorAll('button')).toHaveLength(0);
  });

  it('should render buttons for parent segments and text for current one', () => {
    patchState(unprotected(store), {
      bucket: null,
      currentPrefix: 'path/to/folder/',
      entries: [],
    });
    fixture.detectChanges();

    const breadcrumbs: HTMLElement = fixture.nativeElement.querySelector('tui-breadcrumbs');
    const buttons = Array.from(breadcrumbs.querySelectorAll('button'));

    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      'Root',
      'path',
      'to',
    ]);
    expect(breadcrumbs.querySelector('.path-current')?.textContent).toContain('folder');
  });

  it('should navigate to a parent prefix on breadcrumb click', () => {
    patchState(unprotected(store), {
      bucket: null,
      currentPrefix: 'path/to/folder/',
      entries: [],
    });
    fixture.detectChanges();

    const choosePrefix = vi
      .spyOn(store, 'choosePrefix')
      .mockReturnValue({destroy: () => undefined});
    const breadcrumbs: HTMLElement = fixture.nativeElement.querySelector('tui-breadcrumbs');
    const pathButton = Array.from(breadcrumbs.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'path',
    ) as HTMLButtonElement;

    pathButton.click();

    expect(choosePrefix).toHaveBeenCalledWith('path/');
  });

  describe('create folder', () => {
    it('shows the create button in any directory', () => {
      render({currentPrefix: ''});

      expect(findButton('Create folder')).toBeTruthy();
    });

    it('opens the create folder dialog on click', () => {
      render({currentPrefix: 'path/'});

      findButton('Create folder')?.click();

      expect(folderCreateShow).toHaveBeenCalledTimes(1);
    });

    it('disables the create button while a folder operation is in progress', () => {
      render({currentPrefix: 'path/'});
      patchState(unprotected(store), {busy: true});
      fixture.detectChanges();

      expect(findButton('Create folder')?.disabled).toBe(true);
    });
  });

  describe('file actions', () => {
    it('renders the actions dropdown for file rows', () => {
      render({
        currentPrefix: 'path/',
        entries: [{
          type: 'Object',
          key: 'path/file.txt',
          etag: '',
          size: 10,
          lastModified: new Date(),
        }],
      });

      const fileRow = fixture.nativeElement.querySelector('.file-row') as HTMLElement;

      expect(fileRow.querySelector('app-s3-file-actions-dropdown')).toBeTruthy();
    });

    it('does not render the actions dropdown for directory rows', () => {
      render({
        currentPrefix: 'path/',
        entries: [{type: 'CommonPrefix', prefix: 'path/nested/'}],
      });

      const dirRow = fixture.nativeElement.querySelector('.directory-row') as HTMLElement;

      expect(dirRow.querySelector('app-s3-file-actions-dropdown')).toBeFalsy();
    });
  });

  describe('delete empty folder', () => {
    it('is hidden in the root directory', () => {
      render({currentPrefix: '', entries: []});

      expect(findButton('Delete empty folder')).toBeUndefined();
    });

    it('is hidden when the current directory is not empty', () => {
      render({
        currentPrefix: 'path/',
        entries: [{
          type: 'Object',
          key: 'path/file.txt',
          etag: '',
          size: 10,
          lastModified: new Date(),
        }],
      });

      expect(findButton('Delete empty folder')).toBeUndefined();
    });

    it('is shown for an empty nested directory', () => {
      render({currentPrefix: 'path/to/'});

      expect(findButton('Delete empty folder')).toBeTruthy();
    });

    it('calls deleteCurrentFolder on click', () => {
      render({currentPrefix: 'path/to/'});
      const deleteCurrentFolder = vi
        .spyOn(store, 'deleteCurrentFolder')
        .mockResolvedValue(true);

      findButton('Delete empty folder')?.click();

      expect(deleteCurrentFolder).toHaveBeenCalledTimes(1);
    });

    it('disables the delete button while a folder operation is in progress', () => {
      render({currentPrefix: 'path/to/'});
      patchState(unprotected(store), {busy: true});
      fixture.detectChanges();

      expect(findButton('Delete empty folder')?.disabled).toBe(true);
    });
  });
});
