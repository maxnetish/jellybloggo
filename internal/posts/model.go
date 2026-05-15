package posts

import (
	"time"
)

type Post struct {
	ID           string
	OwnerID      int
	Author       *string
	Status       string
	Visibility   string
	ThumbnailURL *string
	Slug         string
	Title        string
	Annotation   *string
	Content      string
	ContentType  string
	Tags         []string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type CreatePostRequest struct {
	ID           string    `json:"id" v8:"required,alphanum,min=8,max=10"`
	Author       *string   `json:"author" v8:"omitempty,max=100"`
	ThumbnailURL *string   `json:"thumbnailUrl" v8:"omitempty,url,max=500"`
	Slug         string    `json:"slug" v8:"required,max=255,slug"`
	Title        string    `json:"title" v8:"required,max=500"`
	Annotation   *string   `json:"annotation" v8:"omitempty,max=1000"`
	Content      string    `json:"content" v8:"required,max=100000"`
	ContentType  string    `json:"contentType" v8:"required,oneof=html md"`
	Tags         []string  `json:"tags" v8:"omitempty,dive,max=50"`
}

type PostResponse struct {
	ID           string    `json:"id"`
	OwnerID      int       `json:"owner_id"`
	Author       *string   `json:"author"`
	Status       string    `json:"status"`
	Visibility   string    `json:"visibility"`
	ThumbnailURL *string   `json:"thumbnail_url"`
	Slug         string    `json:"slug"`
	Title        string    `json:"title"`
	Annotation   *string   `json:"annotation"`
	Content      string    `json:"content"`
	ContentType  string    `json:"content_type"`
	Tags         []string  `json:"tags"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func PostToResponse(p *Post) PostResponse {
	return PostResponse{
		ID:           p.ID,
		OwnerID:      p.OwnerID,
		Author:       p.Author,
		Status:       p.Status,
		Visibility:   p.Visibility,
		ThumbnailURL: p.ThumbnailURL,
		Slug:         p.Slug,
		Title:        p.Title,
		Annotation:   p.Annotation,
		Content:      p.Content,
		ContentType:  p.ContentType,
		Tags:         p.Tags,
		CreatedAt:    p.CreatedAt,
		UpdatedAt:    p.UpdatedAt,
	}
}
