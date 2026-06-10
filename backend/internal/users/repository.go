package users

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
)

// ErrUserNotFound возвращается методами репозитория, когда UPDATE или DELETE
// не затронули ни одной строки (т.е. пользователь с указанным id не найден).
// Содержит красивое текстовое сообщение для логов и errors.Is для сравнения.
var ErrUserNotFound = errors.New("user not found")

// UserRepository defines operations for user management in the database.
type UserRepository interface {
	// Create adds a new user with specified roles. Returns the created user or an error.
	Create(ctx context.Context, login, passwordHash string, roles []string) (*User, error)
	// GetByLogin retrieves a user by login. Returns nil if not found.
	GetByLogin(ctx context.Context, login string) (*User, error)
	// GetByID retrieves a user by ID. Returns nil if not found.
	GetByID(ctx context.Context, id string) (*User, error)
	// SetRoles replaces all roles for a user. Role names must be valid (admin, author, reader).
	SetRoles(ctx context.Context, userID string, roles []string) error
	// UpdatePassword changes the password hash for a user.
	UpdatePassword(ctx context.Context, userID string, passwordHash string) error
	// UpdateProfile обновляет указанные поля профиля пользователя.
	// Поля с nil в ProfileUpdate пропускаются (не трогают колонку и updated_at).
	// Если все поля nil — UPDATE не выполняется, метод возвращает nil (no-op).
	// Если пользователь не найден — возвращает ErrUserNotFound.
	UpdateProfile(ctx context.Context, userID string, update ProfileUpdate) error
	// List returns a paginated, filtered, sorted list of users and the total count.
	List(ctx context.Context, params ListParams) ([]*User, int, error)
	// Delete removes a user by ID. Cascade deletes user_roles and refresh_tokens.
	Delete(ctx context.Context, userID string) error
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

	userID := GenerateID()
	_, err = tx.ExecContext(ctx,
		"INSERT INTO users (id, login, password_hash, full_name, birth_date, location, avatar_url, about) VALUES (?, ?, ?, NULL, NULL, NULL, NULL, NULL)",
		userID, login, passwordHash,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert user: %w", err)
	}

	for _, roleName := range roles {
		if err := r.addRoleToUserTx(ctx, tx, userID, roleName); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return r.GetByID(ctx, userID)
}

// GetByLogin finds a user by login string, including their roles.
func (r *userRepository) GetByLogin(ctx context.Context, login string) (*User, error) {
	user := &User{}
	err := r.db.QueryRowContext(ctx,
		"SELECT id, login, password_hash, full_name, birth_date, location, avatar_url, about, created_at, updated_at FROM users WHERE login = ?",
		login,
	).Scan(&user.ID, &user.Login, &user.PasswordHash, &user.FullName, &user.BirthDate, &user.Location, &user.AvatarURL, &user.About, &user.CreatedAt, &user.UpdatedAt)
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

// GetByID finds a user by ID, including their roles.
func (r *userRepository) GetByID(ctx context.Context, id string) (*User, error) {
	user := &User{}
	err := r.db.QueryRowContext(ctx,
		"SELECT id, login, password_hash, full_name, birth_date, location, avatar_url, about, created_at, updated_at FROM users WHERE id = ?",
		id,
	).Scan(&user.ID, &user.Login, &user.PasswordHash, &user.FullName, &user.BirthDate, &user.Location, &user.AvatarURL, &user.About, &user.CreatedAt, &user.UpdatedAt)
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
func (r *userRepository) SetRoles(ctx context.Context, userID string, roles []string) error {
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
func (r *userRepository) getRolesByUserID(ctx context.Context, userID string) ([]Role, error) {
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
func (r *userRepository) addRoleToUserTx(ctx context.Context, tx *sql.Tx, userID string, roleName string) error {
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

func (r *userRepository) UpdatePassword(ctx context.Context, userID string, passwordHash string) error {
	result, err := r.db.ExecContext(ctx,
		"UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		passwordHash, userID,
	)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// UpdateProfile частично обновляет профиль пользователя.
// Собирает SQL динамически: для каждого непустого поля добавляется "col = ?"
// в SET-выражение. Если ни одно поле не задано — UPDATE не выполняется (no-op).
// При любом изменении также обновляется колонка updated_at.
func (r *userRepository) UpdateProfile(ctx context.Context, userID string, update ProfileUpdate) error {
	// Собираем список колонок для обновления. updated_at обновляется только
	// если реально меняется хотя бы одно поле.
	setClauses := []string{}
	args := []interface{}{}

	if update.FullName != nil {
		setClauses = append(setClauses, "full_name = ?")
		args = append(args, *update.FullName)
	}
	if update.Location != nil {
		setClauses = append(setClauses, "location = ?")
		args = append(args, *update.Location)
	}
	if update.BirthDate != nil {
		setClauses = append(setClauses, "birth_date = ?")
		args = append(args, *update.BirthDate)
	}
	if update.AvatarURL != nil {
		setClauses = append(setClauses, "avatar_url = ?")
		args = append(args, *update.AvatarURL)
	}
	if update.About != nil {
		setClauses = append(setClauses, "about = ?")
		args = append(args, *update.About)
	}

	// PATCH с пустым телом {} — нечего обновлять, ничего не делаем.
	if len(setClauses) == 0 {
		return nil
	}

	// Добавляем updated_at только если есть хотя бы одно реальное изменение.
	setClauses = append(setClauses, "updated_at = CURRENT_TIMESTAMP")
	args = append(args, userID)

	query := "UPDATE users SET " + strings.Join(setClauses, ", ") + " WHERE id = ?"
	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to update profile: %w", err)
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return ErrUserNotFound
	}
	return nil
}

func (r *userRepository) List(ctx context.Context, params ListParams) ([]*User, int, error) {
	var args []interface{}

	where := ""
	if params.Search != "" {
		where = "WHERE u.login LIKE ?"
		args = append(args, "%"+params.Search+"%")
	}

	if len(params.Roles) > 0 {
		placeholders := make([]string, len(params.Roles))
		for i, role := range params.Roles {
			placeholders[i] = "?"
			args = append(args, role)
		}
		roleFilter := fmt.Sprintf(
			"EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = u.id AND r.name IN (%s))",
			strings.Join(placeholders, ","),
		)
		if where == "" {
			where = "WHERE " + roleFilter
		} else {
			where += " AND " + roleFilter
		}
	}

	var total int
	countQuery := "SELECT COUNT(*) FROM users u " + where
	countArgs := make([]interface{}, len(args))
	copy(countArgs, args)
	if err := r.db.QueryRowContext(ctx, countQuery, countArgs...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}

	sortBy := params.SortBy
	if sortBy == "" {
		sortBy = "login"
	}
	sortDir := params.SortDir
	if sortDir == "" {
		sortDir = "asc"
	}
	order := fmt.Sprintf("ORDER BY u.%s %s", sortBy, sortDir)

	offset := (params.Page - 1) * params.PerPage
	dataQuery := fmt.Sprintf(
		"SELECT u.id, u.login, u.password_hash, u.full_name, u.birth_date, u.location, u.avatar_url, u.about, u.created_at, u.updated_at FROM users u %s %s LIMIT ? OFFSET ?",
		where, order,
	)
	dataArgs := make([]interface{}, len(args))
	copy(dataArgs, args)
	dataArgs = append(dataArgs, params.PerPage, offset)

	rows, err := r.db.QueryContext(ctx, dataQuery, dataArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query users: %w", err)
	}
	defer rows.Close()

	var users []*User
	for rows.Next() {
		user := &User{}
		if err := rows.Scan(&user.ID, &user.Login, &user.PasswordHash, &user.FullName, &user.BirthDate, &user.Location, &user.AvatarURL, &user.About, &user.CreatedAt, &user.UpdatedAt); err != nil {
			return nil, 0, fmt.Errorf("failed to scan user: %w", err)
		}
		roles, err := r.getRolesByUserID(ctx, user.ID)
		if err != nil {
			return nil, 0, err
		}
		user.Roles = roles
		users = append(users, user)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("failed to iterate users: %w", err)
	}

	if users == nil {
		users = []*User{}
	}

	return users, total, nil
}

func (r *userRepository) Delete(ctx context.Context, userID string) error {
	result, err := r.db.ExecContext(ctx, "DELETE FROM users WHERE id = ?", userID)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("user not found")
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