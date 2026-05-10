package users

import (
	"context"
	"log"
)

func BootstrapAdmin(ctx context.Context, repo UserRepository, login, password string) error {
	hasAdmin, err := repo.HasRole(ctx, "admin")
	if err != nil {
		log.Printf("Admin bootstrap failed: %v", err)
		return err
	}
	if hasAdmin {
		log.Printf("Admin bootstrap skipped, role 'admin' already exists")
		return nil
	}

	user := &User{Login: login}
	if err := user.SetPassword(password); err != nil {
		log.Printf("Admin bootstrap failed: %v", err)
		return err
	}

	_, err = repo.Create(ctx, login, user.PasswordHash, []string{"admin"})
	if err != nil {
		log.Printf("Admin bootstrap failed: %v", err)
		return err
	}

	log.Printf("Admin user created: login=%s", login)
	return nil
}