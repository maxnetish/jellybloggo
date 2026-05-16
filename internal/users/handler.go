package users

import (
	"math"
	"net/http"
	"strconv"
	"strings"

	"github.com/maxnetish/jellybloggo/internal/pagination"
	"github.com/maxnetish/jellybloggo/internal/validation"
)

type UserHandler struct {
	userRepo UserRepository
}

func NewUserHandler(userRepo UserRepository) *UserHandler {
	return &UserHandler{userRepo: userRepo}
}

// ListUsers returns a paginated, filterable list of users.
// @Summary List all users
// @Description Returns paginated list of users. Requires admin role.
// @Tags users
// @Security BearerAuth
// @Produce json
// @Param roles query []string false "Filter by roles (repeatable)" collectionFormat(multi)
// @Param search query string false "Search by login (partial, case-insensitive)"
// @Param sort_by query string false "Sort field: login, created_at, updated_at"
// @Param sort_dir query string false "Sort direction: asc, desc"
// @Param page query int false "Page number"
// @Param per_page query int false "Items per page"
// @Success 200 {object} UserListResponse "Paginated list of users"
// @Failure 401 {object} validation.ErrorResponse "Not authenticated"
// @Failure 403 {object} validation.ErrorResponse "Forbidden"
// @Failure 500 {object} validation.ErrorResponse "Internal server error"
// @Router /api/users [get]
func (h *UserHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
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
	if !actor.HasRole("admin") {
		validation.RespondJSON(w, http.StatusForbidden, validation.ErrorResponse{
			Error: "forbidden",
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

	sortBy := q.Get("sort_by")
	if sortBy == "" {
		sortBy = "login"
	}
	switch sortBy {
	case "login", "created_at", "updated_at":
	default:
		validation.RespondJSON(w, http.StatusBadRequest, validation.ErrorResponse{
			Error: "Validation failed",
			Code:  "VALIDATION_ERROR",
			Details: []validation.FieldError{
				{Field: "sort_by", Tag: "oneof", Value: sortBy, Message: "sort_by must be one of: login, created_at, updated_at"},
			},
		})
		return
	}

	sortDir := q.Get("sort_dir")
	if sortDir == "" {
		sortDir = "asc"
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
		Roles:   q["roles"],
		Search:  search,
		SortBy:  sortBy,
		SortDir: sortDir,
		Page:    page,
		PerPage: perPage,
	}

	users, total, err := h.userRepo.List(r.Context(), params)
	if err != nil {
		validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
			Error: "internal error",
			Code:  "INTERNAL_ERROR",
		})
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(perPage)))

	content := make([]UserResponse, len(users))
	for i, u := range users {
		content[i] = UserToResponse(u)
	}

	validation.RespondJSON(w, http.StatusOK, pagination.Response[UserResponse]{
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
