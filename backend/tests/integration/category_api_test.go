package integration

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"kakeibo-tanuki/internal/models"
)

func TestCategoryAPI_GetCategories(t *testing.T) {
	server := SetupTestServer(t)
	defer server.CleanupTestServer()

	t.Run("empty categories list", func(t *testing.T) {
		w := server.MakeRequest("GET", "/api/categories", nil)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Categories retrieved successfully", response.Message)

		// Check that data is an empty array
		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var categories []models.Category
		err = json.Unmarshal(dataBytes, &categories)
		require.NoError(t, err)
		assert.Empty(t, categories)
	})

	t.Run("categories list with data", func(t *testing.T) {
		// Create test categories
		cat1 := server.CreateTestCategory(t, "食費", "#10B981", false)
		cat2 := server.CreateTestCategory(t, "家賃", "#EF4444", true)

		w := server.MakeRequest("GET", "/api/categories", nil)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var categories []models.Category
		err = json.Unmarshal(dataBytes, &categories)
		require.NoError(t, err)

		assert.Len(t, categories, 2)

		// Check categories are returned in creation order (newest first)
		assert.Equal(t, cat2.Name, categories[0].Name)
		assert.True(t, categories[0].IsShared)
		assert.Equal(t, cat1.Name, categories[1].Name)
		assert.False(t, categories[1].IsShared)
	})
}

func TestCategoryAPI_CreateCategory(t *testing.T) {
	server := SetupTestServer(t)
	defer server.CleanupTestServer()

	t.Run("valid category creation", func(t *testing.T) {
		requestBody := models.CreateCategoryRequest{
			Name:     "新しいカテゴリ",
			Color:    "#8B5CF6",
			IsShared: false,
		}

		w := server.MakeRequest("POST", "/api/categories", requestBody)

		assert.Equal(t, http.StatusCreated, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Category created successfully", response.Message)

		// Check created category data
		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var category models.Category
		err = json.Unmarshal(dataBytes, &category)
		require.NoError(t, err)

		assert.Equal(t, requestBody.Name, category.Name)
		assert.Equal(t, requestBody.Color, category.Color)
		assert.Equal(t, requestBody.IsShared, category.IsShared)
		assert.NotEqual(t, uuid.Nil, category.ID)
		assert.NotZero(t, category.CreatedAt)
		assert.NotZero(t, category.UpdatedAt)
	})

	t.Run("valid shared category creation", func(t *testing.T) {
		requestBody := models.CreateCategoryRequest{
			Name:     "共通カテゴリ",
			Color:    "#F59E0B",
			IsShared: true,
		}

		w := server.MakeRequest("POST", "/api/categories", requestBody)

		assert.Equal(t, http.StatusCreated, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var category models.Category
		err = json.Unmarshal(dataBytes, &category)
		require.NoError(t, err)

		assert.Equal(t, requestBody.Name, category.Name)
		assert.True(t, category.IsShared)
	})

	t.Run("invalid category creation - empty name", func(t *testing.T) {
		requestBody := models.CreateCategoryRequest{
			Name:     "",
			Color:    "#8B5CF6",
			IsShared: false,
		}

		w := server.MakeRequest("POST", "/api/categories", requestBody)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "VALIDATION_ERROR", response.Error.Code)
		assert.Contains(t, response.Error.Message, "Validation failed")
	})

	t.Run("invalid category creation - invalid color", func(t *testing.T) {
		requestBody := models.CreateCategoryRequest{
			Name:     "テストカテゴリ",
			Color:    "invalid-color",
			IsShared: false,
		}

		w := server.MakeRequest("POST", "/api/categories", requestBody)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "VALIDATION_ERROR", response.Error.Code)
		assert.Contains(t, response.Error.Message, "Validation failed")
	})

	t.Run("duplicate category name", func(t *testing.T) {
		// Create first category
		server.CreateTestCategory(t, "重複カテゴリ", "#10B981", false)

		// Try to create another with same name
		requestBody := models.CreateCategoryRequest{
			Name:     "重複カテゴリ",
			Color:    "#EF4444",
			IsShared: true,
		}

		w := server.MakeRequest("POST", "/api/categories", requestBody)

		assert.Equal(t, http.StatusConflict, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "DUPLICATE_CATEGORY", response.Error.Code)
		assert.Contains(t, response.Error.Message, "already exists")
	})
}

func TestCategoryAPI_GetCategory(t *testing.T) {
	server := SetupTestServer(t)
	defer server.CleanupTestServer()

	t.Run("get existing category", func(t *testing.T) {
		category := server.CreateTestCategory(t, "テストカテゴリ", "#10B981", true)

		w := server.MakeRequest("GET", fmt.Sprintf("/api/categories/%s", category.ID), nil)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var retrievedCategory models.Category
		err = json.Unmarshal(dataBytes, &retrievedCategory)
		require.NoError(t, err)

		assert.Equal(t, category.ID, retrievedCategory.ID)
		assert.Equal(t, category.Name, retrievedCategory.Name)
		assert.Equal(t, category.Color, retrievedCategory.Color)
		assert.Equal(t, category.IsShared, retrievedCategory.IsShared)
	})

	t.Run("get non-existent category", func(t *testing.T) {
		nonExistentID := uuid.New()

		w := server.MakeRequest("GET", fmt.Sprintf("/api/categories/%s", nonExistentID), nil)

		assert.Equal(t, http.StatusNotFound, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "CATEGORY_NOT_FOUND", response.Error.Code)
		assert.Equal(t, "Category not found", response.Error.Message)
	})

	t.Run("invalid category ID format", func(t *testing.T) {
		w := server.MakeRequest("GET", "/api/categories/invalid-uuid", nil)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "INVALID_UUID", response.Error.Code)
	})
}

