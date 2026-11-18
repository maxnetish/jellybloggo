import { S3Config } from '../../model/s3-config';

export interface S3ConfigEditInputs {
  config?: S3Config;
}

export interface S3ConfigEditOutputs {
  option: 'ok' | 'cancel';
  config?: S3Config | null;
}
