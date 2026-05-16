package users

import (
	"crypto/rand"
	"math/big"
	"time"

	"github.com/maxnetish/jellybloggo/internal/pagination"
	"golang.org/x/crypto/bcrypt"
)

const idAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const idLength = 10

func GenerateID() string {
	result := make([]byte, idLength)
	alphabetLen := big.NewInt(int64(len(idAlphabet)))
	for i := range result {
		n, _ := rand.Int(rand.Reader, alphabetLen)
		result[i] = idAlphabet[n.Int64()]
	}
	return string(result)
}

type User struct {
	ID           string    `json:"id"`
	Login        string    `json:"login"`
	PasswordHash string    `json:"-"`
	Roles        []Role    `json:"roles"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Role struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type CreateUserRequest struct {
	Login  string   `json:"login"`
	Pass   string   `json:"password"`
	Roles  []string `json:"roles"`
}

func (u *User) SetPassword(password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hash)
	return nil
}

func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

func (u *User) HasRole(roleName string) bool {
	for _, role := range u.Roles {
		if role.Name == roleName {
			return true
		}
	}
	return false
}

type ListParams struct {
	Roles   []string
	Search  string
	SortBy  string
	SortDir string
	Page    int
	PerPage int
}

type UserResponse struct {
	ID        string    `json:"id"`
	Login     string    `json:"login"`
	Roles     []string  `json:"roles"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UserListResponse struct {
	Content    []UserResponse        `json:"content"`
	Pagination pagination.Pagination `json:"pagination"`
}

func UserToResponse(u *User) UserResponse {
	roles := make([]string, len(u.Roles))
	for i, r := range u.Roles {
		roles[i] = r.Name
	}
	return UserResponse{
		ID:        u.ID,
		Login:     u.Login,
		Roles:     roles,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}