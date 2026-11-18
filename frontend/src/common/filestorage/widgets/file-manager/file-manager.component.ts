import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { TuiAppearance, TuiButton, TuiIcon, TuiTitle } from '@taiga-ui/core';
import { TuiButtonGroup, TuiTreeComponent } from '@taiga-ui/kit';
import { S3ConfigService } from '../../s3config.service';
import { BehaviorSubject } from 'rxjs';
import { S3Treenode } from '../../model/s3-treenode';
import { AsyncPipe } from '@angular/common';
import { S3ConfigEditModal } from '../s3-config-edit/s3-config-edit.modal';
import { FileManagerStore } from './file-manager.store';

@Component({
  selector: 'app-file-manager',
  imports: [
    TuiCardLarge,
    TuiHeader,
    TuiTitle,
    TuiButtonGroup,
    TuiAppearance,
    TuiIcon,
    TuiTreeComponent,
    AsyncPipe,
  ],
  templateUrl: './file-manager.component.html',
  styleUrl: './file-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    FileManagerStore,
  ],
})
export class FileManagerComponent implements OnInit {
  protected readonly store = inject(FileManagerStore);

  private readonly s3ConfigEditModal = inject(S3ConfigEditModal);

  constructor() {
  }

  ngOnInit() {
    this.store.loadS3Configs();
  }

  protected openAddDialog(): void {
    this.s3ConfigEditModal.show({inputs: {}}).subscribe({
      next: (outputs) => {
        if (outputs.option === 'ok' && outputs.config) {
          this.store.updateOrAddS3Config(outputs.config);
        }
      },
      error: (err) => {
        console.warn(err);
      },
    });
  }

}
