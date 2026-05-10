package users

import (
	"context"
	"database/sql"
	"fmt"
)

// UserRepository defines operations for user management in the database.
type UserRepository interface {
	// Create adds a new user with specified roles. Returns the created user or an error.
	Create(ctx context.Context, login, passwordHash string, roles []string) (*User, error)
	// GetByLogin retrieves a user by login. Returns nil if not found.
	GetByLogin(ctx context.Context, login string) (*User, error)
	// GetByID retrieves a user by ID. Returns nil if not found.
	GetByID(ctx context.Context, id int) (*User, error)
	// SetRoles replaces all roles for a user. Role names must be valid (admin, author, reader).
	SetRoles(ctx context.Context, userID int, roles []string) error
	// HasRole checks if any user has the specified role.
	HasRole(ctx context.Context, roleName string) (bool, error)
}

type userRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepository{db: db}
}

// Create inserts a new user with hashed password and assigned roles.
func (r *userRepository) Create(ctx context.Context, login, passwordHash string, roles []string) (*User, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	result, err := tx.ExecContext(ctx,
		"INSERT INTO users (login, password_hash) VALUES (?, ?)",
		login, passwordHash,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert user: %w", err)
	}

	userID, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get last insert id: %w", err)
	}

	for _, roleName := range roles {
		if err := r.addRoleToUserTx(ctx, tx, int(userID), roleName); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return r.GetByID(ctx, int(userID))
}

// GetByLogin finds a user by login string, including their roles.
func (r *userRepository) GetByLogin(ctx context.Context, login string) (*User, error) {
	user := &User{}
	err := r.db.QueryRowContext(ctx,
		"SELECT id, login, password_hash, created_at, updated_at FROM users WHERE login = ?",
		login,
	).Scan(&user.ID, &user.Login, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user by login: %w", err)
	}

	roles, err := r.getRolesByUserID(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	user.Roles = roles

	return user, nil
}

// GetByID finds a user by numeric ID, including their roles.
func (r *userRepository) GetByID(ctx context.Context, id int) (*User, error) {
	user := &User{}
	err := r.db.QueryRowContext(ctx,
		"SELECT id, login, password_hash, created_at, updated_at FROM users WHERE id = ?",
		id,
	).Scan(&user.ID, &user.Login, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user by id: %w", err)
	}

	roles, err := r.getRolesByUserID(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	user.Roles = roles

	return user, nil
}

// SetRoles removes all existing role assignments and assigns the given roles to a user.
func (r *userRepository) SetRoles(ctx context.Context, userID int, roles []string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "DELETE FROM user_roles WHERE user_id = ?", userID); err != nil {
		return fmt.Errorf("failed to delete old roles: %w", err)
	}

	for _, roleName := range roles {
		if err := r.addRoleToUserTx(ctx, tx, userID, roleName); err != nil {
			return err
		}
	}

	return tx.Commit()
}

// getRolesByUserID loads all roles assigned to a user.
func (r *userRepository) getRolesByUserID(ctx context.Context, userID int) ([]Role, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT r.id, r.name FROM roles r
		 JOIN user_roles ur ON r.id = ur.role_id
		 WHERE ur.user_id = ?`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get roles: %w", err)
	}
	defer rows.Close()

	var roles []Role
	for rows.Next() {
		var role Role
		if err := rows.Scan(&role.ID, &role.Name); err != nil {
			return nil, fmt.Errorf("failed to scan role: %w", err)
		}
		roles = append(roles, role)
	}

	return roles, rows.Err()
}

// addRoleToUserTx assigns a role to a user within an active transaction.
func (r *userRepository) addRoleToUserTx(ctx context.Context, tx *sql.Tx, userID int, roleName string) error {
	var roleID int
	err := tx.QueryRowContext(ctx, "SELECT id FROM roles WHERE name = ?", roleName).Scan(&roleID)
	if err == sql.ErrNoRows {
		return fmt.Errorf("role '%s' does not exist", roleName)
	}
	if err != nil {
		return fmt.Errorf("failed to get role id: %w", err)
	}

	_, err = tx.ExecContext(ctx, "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", userID, roleID)
	if err != nil {
		return fmt.Errorf("failed to assign role to user: %w", err)
	}

	return nil
}

func (r *userRepository) HasRole(ctx context.Context, roleName string) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx,
		`SELECT EXISTS(
			SELECT 1 FROM user_roles ur 
			JOIN roles r ON ur.role_id = r.id 
			WHERE r.name = ?
		)`,
		roleName,
	).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check role: %w", err)
	}
	return exists, nil
}