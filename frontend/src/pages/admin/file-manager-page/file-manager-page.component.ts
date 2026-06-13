import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FileManagerComponent } from '../../../common/filestorage/widgets/file-manager/file-manager.component';

@Component({
  selector: 'app-file-manager-page',
  imports: [FileManagerComponent],
  template: `
    <app-file-manager></app-file-manager>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileManagerPageComponent {}
