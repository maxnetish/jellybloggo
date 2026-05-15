package posts

import (
	"errors"
	"net/http"
	"strings"

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
