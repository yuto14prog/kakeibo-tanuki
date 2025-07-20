package models

import (
	"time"

	"github.com/google/uuid"
)

type Category struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name      string    `json:"name" gorm:"not null;unique" validate:"required,max=50"`
	Color     string    `json:"color" gorm:"not null;default:#10B981" validate:"required,hexcolor"`
	IsShared  bool      `json:"isShared" gorm:"not null;default:false"`
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

type CreateCategoryRequest struct {
	Name     string `json:"name" validate:"required,max=50"`
	Color    string `json:"color" validate:"required,hexcolor"`
	IsShared bool   `json:"isShared"`
}

type UpdateCategoryRequest struct {
	Name     string `json:"name" validate:"required,max=50"`
	Color    string `json:"color" validate:"required,hexcolor"`
	IsShared bool   `json:"isShared"`
}