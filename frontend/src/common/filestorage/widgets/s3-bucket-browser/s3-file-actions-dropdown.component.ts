import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { S3Object } from '@bradenmacdonald/s3-lite-client';
import { TuiAppearance, TuiButton, TuiDataList, TuiDropdown, TuiIcon } from '@taiga-ui/core';

@Component({
  selector: 'app-s3-file-actions-dropdown',
  imports: [TuiAppearance, TuiButton, TuiDataList, TuiDropdown, TuiIcon],
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
        <button tuiOption tuiAppearance="flat-destructive" type="button" (click)="onDelete()">
          <tui-icon icon="@tui.trash" />
          Delete
        </button>
      </tui-data-list>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class S3FileActionsDropdownComponent {
  readonly file = input.required<S3Object>();
  readonly delete = output<S3Object>();

  protected readonly dropdownOpen = signal(false);

  protected onDelete(): void {
    this.dropdownOpen.set(false);
    this.delete.emit(this.file());
  }
}
