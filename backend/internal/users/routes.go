package users

import (
	"github.com/go-chi/chi/v5"
)

func NewRouter(userRepo UserRepository) *chi.Mux {
	r := chi.NewRouter()
	h := NewUserHandler(userRepo)
	r.Get("/", h.ListUsers)
	return r
}
