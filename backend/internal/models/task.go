package models

import "github.com/uptrace/bun"

// Task represents the todo task model

type Task struct {
	bun.BaseModel `bun:"table:tasks,alias:t"`

	ID      int64  `bun:",pk,autoincrement"`
	Title   string `bun:",notnull"`
	Done    bool   `bun:",notnull,default:false"`
	UserID  int64
	User    *User `bun:"rel:belongs-to,join:user_id=id"`
}
