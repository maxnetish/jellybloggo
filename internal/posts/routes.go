package posts

import (
	"github.com/go-chi/chi/v5"
	"github.com/maxnetish/jellybloggo/internal/users"
)

func NewRouter(postRepo PostRepository, userRepo users.UserRepository) *chi.Mux {
	r := chi.NewRouter()
	h := NewPostHandler(postRepo, userRepo)
	r.Post("/", h.UpsertPost)
	r.Get("/", h.ListPosts)
	return r
}
