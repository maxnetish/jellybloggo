import { Component, inject, input } from '@angular/core';
import { S3BucketBrowserStore } from './s3-bucket-browser.store';
import { S3Config } from '../../model/s3-config';
import { TuiIcon, TuiLink } from '@taiga-ui/core';
import { TuiElasticContainer } from '@taiga-ui/layout';
import { TuiTable } from '@taiga-ui/addon-table';
import { FuncToPipePipe } from '../../../utils/func-to-pipe';
import { DatePipe, DecimalPipe } from '@angular/common';
import { S3Object } from '@bradenmacdonald/s3-lite-client';
import { tuiBreadcrumbsOptionsProvider } from '@taiga-ui/kit';
import { TuiBreadcrumbs } from '@taiga-ui/kit/components/breadcrumbs';
import { TuiItem } from '@taiga-ui/cdk/directives/item';
import { TuiCopy } from '@taiga-ui/kit';

@Component({
  imports: [
    TuiIcon,
    TuiElasticContainer,
    TuiTable,
    FuncToPipePipe,
    DatePipe,
    DecimalPipe,
    TuiCopy,
    TuiLink,
    TuiBreadcrumbs,
    TuiItem,
  ],
  selector: 'app-s3-bucket-browser',
  styleUrl: './s3-bucket-browser.scss',
  templateUrl: './s3-bucket-browser.html',
  providers: [
    tuiBreadcrumbsOptionsProvider({icon: '/'}),
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

  protected readonly getFileUrl = (entry: S3Object): string => {
    const bucket = this.store.bucket();
    if (!bucket) {
      return '';
    }
    const endpoint = bucket.s3_public_end_point.replace(/\/+$/, '');
    const bucketName = bucket.s3_bucket;
    const key = entry.key;
    return `${endpoint}/${bucketName}/${key}`;
  };

}
