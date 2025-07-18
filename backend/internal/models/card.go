package models

import (
	"time"

	"github.com/google/uuid"
)

type Card struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name      string    `json:"name" gorm:"not null" validate:"required,max=100"`
	Color     string    `json:"color" gorm:"not null;default:#3B82F6" validate:"required,hexcolor"`
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

type CreateCardRequest struct {
	Name  string `json:"name" validate:"required,max=100"`
	Color string `json:"color" validate:"required,hexcolor"`
}

type UpdateCardRequest struct {
	Name  string `json:"name" validate:"required,max=100"`
	Color string `json:"color" validate:"required,hexcolor"`
}