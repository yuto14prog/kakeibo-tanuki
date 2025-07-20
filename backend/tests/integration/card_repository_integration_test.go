package integration

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"kakeibo-tanuki/internal/models"
	"kakeibo-tanuki/internal/repositories"
)

func setupTestDB() (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		return nil, err
	}

	// Auto-migrate tables with simplified schema for testing
	err = db.Exec("CREATE TABLE IF NOT EXISTS cards (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL, created_at DATETIME, updated_at DATETIME)").Error
	if err != nil {
		return nil, err
	}

	err = db.Exec("CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, color TEXT NOT NULL, is_shared BOOLEAN, created_at DATETIME, updated_at DATETIME)").Error
	if err != nil {
		return nil, err
	}

	err = db.Exec("CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, amount REAL NOT NULL, date DATETIME, description TEXT, card_id TEXT, category_id TEXT, created_at DATETIME, updated_at DATETIME)").Error
	if err != nil {
		return nil, err
	}

	return db, nil
}

func TestCardRepositoryIntegration_CRUD(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	repo := repositories.NewCardRepository(db)

	// Test Create
	card := &models.Card{
		ID:    uuid.New(),
		Name:  "テストカード",
		Color: "#3B82F6",
	}

	err = repo.Create(card)
	assert.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, card.ID)

	// Test GetByID
	retrievedCard, err := repo.GetByID(card.ID)
	assert.NoError(t, err)
	assert.Equal(t, card.Name, retrievedCard.Name)
	assert.Equal(t, card.Color, retrievedCard.Color)

	// Test GetAll
	cards, err := repo.GetAll()
	assert.NoError(t, err)
	assert.Len(t, cards, 1)
	assert.Equal(t, card.Name, cards[0].Name)

	// Test Update
	card.Name = "更新されたカード"
	card.Color = "#EF4444"
	err = repo.Update(card)
	assert.NoError(t, err)

	updatedCard, err := repo.GetByID(card.ID)
	assert.NoError(t, err)
	assert.Equal(t, "更新されたカード", updatedCard.Name)
	assert.Equal(t, "#EF4444", updatedCard.Color)

	// Test HasExpenses (should be false initially)
	hasExpenses, err := repo.HasExpenses(card.ID)
	assert.NoError(t, err)
	assert.False(t, hasExpenses)

	// Create an expense to test HasExpenses = true
	categoryRepo := repositories.NewCategoryRepository(db)
	category := &models.Category{
		ID:       uuid.New(),
		Name:     "テストカテゴリ",
		Color:    "#10B981",
		IsShared: false,
	}
	err = categoryRepo.Create(category)
	require.NoError(t, err)

	expenseRepo := repositories.NewExpenseRepository(db)
	expense := &models.Expense{
		ID:          uuid.New(),
		Amount:      1000.0,
		Description: "テスト支出",
		CardID:      card.ID,
		CategoryID:  category.ID,
	}
	err = expenseRepo.Create(expense)
	require.NoError(t, err)

	// Test HasExpenses (should be true now)
	hasExpenses, err = repo.HasExpenses(card.ID)
	assert.NoError(t, err)
	assert.True(t, hasExpenses)

	// Delete expense first to allow card deletion
	err = expenseRepo.Delete(expense.ID)
	assert.NoError(t, err)

	// Test Delete
	err = repo.Delete(card.ID)
	assert.NoError(t, err)

	// Verify deletion
	_, err = repo.GetByID(card.ID)
	assert.Error(t, err)
	assert.Equal(t, gorm.ErrRecordNotFound, err)
}

func TestCardRepositoryIntegration_GetByID_NotFound(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	repo := repositories.NewCardRepository(db)

	nonExistentID := uuid.New()
	card, err := repo.GetByID(nonExistentID)
	assert.Error(t, err)
	assert.Equal(t, gorm.ErrRecordNotFound, err)
	assert.Nil(t, card)
}

func TestCardRepositoryIntegration_MultipleCards(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	repo := repositories.NewCardRepository(db)

	// Create multiple cards
	cards := []*models.Card{
		{ID: uuid.New(), Name: "カード1", Color: "#3B82F6"},
		{ID: uuid.New(), Name: "カード2", Color: "#EF4444"},
		{ID: uuid.New(), Name: "カード3", Color: "#10B981"},
	}

	for _, card := range cards {
		err = repo.Create(card)
		assert.NoError(t, err)
	}

	// Test GetAll returns all cards in correct order (newest first)
	allCards, err := repo.GetAll()
	assert.NoError(t, err)
	assert.Len(t, allCards, 3)

	// Since they're ordered by created_at DESC, the last created should be first
	assert.Equal(t, "カード3", allCards[0].Name)
	assert.Equal(t, "カード2", allCards[1].Name)
	assert.Equal(t, "カード1", allCards[2].Name)
}