func TestCategoryAPI_UpdateCategory(t *testing.T) {
	server := SetupTestServer(t)
	defer server.CleanupTestServer()

	t.Run("valid category update", func(t *testing.T) {
		category := server.CreateTestCategory(t, "元のカテゴリ", "#10B981", false)

		updateRequest := models.UpdateCategoryRequest{
			Name:     "更新されたカテゴリ",
			Color:    "#EF4444",
			IsShared: true,
		}

		w := server.MakeRequest("PUT", fmt.Sprintf("/api/categories/%s", category.ID), updateRequest)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var updatedCategory models.Category
		err = json.Unmarshal(dataBytes, &updatedCategory)
		require.NoError(t, err)

		assert.Equal(t, category.ID, updatedCategory.ID)
		assert.Equal(t, updateRequest.Name, updatedCategory.Name)
		assert.Equal(t, updateRequest.Color, updatedCategory.Color)
		assert.Equal(t, updateRequest.IsShared, updatedCategory.IsShared)
		assert.True(t, updatedCategory.UpdatedAt.After(category.UpdatedAt))
	})

	t.Run("toggle shared flag", func(t *testing.T) {
		category := server.CreateTestCategory(t, "トグルテスト", "#8B5CF6", true)

		updateRequest := models.UpdateCategoryRequest{
			Name:     category.Name,
			Color:    category.Color,
			IsShared: false, // Toggle to false
		}

		w := server.MakeRequest("PUT", fmt.Sprintf("/api/categories/%s", category.ID), updateRequest)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var updatedCategory models.Category
		err = json.Unmarshal(dataBytes, &updatedCategory)
		require.NoError(t, err)

		assert.False(t, updatedCategory.IsShared)
	})

	t.Run("update non-existent category", func(t *testing.T) {
		nonExistentID := uuid.New()

		updateRequest := models.UpdateCategoryRequest{
			Name:     "更新されたカテゴリ",
			Color:    "#EF4444",
			IsShared: false,
		}

		w := server.MakeRequest("PUT", fmt.Sprintf("/api/categories/%s", nonExistentID), updateRequest)

		assert.Equal(t, http.StatusNotFound, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "CATEGORY_NOT_FOUND", response.Error.Code)
	})

	t.Run("invalid update data", func(t *testing.T) {
		category := server.CreateTestCategory(t, "テストカテゴリ", "#10B981", false)

		updateRequest := models.UpdateCategoryRequest{
			Name:     "", // Invalid empty name
			Color:    "#EF4444",
			IsShared: false,
		}

		w := server.MakeRequest("PUT", fmt.Sprintf("/api/categories/%s", category.ID), updateRequest)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "VALIDATION_ERROR", response.Error.Code)
	})
}

func TestCategoryAPI_DeleteCategory(t *testing.T) {
	server := SetupTestServer(t)
	defer server.CleanupTestServer()

	t.Run("delete category without expenses", func(t *testing.T) {
		category := server.CreateTestCategory(t, "削除予定カテゴリ", "#10B981", false)

		w := server.MakeRequest("DELETE", fmt.Sprintf("/api/categories/%s", category.ID), nil)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Category deleted successfully", response.Message)

		// Verify category is deleted
		w = server.MakeRequest("GET", fmt.Sprintf("/api/categories/%s", category.ID), nil)
		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("delete category with expenses", func(t *testing.T) {
		card := server.CreateTestCard(t, "テストカード", "#3B82F6")
		category := server.CreateTestCategory(t, "使用中カテゴリ", "#10B981", false)
		
		// Create expense using the category
		server.CreateTestExpense(t, 1000.0, "テスト支出", card.ID, category.ID)

		w := server.MakeRequest("DELETE", fmt.Sprintf("/api/categories/%s", category.ID), nil)

		assert.Equal(t, http.StatusConflict, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "CATEGORY_HAS_EXPENSES", response.Error.Code)
		assert.Contains(t, response.Error.Message, "Cannot delete category with associated expenses")
	})

	t.Run("delete non-existent category", func(t *testing.T) {
		nonExistentID := uuid.New()

		w := server.MakeRequest("DELETE", fmt.Sprintf("/api/categories/%s", nonExistentID), nil)

		assert.Equal(t, http.StatusNotFound, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "CATEGORY_NOT_FOUND", response.Error.Code)
	})

	t.Run("invalid category ID format", func(t *testing.T) {
		w := server.MakeRequest("DELETE", "/api/categories/invalid-uuid", nil)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "INVALID_UUID", response.Error.Code)
	})
}