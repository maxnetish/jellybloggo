import { S3Client } from '@bradenmacdonald/s3-lite-client';
import { S3Config } from './model/s3-config';

/**
 * Creates an S3 client for a user-configured bucket.
 */
export function createS3Client(bucket: S3Config): S3Client {
  if (!bucket.s3_endpoint) {
    throw new Error('Missing s3_endpoint');
  }

  return new S3Client({
    endPoint: bucket.s3_endpoint,
    region: bucket.s3_region || 'us-east-1',
    bucket: bucket.s3_bucket,
    accessKey: bucket.s3_access_key,
    secretKey: bucket.s3_access_secret,
  });
}
