package handlers

import (
	"net/http"
	"kakeibo-tanuki/internal/models"
	"kakeibo-tanuki/internal/repositories"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/go-playground/validator/v10"
)

type CategoryHandler struct {
	categoryRepo repositories.CategoryRepository
	validator    *validator.Validate
}

func NewCategoryHandler(categoryRepo repositories.CategoryRepository) *CategoryHandler {
	return &CategoryHandler{
		categoryRepo: categoryRepo,
		validator:    validator.New(),
	}
}

func (h *CategoryHandler) GetCategories(c *gin.Context) {
	categories, err := h.categoryRepo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to retrieve categories",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	c.JSON(http.StatusOK, models.NewSuccessResponse("Categories retrieved successfully", categories))
}

func (h *CategoryHandler) GetCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"INVALID_UUID",
			"Invalid category ID format",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	category, err := h.categoryRepo.GetByID(id)
	if err != nil {
		if err.Error() == "record not found" {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(
				"CATEGORY_NOT_FOUND",
				"Category not found",
				nil,
				c.Request.URL.Path,
			))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to retrieve category",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	c.JSON(http.StatusOK, models.NewSuccessResponse("Category retrieved successfully", category))
}

func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var req models.CreateCategoryRequest
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

	category := &models.Category{
		ID:    uuid.New(),
		Name:  req.Name,
		Color: req.Color,
	}

	if err := h.categoryRepo.Create(category); err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to create category",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	c.JSON(http.StatusCreated, models.NewSuccessResponse("Category created successfully", category))
}

func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"INVALID_UUID",
			"Invalid category ID format",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	// Check if category exists
	category, err := h.categoryRepo.GetByID(id)
	if err != nil {
		if err.Error() == "record not found" {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(
				"CATEGORY_NOT_FOUND",
				"Category not found",
				nil,
				c.Request.URL.Path,
			))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to retrieve category",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	var req models.UpdateCategoryRequest
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

	category.Name = req.Name
	category.Color = req.Color

	if err := h.categoryRepo.Update(category); err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to update category",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	c.JSON(http.StatusOK, models.NewSuccessResponse("Category updated successfully", category))
}

func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(
			"INVALID_UUID",
			"Invalid category ID format",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	// Check if category exists
	_, err = h.categoryRepo.GetByID(id)
	if err != nil {
		if err.Error() == "record not found" {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(
				"CATEGORY_NOT_FOUND",
				"Category not found",
				nil,
				c.Request.URL.Path,
			))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to retrieve category",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	// Check if category has expenses
	hasExpenses, err := h.categoryRepo.HasExpenses(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to check category dependencies",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	if hasExpenses {
		c.JSON(http.StatusConflict, models.NewErrorResponse(
			"CATEGORY_HAS_EXPENSES",
			"Cannot delete category with associated expenses",
			"This category has expenses associated with it. Please delete the expenses first or reassign them to another category.",
			c.Request.URL.Path,
		))
		return
	}

	if err := h.categoryRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(
			"INTERNAL_ERROR",
			"Failed to delete category",
			err.Error(),
			c.Request.URL.Path,
		))
		return
	}

	c.JSON(http.StatusOK, models.NewSuccessResponse("Category deleted successfully", nil))
}