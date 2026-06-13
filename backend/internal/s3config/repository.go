package s3config

import (
	"context"
	"database/sql"
	"fmt"
)

type S3ConfigRepository interface {
	Create(ctx context.Context, config *S3Config) (*S3Config, error)
	GetByID(ctx context.Context, id string) (*S3Config, error)
	GetByIDAndUserID(ctx context.Context, id, userID string) (*S3Config, error)
	ListByUserID(ctx context.Context, userID string) ([]*S3Config, error)
	Update(ctx context.Context, config *S3Config) (*S3Config, error)
	Delete(ctx context.Context, id string) error
}

type s3ConfigRepository struct {
	db *sql.DB
}

func NewS3ConfigRepository(db *sql.DB) S3ConfigRepository {
	return &s3ConfigRepository{db: db}
}

func (r *s3ConfigRepository) Create(ctx context.Context, config *S3Config) (*S3Config, error) {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO user_s3_configs (id, user_id, config_name, s3_access_key, s3_access_secret, s3_endpoint, s3_region, s3_bucket, s3_public_end_point)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		config.ID, config.UserID, config.ConfigName,
		config.S3AccessKey, config.S3AccessSecret,
		config.S3Endpoint, config.S3Region,
		config.S3Bucket, config.S3PublicEndPoint,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create s3 config: %w", err)
	}

	return r.GetByID(ctx, config.ID)
}

func (r *s3ConfigRepository) GetByID(ctx context.Context, id string) (*S3Config, error) {
	config := &S3Config{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, user_id, config_name, s3_access_key, s3_access_secret, s3_endpoint, s3_region, s3_bucket, s3_public_end_point, created_at, updated_at
		 FROM user_s3_configs WHERE id = ?`,
		id,
	).Scan(
		&config.ID, &config.UserID, &config.ConfigName,
		&config.S3AccessKey, &config.S3AccessSecret,
		&config.S3Endpoint, &config.S3Region,
		&config.S3Bucket, &config.S3PublicEndPoint,
		&config.CreatedAt, &config.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get s3 config by id: %w", err)
	}

	return config, nil
}

func (r *s3ConfigRepository) GetByIDAndUserID(ctx context.Context, id, userID string) (*S3Config, error) {
	config := &S3Config{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, user_id, config_name, s3_access_key, s3_access_secret, s3_endpoint, s3_region, s3_bucket, s3_public_end_point, created_at, updated_at
		 FROM user_s3_configs WHERE id = ? AND user_id = ?`,
		id, userID,
	).Scan(
		&config.ID, &config.UserID, &config.ConfigName,
		&config.S3AccessKey, &config.S3AccessSecret,
		&config.S3Endpoint, &config.S3Region,
		&config.S3Bucket, &config.S3PublicEndPoint,
		&config.CreatedAt, &config.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get s3 config by id and user_id: %w", err)
	}

	return config, nil
}

func (r *s3ConfigRepository) ListByUserID(ctx context.Context, userID string) ([]*S3Config, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, user_id, config_name, s3_access_key, s3_access_secret, s3_endpoint, s3_region, s3_bucket, s3_public_end_point, created_at, updated_at
		 FROM user_s3_configs WHERE user_id = ? ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to list s3 configs: %w", err)
	}
	defer rows.Close()

	var configs []*S3Config
	for rows.Next() {
		config := &S3Config{}
		if err := rows.Scan(
			&config.ID, &config.UserID, &config.ConfigName,
			&config.S3AccessKey, &config.S3AccessSecret,
			&config.S3Endpoint, &config.S3Region,
			&config.S3Bucket, &config.S3PublicEndPoint,
			&config.CreatedAt, &config.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan s3 config: %w", err)
		}
		configs = append(configs, config)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to iterate s3 configs: %w", err)
	}

	if configs == nil {
		configs = []*S3Config{}
	}

	return configs, nil
}

func (r *s3ConfigRepository) Update(ctx context.Context, config *S3Config) (*S3Config, error) {
	_, err := r.db.ExecContext(ctx,
		`UPDATE user_s3_configs
		 SET config_name = ?, s3_access_key = ?, s3_access_secret = ?, s3_endpoint = ?, s3_region = ?, s3_bucket = ?, s3_public_end_point = ?, updated_at = CURRENT_TIMESTAMP
		 WHERE id = ?`,
		config.ConfigName, config.S3AccessKey, config.S3AccessSecret,
		config.S3Endpoint, config.S3Region,
		config.S3Bucket, config.S3PublicEndPoint, config.ID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update s3 config: %w", err)
	}

	return r.GetByID(ctx, config.ID)
}

func (r *s3ConfigRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM user_s3_configs WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("failed to delete s3 config: %w", err)
	}
	return nil
}