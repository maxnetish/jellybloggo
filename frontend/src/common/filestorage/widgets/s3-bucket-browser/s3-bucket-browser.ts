import { Component, inject, input } from '@angular/core';
import { S3BucketBrowserStore } from './s3-bucket-browser.store';
import { S3Config } from '../../model/s3-config';
import { TuiButton } from '@taiga-ui/core';
import { FuncToPipePipe } from '../../../utils/func-to-pipe';

@Component({
  imports: [
    TuiButton,
    FuncToPipePipe,
  ],
  selector: 'app-s3-bucket-browser',
  styleUrl: './s3-bucket-browser.scss',
  templateUrl: './s3-bucket-browser.html',
  providers: [
    S3BucketBrowserStore,
  ]
})
export class S3BucketBrowser {
  private readonly store = inject(S3BucketBrowserStore);

  readonly bucket = input<S3Config | null>();

  constructor() {
    this.store.wireBucket(this.bucket);
  }

  protected lastSegmentOf(path: string): string {
    return path.replace(/\/+$/, '').split('/').pop() ?? '';
  }

}
