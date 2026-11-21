export interface S3FolderCreateInputs {
  existingNames: ReadonlySet<string>;
  /**
   * Narrow interface of S3BucketBrowserStore used by the dialog.
   * Keeps the dialog and its form testable without the signal store.
   */
  store: { createFolder(name: string): Promise<boolean> };
}

export interface S3FolderCreateOutputs {
  option: 'ok' | 'cancel';
}
