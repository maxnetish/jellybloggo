import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { S3Object } from '@bradenmacdonald/s3-lite-client';
import {
  TuiAppearance,
  TuiButton,
  TuiDataList, TuiDialogService,
  TuiDropdown,
  TuiIcon,
  TuiLink,
} from '@taiga-ui/core';
import { S3BucketBrowserStore } from './s3-bucket-browser.store';
import { S3FileCopyModal } from '../s3-file-copy/s3-file-copy.modal';
import { TUI_CONFIRM, TuiConfirmData } from '@taiga-ui/kit';
import { filter } from 'rxjs';
import { lastSegmentOf } from '../../model/s3-path';
import { UnwrapArrayType } from '../../../utils/unwrap-array-type';
import { UpwrapSignalType } from '../../../utils/upwrap-signal-type';

@Component({
  selector: 'app-s3-file-actions-dropdown',
  imports: [TuiAppearance, TuiButton, TuiDataList, TuiDropdown, TuiIcon, TuiLink],
  template: `
    <button
      tuiIconButton
      appearance="flat"
      iconStart="@tui.more-vertical"
      size="s"
      type="button"
      aria-label="File actions"
      tuiDropdownAlign="end"
      [tuiDropdown]="dropdownContent"
      [tuiDropdownOpen]="dropdownOpen()"
      (tuiDropdownOpenChange)="dropdownOpen.set($event)"
    ></button>

    <ng-template #dropdownContent>
      <tui-data-list size="s">
        <button tuiOption tuiLink type="button" (click)="onToggleDetails()">
          <tui-icon [icon]="file().detailsExpanded ? '@tui.list-chevrons-down-up' : '@tui.list-chevrons-up-down'" [style.font-size.px]="16" />
          Details
        </button>
        <button tuiOption tuiLink type="button" (click)="onCopy()">
          <tui-icon icon="@tui.copy" [style.font-size.px]="16" />
          Copy
        </button>
        <button
          tuiOption
          tuiAppearance="flat-destructive"
          tuiLink
          type="button"
          (click)="onDelete()"
        >
          <tui-icon icon="@tui.trash" [style.font-size.px]="16" />
          Delete
        </button>
      </tui-data-list>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class S3FileActionsDropdownComponent {
  private readonly dialogs = inject(TuiDialogService);
  private readonly store = inject(S3BucketBrowserStore);
  private readonly s3FileCopyModal = inject(S3FileCopyModal);
  readonly file = input.required<UnwrapArrayType<UpwrapSignalType<typeof this.store.files>>>();

  protected readonly dropdownOpen = signal(false);

  protected onCopy(): void {
    this.dropdownOpen.set(false);
    this.s3FileCopyModal.show(this.file()).subscribe();
  }

  protected onDelete(): void {
    this.dropdownOpen.set(false);

    const file = this.file();
    const fileName = lastSegmentOf(file.key);
    this.dialogs.open<boolean>(TUI_CONFIRM, {
      label: 'Delete file',
      size: 's',
      data: {
        content: `Are you sure you want to permanently delete the file <strong>${fileName}</strong>?`,
        yes: 'Delete',
        no: 'Cancel',
        appearance: 'primary-destructive',
      } satisfies TuiConfirmData,
    }).pipe(filter(Boolean)).subscribe(() => {
      this.store.deleteFile(file.key);
    });
  }

  protected onToggleDetails() {
    this.dropdownOpen.set(false);
    const file = this.file();
    this.store.toggleFileDetails(file);
  }
}
