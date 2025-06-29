package models

import "github.com/uptrace/bun"

// User represents the user model

type User struct {
	bun.BaseModel `bun:"table:users,alias:u"`

	ID       int64  `bun:",pk,autoincrement"`
	Username string `bun:",unique,notnull"`
	PasswordHash string `bun:"password_hash,notnull"`
	RoleID   int64
	Role     *Role `bun:"rel:belongs-to,join:role_id=id"`
}
