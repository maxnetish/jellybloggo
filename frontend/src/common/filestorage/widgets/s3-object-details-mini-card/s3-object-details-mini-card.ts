import { Component, computed, inject, input } from '@angular/core';
import { S3ObjectStatus } from '@bradenmacdonald/s3-lite-client';
import { TuiLoader } from '@taiga-ui/core';
import { TuiChip } from '@taiga-ui/kit';
import { S3BucketBrowserStore } from '../s3-bucket-browser/s3-bucket-browser.store';

@Component({
  imports: [
    TuiLoader,
    TuiChip,
  ],
  selector: 'app-s3-object-details-mini-card',
  styleUrl: './s3-object-details-mini-card.scss',
  templateUrl: './s3-object-details-mini-card.html',
})
export class S3ObjectDetailsMiniCard {
  private readonly store = inject(S3BucketBrowserStore);
  readonly details = input<S3ObjectStatus | null>();

  protected readonly attributes = computed(() => {
    const details = this.details();

    if (!details) {
      return [];
    }

    return Object.entries(details.metadata).map(([name, value]) => {
      return {
        name,
        value: decodeURIComponent(value || ''),
      };
    })
  });

  protected readonly isImage = computed(() => {
    return this.details()?.metadata['Content-Type']?.startsWith('image');
  });

  protected readonly imageUrl = computed (() => {
    const bucket = this.store.bucket();
    const details = this.details();
    if (!bucket || !details) {
      return '';
    }
    const endpoint = bucket.s3_public_end_point.replace(/\/+$/, '');
    const bucketName = bucket.s3_bucket;
    const key = details.key;
    return `${endpoint}/${bucketName}/${key}`;
  });
}
