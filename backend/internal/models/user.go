package models

import (
	"time"

	"github.com/uptrace/bun"
)

// User represents the user model

type User struct {
	bun.BaseModel `bun:"table:users,alias:u"`

	ID       int64  `bun:",pk,autoincrement"`
	Username string `bun:",unique,notnull"`
	PasswordHash string `bun:"password_hash,notnull"`
	RoleID   int64
	Role         *Role     `bun:"rel:belongs-to,join:role_id=id"`
	CreatedAt    time.Time `bun:"created_at,notnull,default:current_timestamp,type:timestamptz"`
	UpdatedAt    time.Time `bun:"updated_at,notnull,default:current_timestamp,type:timestamptz"`
}
