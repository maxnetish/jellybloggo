ALTER TABLE user_s3_configs ADD COLUMN s3_bucket TEXT NOT NULL DEFAULT '';
ALTER TABLE user_s3_configs ADD COLUMN s3_public_end_point TEXT NOT NULL DEFAULT '';
