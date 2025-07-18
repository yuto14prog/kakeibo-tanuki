package repositories

import (
	"gorm.io/gorm"
)

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{
		Card:     NewCardRepository(db),
		Category: NewCategoryRepository(db),
		Expense:  NewExpenseRepository(db),
	}
}