package s3config

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/maxnetish/jellybloggo/internal/validation"
)

type S3ConfigHandler struct {
	service *S3ConfigService
}

func NewS3ConfigHandler(service *S3ConfigService) *S3ConfigHandler {
	return &S3ConfigHandler{service: service}
}

// ListConfigs returns all S3 configs for the authenticated user.
// @Summary List S3 configurations
// @Description Returns all S3 storage configurations belonging to the authenticated user.
// @Tags s3-configs
// @Security BearerAuth
// @Produce json
// @Success 200 {array} S3ConfigResponse "List of S3 configurations"
// @Failure 401 {object} validation.ErrorResponse "Not authenticated"
// @Failure 500 {object} validation.ErrorResponse "Internal server error"
// @Router /api/s3-configs [get]
func (h *S3ConfigHandler) ListConfigs(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		validation.RespondJSON(w, http.StatusUnauthorized, validation.ErrorResponse{
			Error: "not authenticated",
			Code:  "NOT_AUTHENTICATED",
		})
		return
	}

	configs, err := h.service.ListByUserID(r.Context(), userID)
	if err != nil {
		validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
			Error: "internal error",
			Code:  "INTERNAL_ERROR",
		})
		return
	}

	response := make([]S3ConfigResponse, len(configs))
	for i, c := range configs {
		response[i] = ToResponse(c)
	}

	validation.RespondJSON(w, http.StatusOK, response)
}

// GetConfig returns a single S3 config by ID.
// @Summary Get S3 configuration by ID
// @Description Returns a single S3 storage configuration. User can only access their own configs.
// @Tags s3-configs
// @Security BearerAuth
// @Produce json
// @Param id path string true "Config ID"
// @Success 200 {object} S3ConfigResponse "S3 configuration"
// @Failure 401 {object} validation.ErrorResponse "Not authenticated"
// @Failure 403 {object} validation.ErrorResponse "Forbidden"
// @Failure 404 {object} validation.ErrorResponse "Not found"
// @Failure 500 {object} validation.ErrorResponse "Internal server error"
// @Router /api/s3-configs/{id} [get]
func (h *S3ConfigHandler) GetConfig(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		validation.RespondJSON(w, http.StatusUnauthorized, validation.ErrorResponse{
			Error: "not authenticated",
			Code:  "NOT_AUTHENTICATED",
		})
		return
	}

	configID := chi.URLParam(r, "id")
	if configID == "" {
		validation.RespondJSON(w, http.StatusNotFound, validation.ErrorResponse{
			Error: "not found",
			Code:  "NOT_FOUND",
		})
		return
	}

	config, err := h.service.GetByID(r.Context(), userID, configID)
	if err != nil {
		if errors.Is(err, ErrNotAuthorized) {
			validation.RespondJSON(w, http.StatusForbidden, validation.ErrorResponse{
				Error: "forbidden",
				Code:  "FORBIDDEN",
			})
			return
		}
		validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
			Error: "internal error",
			Code:  "INTERNAL_ERROR",
		})
		return
	}

	if config == nil {
		validation.RespondJSON(w, http.StatusNotFound, validation.ErrorResponse{
			Error: "not found",
			Code:  "NOT_FOUND",
		})
		return
	}

	validation.RespondJSON(w, http.StatusOK, ToResponse(config))
}

// CreateConfig creates a new S3 configuration.
// @Summary Create S3 configuration
// @Description Creates a new S3 storage configuration for the authenticated user.
// @Tags s3-configs
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body CreateS3ConfigRequest true "S3 configuration data"
// @Success 201 {object} S3ConfigResponse "Created S3 configuration"
// @Failure 400 {object} validation.ErrorResponse "Validation failed"
// @Failure 401 {object} validation.ErrorResponse "Not authenticated"
// @Failure 500 {object} validation.ErrorResponse "Internal server error"
// @Router /api/s3-configs [post]
func (h *S3ConfigHandler) CreateConfig(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		validation.RespondJSON(w, http.StatusUnauthorized, validation.ErrorResponse{
			Error: "not authenticated",
			Code:  "NOT_AUTHENTICATED",
		})
		return
	}

	var req CreateS3ConfigRequest
	if err := validation.DecodeAndValidate(r, &req); err != nil {
		validation.WriteValidationError(w, err)
		return
	}

	config, err := h.service.Create(r.Context(), userID, req)
	if err != nil {
		validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
			Error: "internal error",
			Code:  "INTERNAL_ERROR",
		})
		return
	}

	validation.RespondJSON(w, http.StatusCreated, ToResponse(config))
}

