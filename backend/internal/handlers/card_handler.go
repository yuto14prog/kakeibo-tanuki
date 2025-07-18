package handlers

import (
	"net/http"
	"kakeibo-tanuki/internal/models"
	"kakeibo-tanuki/internal/repositories"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/go-playground/validator/v10"
)

type CardHandler struct {
	cardRepo repositories.CardRepository
	validator *validator.Validate
}

func NewCardHandler(cardRepo repositories.CardRepository) *CardHandler {
	return &CardHandler{
		cardRepo:  cardRepo,
		validator: validator.New(),
	}
}

func (h *CardHandler) GetCards(c *gin.Context) {
	cards, err := h.cardRepo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to retrieve cards",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	c.JSON(http.StatusOK, models.NewSuccessResponse("Cards retrieved successfully", cards))
}

func (h *CardHandler) GetCard(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"INVALID_UUID",
			"Invalid card ID format",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	card, err := h.cardRepo.GetByID(id)
	if err != nil {
		if err.Error() == "record not found" {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(
				"CARD_NOT_FOUND",
				"Card not found",
				nil,
				c.Request.URL.Path,
			))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to retrieve card",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	c.JSON(http.StatusOK, models.NewSuccessResponse("Card retrieved successfully", card))
}

func (h *CardHandler) CreateCard(c *gin.Context) {
	var req models.CreateCardRequest
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

	card := &models.Card{
		ID:    uuid.New(),
		Name:  req.Name,
		Color: req.Color,
	}

	if err := h.cardRepo.Create(card); err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to create card",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	c.JSON(http.StatusCreated, models.NewSuccessResponse("Card created successfully", card))
}

func (h *CardHandler) UpdateCard(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"INVALID_UUID",
			"Invalid card ID format",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	// Check if card exists
	card, err := h.cardRepo.GetByID(id)
	if err != nil {
		if err.Error() == "record not found" {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(
				"CARD_NOT_FOUND",
				"Card not found",
				nil,
				c.Request.URL.Path,
			))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to retrieve card",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	var req models.UpdateCardRequest
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

	card.Name = req.Name
	card.Color = req.Color

	if err := h.cardRepo.Update(card); err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to update card",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	c.JSON(http.StatusOK, models.NewSuccessResponse("Card updated successfully", card))
}

func (h *CardHandler) DeleteCard(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"INVALID_UUID",
			"Invalid card ID format",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	// Check if card exists
	_, err = h.cardRepo.GetByID(id)
	if err != nil {
		if err.Error() == "record not found" {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(
				"CARD_NOT_FOUND",
				"Card not found",
				nil,
				c.Request.URL.Path,
			))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to retrieve card",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	// Check if card has expenses
	hasExpenses, err := h.cardRepo.HasExpenses(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to check card dependencies",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	if hasExpenses {
		c.JSON(http.StatusConflict, models.NewErrorResponse(
			"CARD_HAS_EXPENSES",
			"Cannot delete card with associated expenses",
			"This card has expenses associated with it. Please delete the expenses first or reassign them to another card.",
			c.Request.URL.Path,
		))
		return
	}

	if err := h.cardRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to delete card",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	c.JSON(http.StatusOK, models.NewSuccessResponse("Card deleted successfully", nil))
}