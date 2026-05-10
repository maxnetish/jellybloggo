package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
	httpSwagger "github.com/swaggo/http-swagger/v2"

	"github.com/maxnetish/jellybloggo/internal/auth"
	"github.com/maxnetish/jellybloggo/internal/database"
	"github.com/maxnetish/jellybloggo/internal/health"
	"github.com/maxnetish/jellybloggo/internal/users"

	_ "github.com/maxnetish/jellybloggo/internal/docs"
)

// @title Jellybloggo API
// @version 1.0
// @description A lightweight web server backend built with Go
// @host localhost:8080
// @BasePath /

var db *sql.DB
var userRepo users.UserRepository

func main() {
	godotenv.Load()

	dsn := os.Getenv("DB_PATH")
	if dsn == "" {
		dsn = "./data/jellybloggo.sqlite"
	}

	var err error
	db, err = database.New(dsn)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	userRepo = users.NewUserRepository(db)

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "default-secret-change-me"
	}

	tokenExpiry := getDurationEnv("TOKEN_EXPIRY", 15*time.Minute)
	refreshExpiry := getDurationEnv("REFRESH_EXPIRY", 168*time.Hour)

	refreshTokenRepo := auth.NewRefreshTokenRepository(db)
	authService := auth.NewAuthService(userRepo, refreshTokenRepo, auth.AuthConfig{
		JWTSecret:     jwtSecret,
		TokenExpiry:   tokenExpiry,
		RefreshExpiry: refreshExpiry,
	})
	authHandler := auth.NewAuthHandler(authService, userRepo)

	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)

	r.Get("/health", health.Handler)

	r.Mount("/swagger", httpSwagger.WrapHandler)

	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/login", authHandler.Login)
		r.Post("/refresh", authHandler.Refresh)
		r.Post("/logout", authHandler.Logout)

		r.Group(func(r chi.Router) {
			r.Use(auth.JWTMiddleware(authService))
			r.Get("/user", authHandler.GetUser)
		})
	})

	log.Println("Server starting on :8080")
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatal(err)
	}
}

func getDurationEnv(key string, defaultVal time.Duration) time.Duration {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	d, err := time.ParseDuration(val)
	if err != nil {
		return defaultVal
	}
	return d
}