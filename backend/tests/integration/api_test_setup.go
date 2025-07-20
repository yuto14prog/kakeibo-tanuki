package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"kakeibo-tanuki/internal/handlers"
	"kakeibo-tanuki/internal/middleware"
	"kakeibo-tanuki/internal/models"
	"kakeibo-tanuki/internal/repositories"
)

// TestServer represents a test server setup for API integration tests
type TestServer struct {
	Router     *gin.Engine
	DB         *gorm.DB
	Repository *repositories.Repository
}

// SetupTestServer creates a new test server with in-memory database
func SetupTestServer(t *testing.T) *TestServer {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Setup test database
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logger.Silent),
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	require.NoError(t, err)

	// Create tables with simplified schema for testing
	err = db.Exec("CREATE TABLE IF NOT EXISTS cards (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL, created_at DATETIME, updated_at DATETIME)").Error
	require.NoError(t, err)

	err = db.Exec("CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, color TEXT NOT NULL, is_shared BOOLEAN, created_at DATETIME, updated_at DATETIME)").Error
	require.NoError(t, err)

	err = db.Exec("CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, amount REAL NOT NULL, date DATETIME, description TEXT, card_id TEXT, category_id TEXT, created_at DATETIME, updated_at DATETIME)").Error
	require.NoError(t, err)

	// Initialize repositories
	repo := repositories.NewRepository(db)

	// Initialize handlers
	cardHandler := handlers.NewCardHandler(repo.Card)
	categoryHandler := handlers.NewCategoryHandler(repo.Category)
	expenseHandler := handlers.NewExpenseHandler(repo.Expense)
	reportHandler := handlers.NewReportHandler(repo.Expense)

	// Initialize Gin router
	router := gin.New()

	// Add middleware (but skip logging for tests)
	router.Use(middleware.CORSMiddleware())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Test API is running",
		})
	})

	// API routes group
	api := router.Group("/api")
	{
		// Card routes
		cards := api.Group("/cards")
		{
			cards.GET("", cardHandler.GetCards)
			cards.POST("", cardHandler.CreateCard)
			cards.GET("/:id", cardHandler.GetCard)
			cards.PUT("/:id", cardHandler.UpdateCard)
			cards.DELETE("/:id", cardHandler.DeleteCard)
		}

		// Category routes
		categories := api.Group("/categories")
		{
			categories.GET("", categoryHandler.GetCategories)
			categories.POST("", categoryHandler.CreateCategory)
			categories.GET("/:id", categoryHandler.GetCategory)
			categories.PUT("/:id", categoryHandler.UpdateCategory)
			categories.DELETE("/:id", categoryHandler.DeleteCategory)
		}

		// Expense routes
		expenses := api.Group("/expenses")
		{
			expenses.GET("", expenseHandler.GetExpenses)
			expenses.POST("", expenseHandler.CreateExpense)
			expenses.GET("/:id", expenseHandler.GetExpense)
			expenses.PUT("/:id", expenseHandler.UpdateExpense)
			expenses.DELETE("/:id", expenseHandler.DeleteExpense)
		}

		// Report routes
		reports := api.Group("/reports")
		{
			reports.GET("/monthly", reportHandler.GetMonthlyReport)
			reports.GET("/yearly", reportHandler.GetYearlyReport)
		}
	}

	return &TestServer{
		Router:     router,
		DB:         db,
		Repository: repo,
	}
}

// CleanupTestServer performs cleanup after tests
func (ts *TestServer) CleanupTestServer() {
	// Clear all tables
	ts.DB.Exec("DELETE FROM expenses")
	ts.DB.Exec("DELETE FROM categories")
	ts.DB.Exec("DELETE FROM cards")
}

// CreateTestCard creates a test card for testing purposes
func (ts *TestServer) CreateTestCard(t *testing.T, name, color string) *models.Card {
	card := &models.Card{
		ID:    uuid.New(),
		Name:  name,
		Color: color,
	}
	
	err := ts.Repository.Card.Create(card)
	require.NoError(t, err)
	
	return card
}

// CreateTestCategory creates a test category for testing purposes
func (ts *TestServer) CreateTestCategory(t *testing.T, name, color string, isShared bool) *models.Category {
	category := &models.Category{
		ID:       uuid.New(),
		Name:     name,
		Color:    color,
		IsShared: isShared,
	}
	
	err := ts.Repository.Category.Create(category)
	require.NoError(t, err)
	
	return category
}

// CreateTestExpense creates a test expense for testing purposes
func (ts *TestServer) CreateTestExpense(t *testing.T, amount float64, description string, cardID, categoryID uuid.UUID) *models.Expense {
	expense := &models.Expense{
		ID:          uuid.New(),
		Amount:      amount,
		Date:        time.Now().Add(-24 * time.Hour), // Set a past date
		Description: description,
		CardID:      cardID,
		CategoryID:  categoryID,
	}
	
	err := ts.Repository.Expense.Create(expense)
	require.NoError(t, err)
	
	return expense
}

// MakeRequest is a helper function to make HTTP requests to the test server
func (ts *TestServer) MakeRequest(method, url string, body interface{}) *httptest.ResponseRecorder {
	var req *http.Request
	var err error
	
	if body != nil {
		jsonBody, _ := json.Marshal(body)
		req, err = http.NewRequest(method, url, bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, err = http.NewRequest(method, url, nil)
	}
	
	if err != nil {
		panic(err)
	}
	
	w := httptest.NewRecorder()
	ts.Router.ServeHTTP(w, req)
	
	return w
}