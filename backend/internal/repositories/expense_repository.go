package repositories

import (
	"fmt"
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

func (r *expenseRepository) GetByIDWithoutPreload(id uuid.UUID) (*models.Expense, error) {
	var expense models.Expense
	err := r.db.Where("id = ?", id).First(&expense).Error
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
	
	// Month is now required
	if filters.Month == nil {
		return nil, fmt.Errorf("month parameter is required for monthly report")
	}
	report.Month = *filters.Month

	// Base query for the month
	baseQuery := r.db.Where("EXTRACT(YEAR FROM date) = ?", filters.Year)
	
	if filters.Month != nil {
		baseQuery = baseQuery.Where("EXTRACT(MONTH FROM date) = ?", *filters.Month)
	}

	if filters.CardID != nil {
		baseQuery = baseQuery.Where("card_id = ?", filters.CardID)
	}

	// Get total amount
	var totalAmount float64
	err := baseQuery.Model(&models.Expense{}).Select("COALESCE(SUM(amount), 0)").Scan(&totalAmount).Error
	if err != nil {
		return nil, err
	}
	report.TotalAmount = totalAmount

	// Get expenses by category using separate query
	var categoryExpenses []models.CategoryExpenseSum
	categoryQuery := r.db.Table("expenses e").
		Select("c.id as category_id, c.name as category_name, c.color, c.is_shared, COALESCE(SUM(e.amount), 0) as total_amount, COUNT(e.id) as count").
		Joins("JOIN categories c ON e.category_id = c.id").
		Where("EXTRACT(YEAR FROM e.date) = ?", filters.Year)
	
	if filters.Month != nil {
		categoryQuery = categoryQuery.Where("EXTRACT(MONTH FROM e.date) = ?", *filters.Month)
	}
	if filters.CardID != nil {
		categoryQuery = categoryQuery.Where("e.card_id = ?", filters.CardID)
	}
	
	err = categoryQuery.Group("c.id, c.name, c.color, c.is_shared").Scan(&categoryExpenses).Error
	if err != nil {
		return nil, err
	}
	report.ByCategory = categoryExpenses

	// Calculate shared expenses summary
	var sharedCategories []models.CategoryExpenseSum
	var totalSharedAmount float64
	
	for _, category := range categoryExpenses {
		if category.IsShared {
			sharedCategories = append(sharedCategories, category)
			totalSharedAmount += category.TotalAmount
		}
	}
	
	report.SharedExpenses = models.SharedExpensesSummary{
		TotalSharedAmount: totalSharedAmount,
		SplitAmount:       totalSharedAmount / 2.0,
		Categories:        sharedCategories,
	}

	// Get expenses by card (if not filtered by card)
	if filters.CardID == nil {
		var cardExpenses []models.CardExpenseSum
		cardQuery := r.db.Table("expenses e").
			Select("cd.id as card_id, cd.name as card_name, cd.color, COALESCE(SUM(e.amount), 0) as total_amount, COUNT(e.id) as count").
			Joins("JOIN cards cd ON e.card_id = cd.id").
			Where("EXTRACT(YEAR FROM e.date) = ?", filters.Year)
		
		if filters.Month != nil {
			cardQuery = cardQuery.Where("EXTRACT(MONTH FROM e.date) = ?", *filters.Month)
		}
		
		err = cardQuery.Group("cd.id, cd.name, cd.color").Scan(&cardExpenses).Error
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
	baseQuery := r.db.Where("EXTRACT(YEAR FROM date) = ?", filters.Year)
	
	if filters.CardID != nil {
		baseQuery = baseQuery.Where("card_id = ?", filters.CardID)
	}

	// Get total amount for the year
	var totalAmount float64
	err := baseQuery.Model(&models.Expense{}).Select("COALESCE(SUM(amount), 0)").Scan(&totalAmount).Error
	if err != nil {
		return nil, err
	}
	report.TotalAmount = totalAmount

	// Get monthly breakdown using separate query
	var monthlyData []models.MonthlyExpenseSum
	monthlyQuery := r.db.Table("expenses e").
		Select("EXTRACT(YEAR FROM e.date) as year, EXTRACT(MONTH FROM e.date) as month, COALESCE(SUM(e.amount), 0) as total_amount, COUNT(e.id) as count").
		Where("EXTRACT(YEAR FROM e.date) = ?", filters.Year)
	
	if filters.CardID != nil {
		monthlyQuery = monthlyQuery.Where("e.card_id = ?", filters.CardID)
	}
	
	err = monthlyQuery.Group("EXTRACT(YEAR FROM e.date), EXTRACT(MONTH FROM e.date)").
		Order("month").
		Scan(&monthlyData).Error
	if err != nil {
		return nil, err
	}
	report.MonthlyData = monthlyData

	// Get expenses by category using separate query
	var categoryExpenses []models.CategoryExpenseSum
	categoryQuery := r.db.Table("expenses e").
		Select("c.id as category_id, c.name as category_name, c.color, c.is_shared, COALESCE(SUM(e.amount), 0) as total_amount, COUNT(e.id) as count").
		Joins("JOIN categories c ON e.category_id = c.id").
		Where("EXTRACT(YEAR FROM e.date) = ?", filters.Year)
	
	if filters.CardID != nil {
		categoryQuery = categoryQuery.Where("e.card_id = ?", filters.CardID)
	}
	
	err = categoryQuery.Group("c.id, c.name, c.color, c.is_shared").Scan(&categoryExpenses).Error
	if err != nil {
		return nil, err
	}
	report.ByCategory = categoryExpenses

	// Get expenses by card (if not filtered by card)
	if filters.CardID == nil {
		var cardExpenses []models.CardExpenseSum
		cardQuery := r.db.Table("expenses e").
			Select("cd.id as card_id, cd.name as card_name, cd.color, COALESCE(SUM(e.amount), 0) as total_amount, COUNT(e.id) as count").
			Joins("JOIN cards cd ON e.card_id = cd.id").
			Where("EXTRACT(YEAR FROM e.date) = ?", filters.Year)
		
		err = cardQuery.Group("cd.id, cd.name, cd.color").Scan(&cardExpenses).Error
		if err != nil {
			return nil, err
		}
		report.ByCard = cardExpenses
	}

	return &report, nil
}