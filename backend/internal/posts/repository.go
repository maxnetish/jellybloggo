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
	List(ctx context.Context, params ListParams) ([]*Post, int, error)
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

func (r *postRepository) List(ctx context.Context, params ListParams) ([]*Post, int, error) {
	var args []interface{}

	distinct := ""
	join := ""
	var whereClauses []string

	if params.OwnerID != "" {
		whereClauses = append(whereClauses, "p.owner_id = ?")
		args = append(args, params.OwnerID)
	}

	if params.Search != "" {
		whereClauses = append(whereClauses, "(p.title LIKE ? OR p.annotation LIKE ? OR p.content LIKE ?)")
		s := "%" + params.Search + "%"
		args = append(args, s, s, s)
	}

	if len(params.Status) > 0 {
		placeholders := make([]string, len(params.Status))
		for i, v := range params.Status {
			placeholders[i] = "?"
			args = append(args, v)
		}
		whereClauses = append(whereClauses, fmt.Sprintf("p.status IN (%s)", strings.Join(placeholders, ",")))
	}

	if len(params.Tags) > 0 {
		distinct = "DISTINCT"
		join = "LEFT JOIN post_tags pt ON p.id = pt.post_id"
		placeholders := make([]string, len(params.Tags))
		for i, tag := range params.Tags {
			placeholders[i] = "?"
			args = append(args, tag)
		}
		whereClauses = append(whereClauses, fmt.Sprintf("pt.tag_name IN (%s)", strings.Join(placeholders, ",")))
	}

	if params.CreatedAtFrom != nil {
		whereClauses = append(whereClauses, "p.created_at >= ?")
		args = append(args, *params.CreatedAtFrom)
	}

	if params.CreatedAtTo != nil {
		whereClauses = append(whereClauses, "p.created_at < ?")
		args = append(args, params.CreatedAtTo.AddDate(0, 0, 1))
	}

	where := ""
	if len(whereClauses) > 0 {
		where = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(%s) FROM posts p %s %s", distinct, join, where)
	countArgs := make([]interface{}, len(args))
	copy(countArgs, args)
	if err := r.db.QueryRowContext(ctx, countQuery, countArgs...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count posts: %w", err)
	}

	sortBy := params.SortBy
	if sortBy == "" {
		sortBy = "created_at"
	}
	sortDir := params.SortDir
	if sortDir == "" {
		sortDir = "desc"
	}
	order := fmt.Sprintf("ORDER BY p.%s %s", sortBy, sortDir)

	offset := (params.Page - 1) * params.PerPage
	dataQuery := fmt.Sprintf(
		"SELECT %s p.id, p.owner_id, p.author, p.status, p.visibility, p.thumbnail_url, p.slug, p.title, p.annotation, p.content, p.content_type, p.attachments, p.created_at, p.updated_at FROM posts p %s %s %s LIMIT ? OFFSET ?",
		distinct, join, where, order,
	)
	dataArgs := make([]interface{}, len(args))
	copy(dataArgs, args)
	dataArgs = append(dataArgs, params.PerPage, offset)

	rows, err := r.db.QueryContext(ctx, dataQuery, dataArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query posts: %w", err)
	}
	defer rows.Close()

	var posts []*Post
	for rows.Next() {
		post := &Post{}
		var attachmentsJSON *string
		if err := rows.Scan(
			&post.ID, &post.OwnerID, &post.Author, &post.Status, &post.Visibility,
			&post.ThumbnailURL, &post.Slug, &post.Title, &post.Annotation,
			&post.Content, &post.ContentType, &attachmentsJSON, &post.CreatedAt, &post.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan post: %w", err)
		}

		if attachmentsJSON != nil {
			if err := json.Unmarshal([]byte(*attachmentsJSON), &post.Attachments); err != nil {
				return nil, 0, fmt.Errorf("failed to unmarshal attachments: %w", err)
			}
		}
		if post.Attachments == nil {
			post.Attachments = []Attachment{}
		}

		tags, err := r.GetTagsByPostID(ctx, post.ID)
		if err != nil {
			return nil, 0, err
		}
		post.Tags = tags

		posts = append(posts, post)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("failed to iterate posts: %w", err)
	}

	if posts == nil {
		posts = []*Post{}
	}

	return posts, total, nil
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
