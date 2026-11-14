export interface CreateS3ConfigRequest {
  config_name: string;
  s3_access_key: string;
  s3_access_secret: string;
  s3_endpoint?: string;
  s3_region?: string;
  s3_bucket: string;
  s3_public_end_point: string;
}

export interface UpdateS3ConfigRequest {
  config_name?: string;
  s3_access_key?: string;
  s3_access_secret?: string;
  s3_endpoint?: string;
  s3_region?: string;
  s3_bucket?: string;
  s3_public_end_point?: string;
}
