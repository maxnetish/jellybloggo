package auth

import (
	"github.com/go-chi/chi/v5"

	"github.com/maxnetish/jellybloggo/internal/users"
)

func NewRouter(service *AuthService, userRepo users.UserRepository) *chi.Mux {
	r := chi.NewRouter()

	handler := NewAuthHandler(service, userRepo)

	r.Post("/login", handler.Login)
	r.Post("/register", handler.Register)
	r.Post("/refresh", handler.Refresh)
	r.Post("/logout", handler.Logout)

	r.Group(func(r chi.Router) {
		r.Use(JWTMiddleware(service))
		r.Get("/user", handler.GetUser)
	})

	return r
}