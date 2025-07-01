package models

import (
	"time"
)

type UserPreference struct {
	ID        int64     `bun:"id,pk,autoincrement" json:"id"`
	UserID    int64     `bun:"user_id,notnull,unique:user_id_key" json:"user_id"`
	Key       string    `bun:"key,notnull,unique:user_id_key" json:"key"`
	Value     string    `bun:"value,notnull" json:"value"`
	CreatedAt time.Time `bun:"created_at,notnull,default:current_timestamp,type:timestamptz"`
	UpdatedAt time.Time `bun:"updated_at,notnull,default:current_timestamp,type:timestamptz"`
}
