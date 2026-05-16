package posts

import (
	"time"

	"github.com/maxnetish/jellybloggo/internal/pagination"
)

type Attachment struct {
	ID          string  `json:"id"          v8:"required,alphanum,min=8,max=10"`
	URL         string  `json:"url"         v8:"required,url,max=500"`
	Label       string  `json:"label"       v8:"required,max=200"`
	Description *string `json:"description,omitempty" v8:"omitempty,max=1000"`
	Size        *int64  `json:"size,omitempty"        v8:"omitempty,min=1"`
	ContentType *string `json:"contentType,omitempty" v8:"omitempty,max=100"`
}

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
	Attachments  []Attachment
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type CreatePostRequest struct {
	ID           string       `json:"id" v8:"required,alphanum,min=8,max=10"`
	Author       *string      `json:"author" v8:"omitempty,max=100"`
	ThumbnailURL *string      `json:"thumbnailUrl" v8:"omitempty,url,max=500"`
	Slug         string       `json:"slug" v8:"required,max=255,slug"`
	Title        string       `json:"title" v8:"required,max=500"`
	Annotation   *string      `json:"annotation" v8:"omitempty,max=1000"`
	Content      string       `json:"content" v8:"required,max=100000"`
	ContentType  string       `json:"contentType" v8:"required,oneof=html md"`
	Tags         []string     `json:"tags" v8:"omitempty,dive,max=50"`
	Attachments  []Attachment `json:"attachments" v8:"omitempty,dive"`
}

type PostResponse struct {
	ID           string       `json:"id"`
	OwnerID      int          `json:"owner_id"`
	Author       *string      `json:"author"`
	Status       string       `json:"status"`
	Visibility   string       `json:"visibility"`
	ThumbnailURL *string      `json:"thumbnail_url"`
	Slug         string       `json:"slug"`
	Title        string       `json:"title"`
	Annotation   *string      `json:"annotation"`
	Content      string       `json:"content"`
	ContentType  string       `json:"content_type"`
	Tags         []string     `json:"tags"`
	Attachments  []Attachment `json:"attachments"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
}

type PostListResponse struct {
	Content    []PostSummaryResponse `json:"content"`
	Pagination pagination.Pagination `json:"pagination"`
}

type PostSummaryResponse struct {
	ID           string   `json:"id"`
	Author       *string  `json:"author"`
	Title        string   `json:"title"`
	Annotation   *string  `json:"annotation,omitempty"`
	ThumbnailURL *string  `json:"thumbnail_url,omitempty"`
	Status       string   `json:"status"`
	Visibility   string   `json:"visibility"`
	Tags         []string `json:"tags,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ListParams struct {
	Search       string
	Tags         []string
	Status       []string
	CreatedAtFrom *time.Time
	CreatedAtTo   *time.Time
	OwnerID      int
	SortBy       string
	SortDir      string
	Page         int
	PerPage      int
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
		Attachments:  p.Attachments,
		CreatedAt:    p.CreatedAt,
		UpdatedAt:    p.UpdatedAt,
	}
}

func PostToSummaryResponse(p *Post) PostSummaryResponse {
	return PostSummaryResponse{
		ID:           p.ID,
		Author:       p.Author,
		Title:        p.Title,
		Annotation:   p.Annotation,
		ThumbnailURL: p.ThumbnailURL,
		Status:       p.Status,
		Visibility:   p.Visibility,
		Tags:         p.Tags,
		CreatedAt:    p.CreatedAt,
		UpdatedAt:    p.UpdatedAt,
	}
}
