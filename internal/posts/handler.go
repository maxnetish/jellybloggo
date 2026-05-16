package posts

import (
	"errors"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/maxnetish/jellybloggo/internal/pagination"
	"github.com/maxnetish/jellybloggo/internal/users"
	"github.com/maxnetish/jellybloggo/internal/validation"
)

var (
	ErrSlugExists = errors.New("slug already exists")
)

type PostHandler struct {
	postRepo PostRepository
	userRepo users.UserRepository
}

func NewPostHandler(postRepo PostRepository, userRepo users.UserRepository) *PostHandler {
	return &PostHandler{
		postRepo: postRepo,
		userRepo: userRepo,
	}
}

// UpsertPost creates a new post or updates an existing one.
// @Summary Create or update a post
// @Description Creates a new post or updates an existing one. Author role required. Only post owner can update.
// @Tags posts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body CreatePostRequest true "Post data"
// @Success 201 {object} PostResponse "Post created"
// @Success 200 {object} PostResponse "Post updated"
// @Failure 400 {object} validation.ErrorResponse "Validation failed"
// @Failure 401 {object} validation.ErrorResponse "Not authenticated"
// @Failure 403 {object} validation.ErrorResponse "Forbidden - author role required or not owner"
// @Failure 409 {object} validation.ErrorResponse "Slug already exists"
// @Failure 500 {object} validation.ErrorResponse "Internal server error"
// @Router /api/posts [post]
func (h *PostHandler) UpsertPost(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID == 0 {
		validation.RespondJSON(w, http.StatusUnauthorized, validation.ErrorResponse{
			Error: "not authenticated",
			Code:  "NOT_AUTHENTICATED",
		})
		return
	}

	actor, err := h.userRepo.GetByID(r.Context(), userID)
	if err != nil || actor == nil {
		validation.RespondJSON(w, http.StatusForbidden, validation.ErrorResponse{
			Error: "forbidden",
			Code:  "FORBIDDEN",
		})
		return
	}

	if !actor.HasRole("author") {
		validation.RespondJSON(w, http.StatusForbidden, validation.ErrorResponse{
			Error: "forbidden - author role required",
			Code:  "FORBIDDEN",
		})
		return
	}

	var req CreatePostRequest
	if err := validation.DecodeAndValidate(r, &req); err != nil {
		validation.WriteValidationError(w, err)
		return
	}

	existing, err := h.postRepo.GetByID(r.Context(), req.ID)
	if err != nil {
		validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
			Error: "internal error",
			Code:  "INTERNAL_ERROR",
		})
		return
	}

	ctx := r.Context()

	if existing != nil {
		if existing.OwnerID != userID {
			validation.RespondJSON(w, http.StatusForbidden, validation.ErrorResponse{
				Error: "forbidden - not post owner",
				Code:  "FORBIDDEN",
			})
			return
		}

		post := &Post{
			ID:           req.ID,
			OwnerID:      existing.OwnerID,
			Author:       req.Author,
			Status:       existing.Status,
			Visibility:   existing.Visibility,
			ThumbnailURL: req.ThumbnailURL,
			Slug:         req.Slug,
			Title:        req.Title,
			Annotation:   req.Annotation,
			Content:      req.Content,
			ContentType:  req.ContentType,
			Attachments:  req.Attachments,
		}

		updated, err := h.postRepo.Update(ctx, post)
		if err != nil {
			if strings.Contains(err.Error(), "slug already exists") {
				validation.RespondJSON(w, http.StatusConflict, validation.ErrorResponse{
					Error: "slug already exists",
					Code:  "SLUG_EXISTS",
				})
				return
			}
			validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
				Error: "internal error",
				Code:  "INTERNAL_ERROR",
			})
			return
		}

		if len(req.Tags) > 0 {
			if err := h.postRepo.UpsertTags(ctx, req.Tags); err != nil {
				validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
					Error: "internal error",
					Code:  "INTERNAL_ERROR",
				})
				return
			}
			if err := h.postRepo.SetPostTags(ctx, req.ID, req.Tags); err != nil {
				validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
					Error: "internal error",
					Code:  "INTERNAL_ERROR",
				})
				return
			}
			updated.Tags = req.Tags
		} else {
			updated.Tags = []string{}
		}

		validation.RespondJSON(w, http.StatusOK, PostToResponse(updated))
		return
	}

	post := &Post{
		ID:           req.ID,
		OwnerID:      userID,
		Author:       req.Author,
		Status:       "draft",
		Visibility:   "private",
		ThumbnailURL: req.ThumbnailURL,
		Slug:         req.Slug,
		Title:        req.Title,
		Annotation:   req.Annotation,
		Content:      req.Content,
		ContentType:  req.ContentType,
		Attachments:  req.Attachments,
	}

	created, err := h.postRepo.Create(ctx, post)
	if err != nil {
		if strings.Contains(err.Error(), "slug already exists") {
			validation.RespondJSON(w, http.StatusConflict, validation.ErrorResponse{
				Error: "slug already exists",
				Code:  "SLUG_EXISTS",
			})
			return
		}
		validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
			Error: "internal error",
			Code:  "INTERNAL_ERROR",
		})
		return
	}

	if len(req.Tags) > 0 {
		if err := h.postRepo.UpsertTags(ctx, req.Tags); err != nil {
			validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
				Error: "internal error",
				Code:  "INTERNAL_ERROR",
			})
			return
		}
		if err := h.postRepo.SetPostTags(ctx, req.ID, req.Tags); err != nil {
			validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
				Error: "internal error",
				Code:  "INTERNAL_ERROR",
			})
			return
		}
		created.Tags = req.Tags
	} else {
		created.Tags = []string{}
	}

	validation.RespondJSON(w, http.StatusCreated, PostToResponse(created))
}

