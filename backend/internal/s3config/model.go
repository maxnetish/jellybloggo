package s3config

import (
	"time"
)

type S3Config struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	ConfigName    string    `json:"config_name"`
	S3AccessKey   string    `json:"s3_access_key"`
	S3AccessSecret string   `json:"-"`
	S3Endpoint    *string   `json:"s3_endpoint,omitempty"`
	S3Region      *string   `json:"s3_region,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type CreateS3ConfigRequest struct {
	ConfigName    string  `json:"config_name" v8:"required,max=100"`
	S3AccessKey   string  `json:"s3_access_key" v8:"required,max=255"`
	S3AccessSecret string  `json:"s3_access_secret" v8:"required,max=500"`
	S3Endpoint    *string `json:"s3_endpoint,omitempty" v8:"omitempty,url,max=500"`
	S3Region      *string `json:"s3_region,omitempty" v8:"omitempty,max=50"`
}

type UpdateS3ConfigRequest struct {
	ConfigName    *string `json:"config_name,omitempty" v8:"omitempty,max=100"`
	S3AccessKey   *string `json:"s3_access_key,omitempty" v8:"omitempty,max=255"`
	S3AccessSecret *string `json:"s3_access_secret,omitempty" v8:"omitempty,max=500"`
	S3Endpoint    *string `json:"s3_endpoint,omitempty" v8:"omitempty,url,max=500"`
	S3Region      *string `json:"s3_region,omitempty" v8:"omitempty,max=50"`
}

type S3ConfigResponse struct {
	ID            string    `json:"id"`
	ConfigName    string    `json:"config_name"`
	S3AccessKey   string    `json:"s3_access_key"`
	S3AccessSecret string   `json:"s3_access_secret"`
	S3Endpoint    *string   `json:"s3_endpoint,omitempty"`
	S3Region      *string   `json:"s3_region,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func ToResponse(c *S3Config) S3ConfigResponse {
	return S3ConfigResponse{
		ID:             c.ID,
		ConfigName:     c.ConfigName,
		S3AccessKey:    c.S3AccessKey,
		S3AccessSecret: c.S3AccessSecret,
		S3Endpoint:     c.S3Endpoint,
		S3Region:       c.S3Region,
		CreatedAt:      c.CreatedAt,
		UpdatedAt:      c.UpdatedAt,
	}
}