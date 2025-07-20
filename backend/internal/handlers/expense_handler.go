package handlers

import (
	"net/http"
	"strconv"
	"time"
	"kakeibo-tanuki/internal/models"
	"kakeibo-tanuki/internal/repositories"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/go-playground/validator/v10"
)

type ExpenseHandler struct {
	expenseRepo repositories.ExpenseRepository
	validator   *validator.Validate
}

func NewExpenseHandler(expenseRepo repositories.ExpenseRepository) *ExpenseHandler {
	return &ExpenseHandler{
		expenseRepo: expenseRepo,
		validator:   validator.New(),
	}
}

func (h *ExpenseHandler) GetExpenses(c *gin.Context) {
	filters := &models.ExpenseFilters{}

	// Parse query parameters
	if startDate := c.Query("startDate"); startDate != "" {
		if date, err := time.Parse("2006-01-02", startDate); err == nil {
			filters.StartDate = &date
		}
	}

	if endDate := c.Query("endDate"); endDate != "" {
		if date, err := time.Parse("2006-01-02", endDate); err == nil {
			filters.EndDate = &date
		}
	}

	if cardID := c.Query("cardId"); cardID != "" {
		if id, err := uuid.Parse(cardID); err == nil {
			filters.CardID = &id
		}
	}

	if categoryID := c.Query("categoryId"); categoryID != "" {
		if id, err := uuid.Parse(categoryID); err == nil {
			filters.CategoryID = &id
		}
	}

	if page := c.Query("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil && p > 0 {
			filters.Page = p
		}
	}

	if limit := c.Query("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil && l > 0 {
			filters.Limit = l
		}
	}

	expenses, totalCount, err := h.expenseRepo.GetAll(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to retrieve expenses",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	// Calculate pagination
	page := filters.Page
	if page <= 0 {
		page = 1
	}
	limit := filters.Limit
	if limit <= 0 {
		limit = 20
	}
	totalPages := (totalCount + limit - 1) / limit

	pagination := models.Pagination{
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
		TotalItems: totalCount,
	}

	c.JSON(http.StatusOK, models.NewPaginatedResponse(expenses, pagination))
}

func (h *ExpenseHandler) GetExpense(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"INVALID_UUID",
			"Invalid expense ID format",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	expense, err := h.expenseRepo.GetByID(id)
	if err != nil {
		if err.Error() == "record not found" {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(
				"EXPENSE_NOT_FOUND",
				"Expense not found",
				nil,
				c.Request.URL.Path,
			))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to retrieve expense",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	c.JSON(http.StatusOK, models.NewSuccessResponse("Expense retrieved successfully", expense))
}

func (h *ExpenseHandler) CreateExpense(c *gin.Context) {
	var req models.CreateExpenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"INVALID_REQUEST",
			"Invalid request body",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}


	if err := h.validator.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"VALIDATION_ERROR",
			"Validation failed",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	// Parse date string (try YYYY-MM-DD format first)
	parsedDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		// Try parsing as RFC3339 format
		parsedDate, err = time.Parse(time.RFC3339, req.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, models.NewErrorResponse(
				"INVALID_DATE",
				"Invalid date format",
				"Date must be in YYYY-MM-DD or RFC3339 format",
				c.Request.URL.Path,
			))
			return
		}
	}

	// Check if date is in the future
	if parsedDate.After(time.Now()) {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"FUTURE_DATE",
			"Expense date cannot be in the future",
			"Please select a current or past date",
			c.Request.URL.Path,
		))
		return
	}

	// Parse UUIDs
	cardID, err := uuid.Parse(req.CardID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"INVALID_CARD_ID",
			"Invalid card ID format",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	categoryID, err := uuid.Parse(req.CategoryID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"INVALID_CATEGORY_ID",
			"Invalid category ID format",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	expense := &models.Expense{
		ID:          uuid.New(),
		Amount:      req.Amount,
		Date:        parsedDate,
		Description: req.Description,
		CardID:      cardID,
		CategoryID:  categoryID,
	}

	if err := h.expenseRepo.Create(expense); err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to create expense",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	// Get the created expense with related data
	createdExpense, err := h.expenseRepo.GetByID(expense.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to retrieve created expense",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	c.JSON(http.StatusCreated, models.NewSuccessResponse("Expense created successfully", createdExpense))
}

func (h *ExpenseHandler) UpdateExpense(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"INVALID_UUID",
			"Invalid expense ID format",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	// Check if expense exists (without preload to avoid relation conflicts during update)
	expense, err := h.expenseRepo.GetByIDWithoutPreload(id)
	if err != nil {
		if err.Error() == "record not found" {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(
				"EXPENSE_NOT_FOUND",
				"Expense not found",
				nil,
				c.Request.URL.Path,
			))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to retrieve expense",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	var req models.UpdateExpenseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"INVALID_REQUEST",
			"Invalid request body",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	if err := h.validator.Struct(req); err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"VALIDATION_ERROR",
			"Validation failed",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	// Parse date string (try YYYY-MM-DD format first)
	parsedDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		// Try parsing as RFC3339 format
		parsedDate, err = time.Parse(time.RFC3339, req.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, models.NewErrorResponse(
				"INVALID_DATE",
				"Invalid date format",
				"Date must be in YYYY-MM-DD or RFC3339 format",
				c.Request.URL.Path,
			))
			return
		}
	}

	// Check if date is in the future
	if parsedDate.After(time.Now()) {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"FUTURE_DATE",
			"Expense date cannot be in the future",
			"Please select a current or past date",
			c.Request.URL.Path,
		))
		return
	}

	// Parse UUIDs
	cardID, err := uuid.Parse(req.CardID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"INVALID_CARD_ID",
			"Invalid card ID format",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	categoryID, err := uuid.Parse(req.CategoryID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"INVALID_CATEGORY_ID",
			"Invalid category ID format",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	expense.Amount = req.Amount
	expense.Date = parsedDate
	expense.Description = req.Description
	expense.CardID = cardID
	expense.CategoryID = categoryID

	if err := h.expenseRepo.Update(expense); err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to update expense",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	// Get the updated expense with related data
	updatedExpense, err := h.expenseRepo.GetByID(expense.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to retrieve updated expense",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	c.JSON(http.StatusOK, models.NewSuccessResponse("Expense updated successfully", updatedExpense))
}

func (h *ExpenseHandler) DeleteExpense(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"INVALID_UUID",
			"Invalid expense ID format",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	// Check if expense exists
	_, err = h.expenseRepo.GetByID(id)
	if err != nil {
		if err.Error() == "record not found" {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(
				"EXPENSE_NOT_FOUND",
				"Expense not found",
				nil,
				c.Request.URL.Path,
			))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to retrieve expense",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	if err := h.expenseRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to delete expense",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	c.JSON(http.StatusOK, models.NewSuccessResponse("Expense deleted successfully", nil))
}