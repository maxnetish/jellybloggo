import { Component, inject, input } from '@angular/core';
import { S3DirectoryBrowserStore } from './s3-directory-browser.store';
import { S3Config } from '../../model/s3-config';
import { JsonPipe } from '@angular/common';

@Component({
  imports: [
    JsonPipe,
  ],
  selector: 'app-s3-directory-browser',
  styleUrl: './s3-directory-browser.scss',
  templateUrl: './s3-directory-browser.html',
  providers: [
    S3DirectoryBrowserStore,
  ]
})
export class S3DirectoryBrowser {
  private readonly store = inject(S3DirectoryBrowserStore);

  readonly bucket = input<S3Config | null>();

  constructor() {
    this.store.wireBucket(this.bucket);
  }

}
