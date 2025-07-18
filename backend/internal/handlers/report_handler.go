package handlers

import (
	"net/http"
	"strconv"
	"time"
	"kakeibo-tanuki/internal/models"
	"kakeibo-tanuki/internal/repositories"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ReportHandler struct {
	expenseRepo repositories.ExpenseRepository
}

func NewReportHandler(expenseRepo repositories.ExpenseRepository) *ReportHandler {
	return &ReportHandler{
		expenseRepo: expenseRepo,
	}
}

func (h *ReportHandler) GetMonthlyReport(c *gin.Context) {
	filters := &models.ReportFilters{}

	// Parse year parameter (required)
	yearStr := c.Query("year")
	if yearStr == "" {
		filters.Year = time.Now().Year()
	} else {
		year, err := strconv.Atoi(yearStr)
		if err != nil || year < 2000 || year > 2100 {
			c.JSON(http.StatusBadRequest, models.NewErrorResponse(
				"INVALID_YEAR",
				"Invalid year parameter",
				"Year must be a valid number between 2000 and 2100",
				c.Request.URL.Path,
			))
			return
		}
		filters.Year = year
	}

	// Parse month parameter (optional)
	monthStr := c.Query("month")
	if monthStr != "" {
		month, err := strconv.Atoi(monthStr)
		if err != nil || month < 1 || month > 12 {
			c.JSON(http.StatusBadRequest, models.NewErrorResponse(
				"INVALID_MONTH",
				"Invalid month parameter",
				"Month must be a number between 1 and 12",
				c.Request.URL.Path,
			))
			return
		}
		filters.Month = &month
	}

	// Parse card ID parameter (optional)
	cardIDStr := c.Query("cardId")
	if cardIDStr != "" {
		cardID, err := uuid.Parse(cardIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, models.NewErrorResponse(
				"INVALID_CARD_ID",
				"Invalid card ID format",
				err.Error(),
				c.Request.URL.Path,
			))
			return
		}
		filters.CardID = &cardID
	}

	report, err := h.expenseRepo.GetMonthlyReport(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to generate monthly report",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	c.JSON(http.StatusOK, models.NewSuccessResponse("Monthly report generated successfully", report))
}

func (h *ReportHandler) GetYearlyReport(c *gin.Context) {
	filters := &models.ReportFilters{}

	// Parse year parameter (required)
	yearStr := c.Query("year")
	if yearStr == "" {
		filters.Year = time.Now().Year()
	} else {
		year, err := strconv.Atoi(yearStr)
		if err != nil || year < 2000 || year > 2100 {
			c.JSON(http.StatusBadRequest, models.NewErrorResponse(
				"INVALID_YEAR",
				"Invalid year parameter",
				"Year must be a valid number between 2000 and 2100",
				c.Request.URL.Path,
			))
			return
		}
		filters.Year = year
	}

	// Parse card ID parameter (optional)
	cardIDStr := c.Query("cardId")
	if cardIDStr != "" {
		cardID, err := uuid.Parse(cardIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, models.NewErrorResponse(
				"INVALID_CARD_ID",
				"Invalid card ID format",
				err.Error(),
				c.Request.URL.Path,
			))
			return
		}
		filters.CardID = &cardID
	}

	report, err := h.expenseRepo.GetYearlyReport(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to generate yearly report",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	c.JSON(http.StatusOK, models.NewSuccessResponse("Yearly report generated successfully", report))
}