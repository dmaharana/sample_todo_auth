package database

import (
	"context"
	"database/sql"
	"backend/internal/models"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/sqlitedialect"
	"github.com/uptrace/bun/driver/sqliteshim"
)

// NewDB creates a new database connection
func NewDB(dsn string) (*bun.DB, error) {
	sqd, err := sql.Open(sqliteshim.ShimName, dsn)
	if err != nil {
		return nil, err
	}

	db := bun.NewDB(sqd, sqlitedialect.New())

	// Create tables
	_, err = db.NewCreateTable().Model((*models.User)(nil)).IfNotExists().Exec(context.Background())
	if err != nil {
		return nil, err
	}

	_, err = db.NewCreateTable().Model((*models.Role)(nil)).IfNotExists().Exec(context.Background())
	if err != nil {
		return nil, err
	}

	_, err = db.NewCreateTable().Model((*models.Task)(nil)).IfNotExists().Exec(context.Background())
	if err != nil {
		return nil, err
	}

	_, err = db.NewCreateTable().Model((*models.UserPreference)(nil)).IfNotExists().Exec(context.Background())
	if err != nil {
		return nil, err
	}

	// Insert default roles
	defaultRoles := []models.Role{
		{ID: 1, Name: "admin"},
		{ID: 2, Name: "user"},
	}
	for _, role := range defaultRoles {
		_, err := db.NewInsert().Model(&role).On("CONFLICT(id) DO UPDATE SET name = EXCLUDED.name").Exec(context.Background())
		if err != nil {
			return nil, err
		}
	}

	// Insert default admin user
	adminUser := models.User{
		ID:           1,
		Username:     "admin",
		PasswordHash: "$2a$10$AtbieXwDFuihP1HvwpVLreMoNGN6wtWtcJohl/Ngaqavw9q11hIPS", // Hashed password for "password"
		RoleID:       1, // Admin role
	}
	_, err = db.NewInsert().Model(&adminUser).On("CONFLICT(id) DO UPDATE SET username = EXCLUDED.username, password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id").Exec(context.Background())
	if err != nil {
		return nil, err
	}

	// Insert default admin user theme preference
	adminThemePreference := models.UserPreference{
		UserID: 1,
		Key:    "theme",
		Value:  "light",
	}
	_, err = db.NewInsert().Model(&adminThemePreference).On("CONFLICT(user_id, key) DO UPDATE SET value = EXCLUDED.value").Exec(context.Background())
	if err != nil {
		return nil, err
	}

	return db, nil
}
