package posts

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
)

type PostRepository interface {
	GetByID(ctx context.Context, id string) (*Post, error)
	Create(ctx context.Context, post *Post) (*Post, error)
	Update(ctx context.Context, post *Post) (*Post, error)
	UpsertTags(ctx context.Context, tags []string) error
	SetPostTags(ctx context.Context, postID string, tags []string) error
	GetTagsByPostID(ctx context.Context, postID string) ([]string, error)
}

type postRepository struct {
	db *sql.DB
}

func NewPostRepository(db *sql.DB) PostRepository {
	return &postRepository{db: db}
}

func (r *postRepository) GetByID(ctx context.Context, id string) (*Post, error) {
	post := &Post{}
	var attachmentsJSON *string
	err := r.db.QueryRowContext(ctx,
		`SELECT id, owner_id, author, status, visibility, thumbnail_url, slug, title, annotation, content, content_type, attachments, created_at, updated_at 
		 FROM posts WHERE id = ?`,
		id,
	).Scan(
		&post.ID, &post.OwnerID, &post.Author, &post.Status, &post.Visibility,
		&post.ThumbnailURL, &post.Slug, &post.Title, &post.Annotation,
		&post.Content, &post.ContentType, &attachmentsJSON, &post.CreatedAt, &post.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get post by id: %w", err)
	}

	if attachmentsJSON != nil {
		if err := json.Unmarshal([]byte(*attachmentsJSON), &post.Attachments); err != nil {
			return nil, fmt.Errorf("failed to unmarshal attachments: %w", err)
		}
	}
	if post.Attachments == nil {
		post.Attachments = []Attachment{}
	}

	tags, err := r.GetTagsByPostID(ctx, id)
	if err != nil {
		return nil, err
	}
	post.Tags = tags

	return post, nil
}

func (r *postRepository) Create(ctx context.Context, post *Post) (*Post, error) {
	var attachmentsJSON *string
	if len(post.Attachments) > 0 {
		data, err := json.Marshal(post.Attachments)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal attachments: %w", err)
		}
		s := string(data)
		attachmentsJSON = &s
	}

	_, err := r.db.ExecContext(ctx,
		`INSERT INTO posts (id, owner_id, author, status, visibility, thumbnail_url, slug, title, annotation, content, content_type, attachments)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		post.ID, post.OwnerID, post.Author, post.Status, post.Visibility,
		post.ThumbnailURL, post.Slug, post.Title, post.Annotation,
		post.Content, post.ContentType, attachmentsJSON,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return nil, fmt.Errorf("slug already exists: %w", err)
		}
		return nil, fmt.Errorf("failed to create post: %w", err)
	}

	return r.GetByID(ctx, post.ID)
}

func (r *postRepository) Update(ctx context.Context, post *Post) (*Post, error) {
	var attachmentsJSON *string
	if len(post.Attachments) > 0 {
		data, err := json.Marshal(post.Attachments)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal attachments: %w", err)
		}
		s := string(data)
		attachmentsJSON = &s
	}

	_, err := r.db.ExecContext(ctx,
		`UPDATE posts SET author = ?, thumbnail_url = ?, slug = ?, title = ?, annotation = ?, content = ?, content_type = ?, attachments = ?, updated_at = CURRENT_TIMESTAMP
		 WHERE id = ?`,
		post.Author, post.ThumbnailURL, post.Slug, post.Title,
		post.Annotation, post.Content, post.ContentType, attachmentsJSON, post.ID,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return nil, fmt.Errorf("slug already exists: %w", err)
		}
		return nil, fmt.Errorf("failed to update post: %w", err)
	}

	return r.GetByID(ctx, post.ID)
}

func (r *postRepository) UpsertTags(ctx context.Context, tags []string) error {
	if len(tags) == 0 {
		return nil
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	for _, tag := range tags {
		_, err := tx.ExecContext(ctx, `INSERT OR IGNORE INTO tags (name) VALUES (?)`, tag)
		if err != nil {
			return fmt.Errorf("failed to upsert tag '%s': %w", tag, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *postRepository) SetPostTags(ctx context.Context, postID string, tags []string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `DELETE FROM post_tags WHERE post_id = ?`, postID)
	if err != nil {
		return fmt.Errorf("failed to delete post tags: %w", err)
	}

	for _, tag := range tags {
		_, err := tx.ExecContext(ctx, `INSERT INTO post_tags (post_id, tag_name) VALUES (?, ?)`, postID, tag)
		if err != nil {
			return fmt.Errorf("failed to insert post tag: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

func (r *postRepository) GetTagsByPostID(ctx context.Context, postID string) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT tag_name FROM post_tags WHERE post_id = ?`, postID)
	if err != nil {
		return nil, fmt.Errorf("failed to get post tags: %w", err)
	}
	defer rows.Close()

	var tags []string
	for rows.Next() {
		var tag string
		if err := rows.Scan(&tag); err != nil {
			return nil, fmt.Errorf("failed to scan tag: %w", err)
		}
		tags = append(tags, tag)
	}

	if tags == nil {
		tags = []string{}
	}

	return tags, rows.Err()
}
