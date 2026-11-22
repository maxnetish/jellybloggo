import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { S3Object } from '@bradenmacdonald/s3-lite-client';
import {
  TuiAppearance,
  TuiButton,
  TuiDataList,
  TuiDropdown,
  TuiIcon,
  TuiLink,
} from '@taiga-ui/core';

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
  readonly file = input.required<S3Object>();
  readonly copy = output<S3Object>();
  readonly delete = output<S3Object>();

  protected readonly dropdownOpen = signal(false);

  protected onCopy(): void {
    this.dropdownOpen.set(false);
    this.copy.emit(this.file());
  }

  protected onDelete(): void {
    this.dropdownOpen.set(false);
    this.delete.emit(this.file());
  }
}
