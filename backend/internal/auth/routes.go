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
		r.Use(TransparentRefreshMiddleware(service))
		r.Get("/user", handler.GetUser)
		r.Patch("/user", handler.UpdateProfile)
		r.Delete("/user", handler.DeleteUser)
		r.Post("/password", handler.ChangePassword)
		r.Post("/roles", handler.UpdateRoles)
	})

	return r
}