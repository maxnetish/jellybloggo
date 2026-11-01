package database

import (
	"database/sql"
	"embed"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	_ "modernc.org/sqlite"
)

//go:embed migrations/*.up.sql
var migrationsFS embed.FS

// New creates a new database connection and runs all pending migrations.
// The dsn parameter should be a path to the SQLite database file.
func New(dsn string) (*sql.DB, error) {
	dir := filepath.Dir(dsn)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	db, err := sql.Open("sqlite", dsn+"?_foreign_keys=on")
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Printf("Database connection established, dsn=%s", dsn)

	if err := runMigrations(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Printf("Database migrations completed")

	return db, nil
}

// NewInMemory creates a new in-memory SQLite database with all migrations applied.
// Each call returns a fresh, isolated database that exists only for the lifetime
// of the returned *sql.DB — perfect for unit/integration tests.
//
// The caller is responsible for closing the returned *sql.DB (e.g. via t.Cleanup).
func NewInMemory() (*sql.DB, error) {
	db, err := sql.Open("sqlite", ":memory:?_foreign_keys=on")
	if err != nil {
		return nil, fmt.Errorf("failed to open in-memory db: %w", err)
	}

	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping in-memory db: %w", err)
	}

	if err := runMigrations(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	return db, nil
}

// runMigrations executes all pending SQL migration files in order.
// Each migration is executed only once and tracked in the _migrations table.
func runMigrations(db *sql.DB) error {
	if err := createMigrationsTable(db); err != nil {
		return err
	}

	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	var migrationFiles []string
	for _, entry := range entries {
		if strings.HasSuffix(entry.Name(), ".up.sql") {
			migrationFiles = append(migrationFiles, entry.Name())
		}
	}
	sort.Strings(migrationFiles)

	for _, filename := range migrationFiles {
		applied, err := isMigrationApplied(db, filename)
		if err != nil {
			return fmt.Errorf("failed to check migration status: %w", err)
		}
		if applied {
			continue
		}

		content, err := migrationsFS.ReadFile(filepath.Join("migrations", filename))
		if err != nil {
			return fmt.Errorf("failed to read migration %s: %w", filename, err)
		}

		// SQLite has no "ADD COLUMN IF NOT EXISTS". Migrations may have been
		// amended after their first release (e.g. a column moved into an
		// earlier CREATE TABLE), so an ADD COLUMN can legitimately target an
		// existing column on fresh databases. Try each statement and tolerate
		// duplicate-column errors instead of failing the whole migration.
		for _, stmt := range strings.Split(string(content), ";") {
			stmt = strings.TrimSpace(stmt)
			if stmt == "" {
				continue
			}
			if _, err := db.Exec(stmt); err != nil {
				if isDuplicateColumnError(err) {
					continue
				}
				return fmt.Errorf("failed to execute migration %s: %w", filename, err)
			}
		}

		if err := recordMigration(db, filename); err != nil {
			return fmt.Errorf("failed to record migration %s: %w", filename, err)
		}

		log.Printf("Applied migration: %s", filename)
	}

	return nil
}

// isDuplicateColumnError reports whether err is SQLite's "duplicate column
// name" error (modernc.org/sqlite, errno 1 / SQL logic error).
func isDuplicateColumnError(err error) bool {
	return strings.Contains(err.Error(), "duplicate column name")
}

// createMigrationsTable creates the _migrations table if it doesn't exist.
// This table stores the history of applied migrations.
func createMigrationsTable(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS _migrations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE,
			applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`)
	return err
}

// isMigrationApplied checks if a migration has already been applied to the database.
func isMigrationApplied(db *sql.DB, name string) (bool, error) {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM _migrations WHERE name = ?", name).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// recordMigration records a migration as applied in the _migrations table.
func recordMigration(db *sql.DB, name string) error {
	_, err := db.Exec("INSERT INTO _migrations (name) VALUES (?)", name)
	return err
}