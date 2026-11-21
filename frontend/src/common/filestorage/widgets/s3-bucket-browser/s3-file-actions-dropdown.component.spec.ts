import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTaiga, TuiRoot } from '@taiga-ui/core';
import type { S3Object } from '@bradenmacdonald/s3-lite-client';
import { S3FileActionsDropdownComponent } from './s3-file-actions-dropdown.component';

const file: S3Object = {
  type: 'Object',
  key: 'path/file.txt',
  etag: '',
  size: 10,
  lastModified: new Date(),
};

@Component({
  imports: [TuiRoot, S3FileActionsDropdownComponent],
  template: `
    <tui-root>
      <app-s3-file-actions-dropdown [file]="file" />
    </tui-root>
  `,
})
class Host {
  protected readonly file = file;
}

describe('S3FileActionsDropdownComponent', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideTaiga()],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  function component(): S3FileActionsDropdownComponent {
    return fixture.debugElement.query(By.directive(S3FileActionsDropdownComponent)).componentInstance;
  }

  function trigger(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('app-s3-file-actions-dropdown > button');
  }

  function deleteButton(): HTMLButtonElement | undefined {
    return Array.from<HTMLButtonElement>(document.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Delete',
    );
  }

  it('opens the dropdown on trigger click', async () => {
    trigger().click();
    await fixture.whenStable();

    expect(deleteButton()).toBeTruthy();
  });

  it('renders the delete option in a destructive style', async () => {
    trigger().click();
    await fixture.whenStable();

    expect(deleteButton()?.getAttribute('data-appearance')).toBe('flat-destructive');
  });

  it('closes the dropdown and emits the file on delete', async () => {
    const deleted: S3Object[] = [];
    component().delete.subscribe((value) => deleted.push(value));

    trigger().click();
    await fixture.whenStable();

    deleteButton()?.click();
    await fixture.whenStable();

    expect(deleted).toEqual([file]);
    expect(deleteButton()).toBeUndefined();
  });
});
