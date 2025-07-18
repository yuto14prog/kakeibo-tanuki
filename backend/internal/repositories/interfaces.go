package repositories

import (
	"kakeibo-tanuki/internal/models"
	"github.com/google/uuid"
)

type CardRepository interface {
	Create(card *models.Card) error
	GetByID(id uuid.UUID) (*models.Card, error)
	GetAll() ([]models.Card, error)
	Update(card *models.Card) error
	Delete(id uuid.UUID) error
	HasExpenses(cardID uuid.UUID) (bool, error)
}

type CategoryRepository interface {
	Create(category *models.Category) error
	GetByID(id uuid.UUID) (*models.Category, error)
	GetAll() ([]models.Category, error)
	Update(category *models.Category) error
	Delete(id uuid.UUID) error
	HasExpenses(categoryID uuid.UUID) (bool, error)
}

type ExpenseRepository interface {
	Create(expense *models.Expense) error
	GetByID(id uuid.UUID) (*models.Expense, error)
	GetAll(filters *models.ExpenseFilters) ([]models.Expense, int, error)
	Update(expense *models.Expense) error
	Delete(id uuid.UUID) error
	GetMonthlyReport(filters *models.ReportFilters) (*models.MonthlyReport, error)
	GetYearlyReport(filters *models.ReportFilters) (*models.YearlyReport, error)
}

type Repository struct {
	Card     CardRepository
	Category CategoryRepository
	Expense  ExpenseRepository
}