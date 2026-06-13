package s3config

import (
	"github.com/go-chi/chi/v5"
)

func NewRouter(handler *S3ConfigHandler) *chi.Mux {
	r := chi.NewRouter()

	r.Get("/", handler.ListConfigs)
	r.Post("/", handler.CreateConfig)
	r.Get("/{id}", handler.GetConfig)
	r.Put("/{id}", handler.UpdateConfig)
	r.Delete("/{id}", handler.DeleteConfig)

	return r
}