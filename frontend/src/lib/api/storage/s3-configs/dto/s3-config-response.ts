export interface S3ConfigResponse {
  id: string;
  config_name: string;
  s3_access_key: string;
  s3_access_secret: string;
  s3_endpoint?: string | null;
  s3_region?: string | null;
  s3_bucket: string;
  s3_public_end_point: string;
  created_at: string;
  updated_at: string;
}
