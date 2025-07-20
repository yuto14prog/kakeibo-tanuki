package integration

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"kakeibo-tanuki/internal/models"
	"kakeibo-tanuki/internal/repositories"
)

func TestCategoryRepositoryIntegration_CRUD(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	repo := repositories.NewCategoryRepository(db)

	// Test Create
	category := &models.Category{
		ID:       uuid.New(),
		Name:     "食費",
		Color:    "#10B981",
		IsShared: false,
	}

	err = repo.Create(category)
	assert.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, category.ID)

	// Test GetByID
	retrievedCategory, err := repo.GetByID(category.ID)
	assert.NoError(t, err)
	assert.Equal(t, category.Name, retrievedCategory.Name)
	assert.Equal(t, category.Color, retrievedCategory.Color)
	assert.Equal(t, category.IsShared, retrievedCategory.IsShared)

	// Test GetAll
	categories, err := repo.GetAll()
	assert.NoError(t, err)
	assert.Len(t, categories, 1)
	assert.Equal(t, category.Name, categories[0].Name)

	// Test Update (toggle shared flag)
	category.Name = "更新された食費"
	category.Color = "#EF4444"
	category.IsShared = true
	err = repo.Update(category)
	assert.NoError(t, err)

	updatedCategory, err := repo.GetByID(category.ID)
	assert.NoError(t, err)
	assert.Equal(t, "更新された食費", updatedCategory.Name)
	assert.Equal(t, "#EF4444", updatedCategory.Color)
	assert.True(t, updatedCategory.IsShared)

	// Test HasExpenses (should be false initially)
	hasExpenses, err := repo.HasExpenses(category.ID)
	assert.NoError(t, err)
	assert.False(t, hasExpenses)

	// Create a card and expense to test HasExpenses = true
	cardRepo := repositories.NewCardRepository(db)
	card := &models.Card{
		ID:    uuid.New(),
		Name:  "テストカード",
		Color: "#3B82F6",
	}
	err = cardRepo.Create(card)
	require.NoError(t, err)

	expenseRepo := repositories.NewExpenseRepository(db)
	expense := &models.Expense{
		ID:          uuid.New(),
		Amount:      1500.0,
		Description: "テスト支出",
		CardID:      card.ID,
		CategoryID:  category.ID,
	}
	err = expenseRepo.Create(expense)
	require.NoError(t, err)

	// Test HasExpenses (should be true now)
	hasExpenses, err = repo.HasExpenses(category.ID)
	assert.NoError(t, err)
	assert.True(t, hasExpenses)

	// Delete expense first to allow category deletion
	err = expenseRepo.Delete(expense.ID)
	assert.NoError(t, err)

	// Test Delete
	err = repo.Delete(category.ID)
	assert.NoError(t, err)

	// Verify deletion
	_, err = repo.GetByID(category.ID)
	assert.Error(t, err)
	assert.Equal(t, gorm.ErrRecordNotFound, err)
}

func TestCategoryRepositoryIntegration_SharedCategories(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	repo := repositories.NewCategoryRepository(db)

	// Create multiple categories with different shared flags
	categories := []*models.Category{
		{ID: uuid.New(), Name: "食費", Color: "#10B981", IsShared: false},
		{ID: uuid.New(), Name: "家賃", Color: "#EF4444", IsShared: true},
		{ID: uuid.New(), Name: "光熱費", Color: "#F59E0B", IsShared: true},
		{ID: uuid.New(), Name: "娯楽", Color: "#8B5CF6", IsShared: false},
	}

	for _, category := range categories {
		err = repo.Create(category)
		assert.NoError(t, err)
	}

	// Test GetAll returns all categories
	allCategories, err := repo.GetAll()
	assert.NoError(t, err)
	assert.Len(t, allCategories, 4)

	// Verify shared flags are preserved
	sharedCount := 0
	for _, cat := range allCategories {
		if cat.IsShared {
			sharedCount++
		}
	}
	assert.Equal(t, 2, sharedCount) // 家賃 and 光熱費 should be shared
}

func TestCategoryRepositoryIntegration_UniqueNameConstraint(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	repo := repositories.NewCategoryRepository(db)

	// Create first category
	category1 := &models.Category{
		ID:       uuid.New(),
		Name:     "食費",
		Color:    "#10B981",
		IsShared: false,
	}
	err = repo.Create(category1)
	assert.NoError(t, err)

	// Try to create another category with the same name
	category2 := &models.Category{
		ID:       uuid.New(),
		Name:     "食費", // Same name
		Color:    "#EF4444",
		IsShared: true,
	}
	err = repo.Create(category2)
	assert.Error(t, err) // Should fail due to unique constraint
}

func TestCategoryRepositoryIntegration_GetByID_NotFound(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	repo := repositories.NewCategoryRepository(db)

	nonExistentID := uuid.New()
	category, err := repo.GetByID(nonExistentID)
	assert.Error(t, err)
	assert.Equal(t, gorm.ErrRecordNotFound, err)
	assert.Nil(t, category)
}