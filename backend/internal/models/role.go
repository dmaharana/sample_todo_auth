package models

import "github.com/uptrace/bun"

// Role represents the user role model

type Role struct {
	bun.BaseModel `bun:"table:roles,alias:r"`

	ID   int64  `bun:",pk,autoincrement"`
	Name string `bun:",unique,notnull"`
}
