package main

import (
	"log"
	"os"

	"kakeibo-tanuki/internal/database"
	"kakeibo-tanuki/internal/handlers"
	"kakeibo-tanuki/internal/middleware"
	"kakeibo-tanuki/internal/repositories"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize database
	db, err := database.NewDatabase()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Initialize repositories
	repo := repositories.NewRepository(db.GetDB())

	// Initialize handlers
	cardHandler := handlers.NewCardHandler(repo.Card)
	categoryHandler := handlers.NewCategoryHandler(repo.Category)
	expenseHandler := handlers.NewExpenseHandler(repo.Expense)
	reportHandler := handlers.NewReportHandler(repo.Expense)

	// Initialize Gin router
	router := gin.Default()

	// Add middleware
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.LoggingMiddleware())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		if err := db.Ping(); err != nil {
			c.JSON(500, gin.H{
				"status": "error",
				"message": "Database connection failed",
				"error": err.Error(),
			})
			return
		}
		c.JSON(200, gin.H{
			"status": "ok",
			"message": "Kakeibo API is running",
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

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}