export interface S3NameDialogInputs {
  fieldLabel: string;
  placeholder: string;
  initialValue?: string;
  existingNames: ReadonlySet<string>;
  /**
   * Returns true when the name was accepted and the dialog can be closed.
   */
  submit: (name: string) => Promise<boolean>;
}

export interface S3NameDialogOutputs {
  option: 'ok' | 'cancel';
}