// UpdateConfig updates an existing S3 configuration.
// @Summary Update S3 configuration
// @Description Updates an existing S3 storage configuration. User can only update their own configs.
// @Tags s3-configs
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Config ID"
// @Param request body UpdateS3ConfigRequest true "S3 configuration data (only provided fields will be updated)"
// @Success 200 {object} S3ConfigResponse "Updated S3 configuration"
// @Failure 400 {object} validation.ErrorResponse "Validation failed"
// @Failure 401 {object} validation.ErrorResponse "Not authenticated"
// @Failure 403 {object} validation.ErrorResponse "Forbidden"
// @Failure 404 {object} validation.ErrorResponse "Not found"
// @Failure 500 {object} validation.ErrorResponse "Internal server error"
// @Router /api/s3-configs/{id} [put]
func (h *S3ConfigHandler) UpdateConfig(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		validation.RespondJSON(w, http.StatusUnauthorized, validation.ErrorResponse{
			Error: "not authenticated",
			Code:  "NOT_AUTHENTICATED",
		})
		return
	}

	configID := chi.URLParam(r, "id")
	if configID == "" {
		validation.RespondJSON(w, http.StatusNotFound, validation.ErrorResponse{
			Error: "not found",
			Code:  "NOT_FOUND",
		})
		return
	}

	var req UpdateS3ConfigRequest
	if err := validation.DecodeAndValidate(r, &req); err != nil {
		validation.WriteValidationError(w, err)
		return
	}

	config, err := h.service.Update(r.Context(), userID, configID, req)
	if err != nil {
		if errors.Is(err, ErrNotAuthorized) {
			validation.RespondJSON(w, http.StatusForbidden, validation.ErrorResponse{
				Error: "forbidden",
				Code:  "FORBIDDEN",
			})
			return
		}
		validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
			Error: "internal error",
			Code:  "INTERNAL_ERROR",
		})
		return
	}

	validation.RespondJSON(w, http.StatusOK, ToResponse(config))
}

// DeleteConfig deletes an S3 configuration.
// @Summary Delete S3 configuration
// @Description Deletes an S3 storage configuration. User can only delete their own configs.
// @Tags s3-configs
// @Security BearerAuth
// @Param id path string true "Config ID"
// @Success 204 "No content"
// @Failure 401 {object} validation.ErrorResponse "Not authenticated"
// @Failure 403 {object} validation.ErrorResponse "Forbidden"
// @Failure 404 {object} validation.ErrorResponse "Not found"
// @Failure 500 {object} validation.ErrorResponse "Internal server error"
// @Router /api/s3-configs/{id} [delete]
func (h *S3ConfigHandler) DeleteConfig(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		validation.RespondJSON(w, http.StatusUnauthorized, validation.ErrorResponse{
			Error: "not authenticated",
			Code:  "NOT_AUTHENTICATED",
		})
		return
	}

	configID := chi.URLParam(r, "id")
	if configID == "" {
		validation.RespondJSON(w, http.StatusNotFound, validation.ErrorResponse{
			Error: "not found",
			Code:  "NOT_FOUND",
		})
		return
	}

	err := h.service.Delete(r.Context(), userID, configID)
	if err != nil {
		if errors.Is(err, ErrNotAuthorized) {
			validation.RespondJSON(w, http.StatusForbidden, validation.ErrorResponse{
				Error: "forbidden",
				Code:  "FORBIDDEN",
			})
			return
		}
		validation.RespondJSON(w, http.StatusInternalServerError, validation.ErrorResponse{
			Error: "internal error",
			Code:  "INTERNAL_ERROR",
		})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}