// ListPosts returns a paginated, filterable list of posts.
// @Summary List all posts (admin) or own posts (author)
// @Description Returns paginated list of posts. Admin sees all posts, author sees only own posts.
// @Tags posts
// @Security BearerAuth
// @Produce json
// @Param search query string false "Search by title, annotation or content (partial, case-insensitive)"
// @Param tags query []string false "Filter by tags (match any)" collectionFormat(multi)
// @Param status query []string false "Filter by status: draft, published" collectionFormat(multi)
// @Param created_at_from query string false "Filter by created_at from (date, YYYY-MM-DD)"
// @Param created_at_to query string false "Filter by created_at to (date, YYYY-MM-DD, inclusive)"
// @Param sort_by query string false "Sort field: created_at, updated_at, author, status, title"
// @Param sort_dir query string false "Sort direction: asc, desc"
// @Param page query int false "Page number"
// @Param per_page query int false "Items per page"
// @Success 200 {object} PostListResponse "Paginated list of posts"
// @Failure 400 {object} validation.ErrorResponse "Validation failed"
// @Failure 401 {object} validation.ErrorResponse "Not authenticated"
// @Failure 403 {object} validation.ErrorResponse "Forbidden"
// @Failure 500 {object} validation.ErrorResponse "Internal server error"
// @Router /api/posts [get]
func (h *PostHandler) ListPosts(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(int)
	if !ok || userID == 0 {
		validation.RespondJSON(w, http.StatusUnauthorized, validation.ErrorResponse{
			Error: "not authenticated",
			Code:  "NOT_AUTHENTICATED",
		})
		return
	}

	actor, err := h.userRepo.GetByID(r.Context(), userID)
	if err != nil || actor == nil {
		validation.RespondJSON(w, http.StatusForbidden, validation.ErrorResponse{
			Error: "forbidden",
			Code:  "FORBIDDEN",
		})
		return
	}

	var ownerID int
	if actor.HasRole("admin") {
		ownerID = 0
	} else if actor.HasRole("author") {
		ownerID = userID
	} else {
		validation.RespondJSON(w, http.StatusForbidden, validation.ErrorResponse{
			Error: "forbidden - author or admin role required",
			Code:  "FORBIDDEN",
		})
		return
	}

	q := r.URL.Query()

	search := strings.TrimSpace(q.Get("search"))
	if len(search) > 100 {
		validation.RespondJSON(w, http.StatusBadRequest, validation.ErrorResponse{
			Error: "Validation failed",
			Code:  "VALIDATION_ERROR",
			Details: []validation.FieldError{
				{Field: "search", Tag: "max", Message: "search query too long"},
			},
		})
		return
	}

	statusValues := q["status"]
	for _, s := range statusValues {
		if s != "draft" && s != "published" {
			validation.RespondJSON(w, http.StatusBadRequest, validation.ErrorResponse{
				Error: "Validation failed",
				Code:  "VALIDATION_ERROR",
				Details: []validation.FieldError{
					{Field: "status", Tag: "oneof", Value: s, Message: "status must be draft or published"},
				},
			})
			return
		}
	}

	var createdAtFrom *time.Time
	if v := strings.TrimSpace(q.Get("created_at_from")); v != "" {
		t, err := time.Parse("2006-01-02", v)
		if err != nil {
			validation.RespondJSON(w, http.StatusBadRequest, validation.ErrorResponse{
				Error: "Validation failed",
				Code:  "VALIDATION_ERROR",
				Details: []validation.FieldError{
					{Field: "created_at_from", Tag: "date", Value: v, Message: "created_at_from must be YYYY-MM-DD"},
				},
			})
			return
		}
		createdAtFrom = &t
	}

	var createdAtTo *time.Time
	if v := strings.TrimSpace(q.Get("created_at_to")); v != "" {
		t, err := time.Parse("2006-01-02", v)
		if err != nil {
			validation.RespondJSON(w, http.StatusBadRequest, validation.ErrorResponse{
				Error: "Validation failed",
				Code:  "VALIDATION_ERROR",
				Details: []validation.FieldError{
					{Field: "created_at_to", Tag: "date", Value: v, Message: "created_at_to must be YYYY-MM-DD"},
				},
			})
			return
		}
		createdAtTo = &t
	}

	sortBy := q.Get("sort_by")
	if sortBy == "" {
		sortBy = "created_at"
	}
	switch sortBy {
	case "created_at", "updated_at", "author", "status", "title":
	default:
		validation.RespondJSON(w, http.StatusBadRequest, validation.ErrorResponse{
			Error: "Validation failed",
			Code:  "VALIDATION_ERROR",
			Details: []validation.FieldError{
				{Field: "sort_by", Tag: "oneof", Value: sortBy, Message: "sort_by must be one of: created_at, updated_at, author, status, title"},
			},
		})
		return
	}

	sortDir := q.Get("sort_dir")
	if sortDir == "" {
		sortDir = "desc"
	}
	if sortDir != "asc" && sortDir != "desc" {
		validation.RespondJSON(w, http.StatusBadRequest, validation.ErrorResponse{
			Error: "Validation failed",
			Code:  "VALIDATION_ERROR",
			Details: []validation.FieldError{
				{Field: "sort_dir", Tag: "oneof", Value: sortDir, Message: "sort_dir must be asc or desc"},
			},
		})
		return
	}

	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}

	perPage, _ := strconv.Atoi(q.Get("per_page"))
	if perPage < 1 {
		perPage = 10
	}
	if perPage > 100 {
		perPage = 100
	}

	params := ListParams{
		Search:        search,
		Tags:          q["tags"],
		Status:        statusValues,
		CreatedAtFrom: createdAtFrom,
		CreatedAtTo:   createdAtTo,
		OwnerID:       ownerID,
		SortBy:        sortBy,
		SortDir:       sortDir,
		Page:          page,
		PerPage:       perPage,
	}

	posts, total, err := h.postRepo.List(r.Context(), params)
	if err != nil {
		validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
			Error: "internal error",
			Code:  "INTERNAL_ERROR",
		})
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(perPage)))

	content := make([]PostSummaryResponse, len(posts))
	for i, p := range posts {
		content[i] = PostToSummaryResponse(p)
	}

	validation.RespondJSON(w, http.StatusOK, pagination.Response[PostSummaryResponse]{
		Content: content,
		Pagination: pagination.Pagination{
			Page:       page,
			PerPage:    perPage,
			Total:      total,
			TotalPages: totalPages,
			SortBy:     sortBy,
			SortDir:    sortDir,
		},
	})
}
