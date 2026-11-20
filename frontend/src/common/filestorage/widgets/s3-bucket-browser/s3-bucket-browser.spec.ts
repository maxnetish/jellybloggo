import { ComponentFixture, TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';
import { S3BucketBrowser } from './s3-bucket-browser';
import { S3BucketBrowserStore, buildBreadcrumbs } from './s3-bucket-browser.store';

describe('S3DirectoryBrowser', () => {
  let component: S3BucketBrowser;
  let fixture: ComponentFixture<S3BucketBrowser>;
  let store: InstanceType<typeof S3BucketBrowserStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [S3BucketBrowser],
    }).compileComponents();

    fixture = TestBed.createComponent(S3BucketBrowser);
    component = fixture.componentInstance;
    // The store is provided on the component level, so it must be resolved
    // through the component injector.
    store = fixture.debugElement.injector.get(S3BucketBrowserStore);
    await fixture.whenStable();
  });

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
    patchState(unprotected(store), {currentPrefix: ''});
    fixture.detectChanges();

    const breadcrumbs: HTMLElement = fixture.nativeElement.querySelector('tui-breadcrumbs');

    expect(breadcrumbs.textContent).toContain('Root');
    expect(breadcrumbs.querySelectorAll('button')).toHaveLength(0);
  });

  it('should render buttons for parent segments and text for current one', () => {
    patchState(unprotected(store), {currentPrefix: 'path/to/folder/'});
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
    patchState(unprotected(store), {currentPrefix: 'path/to/folder/'});
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
});
