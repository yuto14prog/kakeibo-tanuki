package models

import (
	"time"

	"github.com/google/uuid"
)

type Expense struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Amount      float64   `json:"amount" gorm:"not null;check:amount > 0" validate:"required,gt=0"`
	Date        time.Time `json:"date" gorm:"not null" validate:"required"`
	Description string    `json:"description"`
	CardID      uuid.UUID `json:"cardId" gorm:"not null" validate:"required"`
	CategoryID  uuid.UUID `json:"categoryId" gorm:"not null" validate:"required"`
	Card        Card      `json:"card,omitempty" gorm:"foreignKey:CardID;constraint:OnDelete:CASCADE"`
	Category    Category  `json:"category,omitempty" gorm:"foreignKey:CategoryID;constraint:OnDelete:RESTRICT"`
	CreatedAt   time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

type CreateExpenseRequest struct {
	Amount      float64   `json:"amount" validate:"required,gt=0"`
	Date        time.Time `json:"date" validate:"required"`
	Description string    `json:"description"`
	CardID      uuid.UUID `json:"cardId" validate:"required"`
	CategoryID  uuid.UUID `json:"categoryId" validate:"required"`
}

type UpdateExpenseRequest struct {
	Amount      float64   `json:"amount" validate:"required,gt=0"`
	Date        time.Time `json:"date" validate:"required"`
	Description string    `json:"description"`
	CardID      uuid.UUID `json:"cardId" validate:"required"`
	CategoryID  uuid.UUID `json:"categoryId" validate:"required"`
}

type ExpenseFilters struct {
	StartDate  *time.Time `json:"startDate"`
	EndDate    *time.Time `json:"endDate"`
	CardID     *uuid.UUID `json:"cardId"`
	CategoryID *uuid.UUID `json:"categoryId"`
	Page       int        `json:"page"`
	Limit      int        `json:"limit"`
}