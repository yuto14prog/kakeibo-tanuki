package repositories

import (
	"kakeibo-tanuki/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type expenseRepository struct {
	db *gorm.DB
}

func NewExpenseRepository(db *gorm.DB) ExpenseRepository {
	return &expenseRepository{db: db}
}

func (r *expenseRepository) Create(expense *models.Expense) error {
	return r.db.Create(expense).Error
}

func (r *expenseRepository) GetByID(id uuid.UUID) (*models.Expense, error) {
	var expense models.Expense
	err := r.db.Preload("Card").Preload("Category").Where("id = ?", id).First(&expense).Error
	if err != nil {
		return nil, err
	}
	return &expense, nil
}

func (r *expenseRepository) GetAll(filters *models.ExpenseFilters) ([]models.Expense, int, error) {
	var expenses []models.Expense
	var totalCount int64

	query := r.db.Model(&models.Expense{}).Preload("Card").Preload("Category")

	// Apply filters
	if filters.StartDate != nil {
		query = query.Where("date >= ?", filters.StartDate)
	}
	if filters.EndDate != nil {
		query = query.Where("date <= ?", filters.EndDate)
	}
	if filters.CardID != nil {
		query = query.Where("card_id = ?", filters.CardID)
	}
	if filters.CategoryID != nil {
		query = query.Where("category_id = ?", filters.CategoryID)
	}

	// Count total records
	if err := query.Count(&totalCount).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	if filters.Page <= 0 {
		filters.Page = 1
	}
	if filters.Limit <= 0 {
		filters.Limit = 20
	}
	offset := (filters.Page - 1) * filters.Limit

	// Get paginated results
	err := query.Order("date DESC").Offset(offset).Limit(filters.Limit).Find(&expenses).Error
	return expenses, int(totalCount), err
}

func (r *expenseRepository) Update(expense *models.Expense) error {
	return r.db.Save(expense).Error
}

func (r *expenseRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Expense{}, id).Error
}

func (r *expenseRepository) GetMonthlyReport(filters *models.ReportFilters) (*models.MonthlyReport, error) {
	var report models.MonthlyReport
	report.Year = filters.Year
	if filters.Month != nil {
		report.Month = *filters.Month
	}

	// Base query for the month
	query := r.db.Model(&models.Expense{}).
		Where("EXTRACT(YEAR FROM date) = ?", filters.Year)
	
	if filters.Month != nil {
		query = query.Where("EXTRACT(MONTH FROM date) = ?", *filters.Month)
	}

	if filters.CardID != nil {
		query = query.Where("card_id = ?", filters.CardID)
	}

	// Get total amount
	var totalAmount float64
	err := query.Select("COALESCE(SUM(amount), 0)").Scan(&totalAmount).Error
	if err != nil {
		return nil, err
	}
	report.TotalAmount = totalAmount

	// Get expenses by category
	var categoryExpenses []models.CategoryExpenseSum
	err = query.
		Select("categories.id as category_id, categories.name as category_name, categories.color, COALESCE(SUM(expenses.amount), 0) as total_amount, COUNT(expenses.id) as count").
		Joins("JOIN categories ON expenses.category_id = categories.id").
		Group("categories.id, categories.name, categories.color").
		Scan(&categoryExpenses).Error
	if err != nil {
		return nil, err
	}
	report.ByCategory = categoryExpenses

	// Get expenses by card (if not filtered by card)
	if filters.CardID == nil {
		var cardExpenses []models.CardExpenseSum
		err = query.
			Select("cards.id as card_id, cards.name as card_name, cards.color, COALESCE(SUM(expenses.amount), 0) as total_amount, COUNT(expenses.id) as count").
			Joins("JOIN cards ON expenses.card_id = cards.id").
			Group("cards.id, cards.name, cards.color").
			Scan(&cardExpenses).Error
		if err != nil {
			return nil, err
		}
		report.ByCard = cardExpenses
	}

	return &report, nil
}

func (r *expenseRepository) GetYearlyReport(filters *models.ReportFilters) (*models.YearlyReport, error) {
	var report models.YearlyReport
	report.Year = filters.Year

	// Base query for the year
	query := r.db.Model(&models.Expense{}).
		Where("EXTRACT(YEAR FROM date) = ?", filters.Year)
	
	if filters.CardID != nil {
		query = query.Where("card_id = ?", filters.CardID)
	}

	// Get total amount for the year
	var totalAmount float64
	err := query.Select("COALESCE(SUM(amount), 0)").Scan(&totalAmount).Error
	if err != nil {
		return nil, err
	}
	report.TotalAmount = totalAmount

	// Get monthly breakdown
	var monthlyData []models.MonthlyExpenseSum
	err = query.
		Select("EXTRACT(YEAR FROM date) as year, EXTRACT(MONTH FROM date) as month, COALESCE(SUM(amount), 0) as total_amount, COUNT(id) as count").
		Group("EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)").
		Order("month").
		Scan(&monthlyData).Error
	if err != nil {
		return nil, err
	}
	report.MonthlyData = monthlyData

	// Get expenses by category
	var categoryExpenses []models.CategoryExpenseSum
	err = query.
		Select("categories.id as category_id, categories.name as category_name, categories.color, COALESCE(SUM(expenses.amount), 0) as total_amount, COUNT(expenses.id) as count").
		Joins("JOIN categories ON expenses.category_id = categories.id").
		Group("categories.id, categories.name, categories.color").
		Scan(&categoryExpenses).Error
	if err != nil {
		return nil, err
	}
	report.ByCategory = categoryExpenses

	// Get expenses by card (if not filtered by card)
	if filters.CardID == nil {
		var cardExpenses []models.CardExpenseSum
		err = query.
			Select("cards.id as card_id, cards.name as card_name, cards.color, COALESCE(SUM(expenses.amount), 0) as total_amount, COUNT(expenses.id) as count").
			Joins("JOIN cards ON expenses.card_id = cards.id").
			Group("cards.id, cards.name, cards.color").
			Scan(&cardExpenses).Error
		if err != nil {
			return nil, err
		}
		report.ByCard = cardExpenses
	}

	return &report, nil
}