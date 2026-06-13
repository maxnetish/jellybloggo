CREATE TABLE user_s3_configs (
    id             TEXT NOT NULL PRIMARY KEY,
    user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    config_name    TEXT NOT NULL,
    s3_access_key  TEXT NOT NULL,
    s3_access_secret TEXT NOT NULL,
    s3_endpoint    TEXT,
    s3_region      TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_s3_configs_user_id ON user_s3_configs(user_id);