package integration

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"kakeibo-tanuki/internal/models"
)

func TestExpenseAPI_GetExpenses(t *testing.T) {
	server := SetupTestServer(t)
	defer server.CleanupTestServer()

	t.Run("empty expenses list", func(t *testing.T) {
		w := server.MakeRequest("GET", "/api/expenses", nil)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.PaginatedResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Check that data is an empty array
		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var expenses []models.Expense
		err = json.Unmarshal(dataBytes, &expenses)
		require.NoError(t, err)
		assert.Empty(t, expenses)

		// Check pagination info
		assert.Equal(t, 1, response.Pagination.Page)
		assert.Equal(t, 20, response.Pagination.Limit)
		assert.Equal(t, 0, response.Pagination.TotalPages)
		assert.Equal(t, 0, response.Pagination.TotalItems)
	})

	t.Run("expenses list with data", func(t *testing.T) {
		// Create test data
		card := server.CreateTestCard(t, "テストカード", "#3B82F6")
		category := server.CreateTestCategory(t, "食費", "#10B981", false)
		
		// Create test expenses
		exp1 := server.CreateTestExpense(t, 1500.0, "ランチ", card.ID, category.ID)
		exp2 := server.CreateTestExpense(t, 800.0, "コーヒー", card.ID, category.ID)

		w := server.MakeRequest("GET", "/api/expenses", nil)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.PaginatedResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var expenses []models.Expense
		err = json.Unmarshal(dataBytes, &expenses)
		require.NoError(t, err)

		assert.Len(t, expenses, 2)

		// Verify both expenses are present (order may vary due to same date)
		descriptions := []string{expenses[0].Description, expenses[1].Description}
		assert.Contains(t, descriptions, exp1.Description)
		assert.Contains(t, descriptions, exp2.Description)
	})
}

func TestExpenseAPI_CreateExpense(t *testing.T) {
	server := SetupTestServer(t)
	defer server.CleanupTestServer()

	// Create required test data
	card := server.CreateTestCard(t, "テストカード", "#3B82F6")
	category := server.CreateTestCategory(t, "食費", "#10B981", false)

	t.Run("valid expense creation", func(t *testing.T) {
		pastDate := time.Now().Add(-24 * time.Hour)
		requestBody := models.CreateExpenseRequest{
			Amount:      2500.0,
			Date:        pastDate.Format(time.RFC3339),
			Description: "ディナー",
			CardID:      card.ID.String(),
			CategoryID:  category.ID.String(),
		}

		w := server.MakeRequest("POST", "/api/expenses", requestBody)

		assert.Equal(t, http.StatusCreated, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Expense created successfully", response.Message)

		// Check created expense data
		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var expense models.Expense
		err = json.Unmarshal(dataBytes, &expense)
		require.NoError(t, err)

		assert.Equal(t, requestBody.Amount, expense.Amount)
		assert.Equal(t, requestBody.Description, expense.Description)
		assert.Equal(t, requestBody.CardID, expense.CardID.String())
		assert.Equal(t, requestBody.CategoryID, expense.CategoryID.String())
		assert.NotEqual(t, uuid.Nil, expense.ID)
		assert.NotZero(t, expense.CreatedAt)
		assert.NotZero(t, expense.UpdatedAt)
	})

	t.Run("invalid expense creation - negative amount", func(t *testing.T) {
		pastDate := time.Now().Add(-24 * time.Hour)
		requestBody := models.CreateExpenseRequest{
			Amount:      -100.0,
			Date:        pastDate.Format(time.RFC3339),
			Description: "無効な支出",
			CardID:      card.ID.String(),
			CategoryID:  category.ID.String(),
		}

		w := server.MakeRequest("POST", "/api/expenses", requestBody)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "VALIDATION_ERROR", response.Error.Code)
		assert.Contains(t, response.Error.Message, "Validation failed")
	})

	t.Run("invalid expense creation - future date", func(t *testing.T) {
		futureDate := time.Now().Add(24 * time.Hour)
		requestBody := models.CreateExpenseRequest{
			Amount:      1000.0,
			Date:        futureDate.Format(time.RFC3339),
			Description: "未来の支出",
			CardID:      card.ID.String(),
			CategoryID:  category.ID.String(),
		}

		w := server.MakeRequest("POST", "/api/expenses", requestBody)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "FUTURE_DATE", response.Error.Code)
		assert.Contains(t, response.Error.Message, "cannot be in the future")
	})

	t.Run("invalid expense creation - invalid card ID format", func(t *testing.T) {
		pastDate := time.Now().Add(-24 * time.Hour)
		requestBody := models.CreateExpenseRequest{
			Amount:      1000.0,
			Date:        pastDate.Format(time.RFC3339),
			Description: "テスト支出",
			CardID:      "invalid-uuid",
			CategoryID:  category.ID.String(),
		}

		w := server.MakeRequest("POST", "/api/expenses", requestBody)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "INVALID_CARD_ID", response.Error.Code)
		assert.Contains(t, response.Error.Message, "Invalid card ID format")
	})

	t.Run("invalid expense creation - invalid category ID format", func(t *testing.T) {
		pastDate := time.Now().Add(-24 * time.Hour)
		requestBody := models.CreateExpenseRequest{
			Amount:      1000.0,
			Date:        pastDate.Format(time.RFC3339),
			Description: "テスト支出",
			CardID:      card.ID.String(),
			CategoryID:  "invalid-uuid",
		}

		w := server.MakeRequest("POST", "/api/expenses", requestBody)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "INVALID_CATEGORY_ID", response.Error.Code)
		assert.Contains(t, response.Error.Message, "Invalid category ID format")
	})

	t.Run("invalid request body", func(t *testing.T) {
		w := server.MakeRequest("POST", "/api/expenses", "invalid json")

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "INVALID_REQUEST", response.Error.Code)
	})
}

func TestExpenseAPI_GetExpense(t *testing.T) {
	server := SetupTestServer(t)
	defer server.CleanupTestServer()

	// Create required test data
	card := server.CreateTestCard(t, "テストカード", "#3B82F6")
	category := server.CreateTestCategory(t, "食費", "#10B981", false)

	t.Run("get existing expense", func(t *testing.T) {
		expense := server.CreateTestExpense(t, 1200.0, "テスト支出", card.ID, category.ID)

		w := server.MakeRequest("GET", fmt.Sprintf("/api/expenses/%s", expense.ID), nil)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var retrievedExpense models.Expense
		err = json.Unmarshal(dataBytes, &retrievedExpense)
		require.NoError(t, err)

		assert.Equal(t, expense.ID, retrievedExpense.ID)
		assert.Equal(t, expense.Amount, retrievedExpense.Amount)
		assert.Equal(t, expense.Description, retrievedExpense.Description)
		assert.Equal(t, expense.CardID, retrievedExpense.CardID)
		assert.Equal(t, expense.CategoryID, retrievedExpense.CategoryID)
	})

	t.Run("get non-existent expense", func(t *testing.T) {
		nonExistentID := uuid.New()

		w := server.MakeRequest("GET", fmt.Sprintf("/api/expenses/%s", nonExistentID), nil)

		assert.Equal(t, http.StatusNotFound, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "EXPENSE_NOT_FOUND", response.Error.Code)
		assert.Equal(t, "Expense not found", response.Error.Message)
	})

	t.Run("invalid expense ID format", func(t *testing.T) {
		w := server.MakeRequest("GET", "/api/expenses/invalid-uuid", nil)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "INVALID_UUID", response.Error.Code)
	})
}

func TestExpenseAPI_UpdateExpense(t *testing.T) {
	t.Run("valid expense update", func(t *testing.T) {
		server := SetupTestServer(t)
		defer server.CleanupTestServer()
		// Create required test data within the test case
		card1 := server.CreateTestCard(t, "カード1", "#3B82F6")
		card2 := server.CreateTestCard(t, "カード2", "#EF4444")
		category1 := server.CreateTestCategory(t, "食費", "#10B981", false)
		category2 := server.CreateTestCategory(t, "交通費", "#8B5CF6", false)
		
		expense := server.CreateTestExpense(t, 1000.0, "元の支出", card1.ID, category1.ID)

		pastDate := time.Now().Add(-12 * time.Hour)
		updateRequest := models.UpdateExpenseRequest{
			Amount:      1500.0,
			Date:        pastDate.Format(time.RFC3339),
			Description: "更新された支出",
			CardID:      card2.ID.String(),
			CategoryID:  category2.ID.String(),
		}

		w := server.MakeRequest("PUT", fmt.Sprintf("/api/expenses/%s", expense.ID), updateRequest)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var updatedExpense models.Expense
		err = json.Unmarshal(dataBytes, &updatedExpense)
		require.NoError(t, err)

		assert.Equal(t, expense.ID, updatedExpense.ID)
		assert.Equal(t, updateRequest.Amount, updatedExpense.Amount)
		assert.Equal(t, updateRequest.Description, updatedExpense.Description)
		
		// Verify the IDs have changed from the original expense
		assert.NotEqual(t, expense.CardID, updatedExpense.CardID)
		assert.NotEqual(t, expense.CategoryID, updatedExpense.CategoryID)
		
		assert.True(t, updatedExpense.UpdatedAt.After(expense.UpdatedAt))
	})

	t.Run("update non-existent expense", func(t *testing.T) {
		server := SetupTestServer(t)
		defer server.CleanupTestServer()
		// Create test data for this test case
		card1 := server.CreateTestCard(t, "カード1", "#3B82F6")
		category1 := server.CreateTestCategory(t, "食費", "#10B981", false)
		
		nonExistentID := uuid.New()

		pastDate := time.Now().Add(-24 * time.Hour)
		updateRequest := models.UpdateExpenseRequest{
			Amount:      1500.0,
			Date:        pastDate.Format(time.RFC3339),
			Description: "更新された支出",
			CardID:      card1.ID.String(),
			CategoryID:  category1.ID.String(),
		}

		w := server.MakeRequest("PUT", fmt.Sprintf("/api/expenses/%s", nonExistentID), updateRequest)

		assert.Equal(t, http.StatusNotFound, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "EXPENSE_NOT_FOUND", response.Error.Code)
	})

	t.Run("invalid update data - negative amount", func(t *testing.T) {
		server := SetupTestServer(t)
		defer server.CleanupTestServer()
		// Create test data for this test case
		card1 := server.CreateTestCard(t, "カード1", "#3B82F6")
		category1 := server.CreateTestCategory(t, "食費", "#10B981", false)
		
		expense := server.CreateTestExpense(t, 1000.0, "テスト支出", card1.ID, category1.ID)

		pastDate := time.Now().Add(-24 * time.Hour)
		updateRequest := models.UpdateExpenseRequest{
			Amount:      -100.0, // Invalid negative amount
			Date:        pastDate.Format(time.RFC3339),
			Description: "更新された支出",
			CardID:      card1.ID.String(),
			CategoryID:  category1.ID.String(),
		}

		w := server.MakeRequest("PUT", fmt.Sprintf("/api/expenses/%s", expense.ID), updateRequest)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "VALIDATION_ERROR", response.Error.Code)
	})

	t.Run("invalid update data - invalid card ID format", func(t *testing.T) {
		server := SetupTestServer(t)
		defer server.CleanupTestServer()
		// Create test data for this test case
		card1 := server.CreateTestCard(t, "カード1", "#3B82F6")
		category1 := server.CreateTestCategory(t, "食費", "#10B981", false)
		
		expense := server.CreateTestExpense(t, 1000.0, "テスト支出", card1.ID, category1.ID)

		pastDate := time.Now().Add(-24 * time.Hour)
		updateRequest := models.UpdateExpenseRequest{
			Amount:      1500.0,
			Date:        pastDate.Format(time.RFC3339),
			Description: "更新された支出",
			CardID:      "invalid-uuid",
			CategoryID:  category1.ID.String(),
		}

		w := server.MakeRequest("PUT", fmt.Sprintf("/api/expenses/%s", expense.ID), updateRequest)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "INVALID_CARD_ID", response.Error.Code)
	})
}

func TestExpenseAPI_DeleteExpense(t *testing.T) {
	server := SetupTestServer(t)
	defer server.CleanupTestServer()

	// Create required test data
	card := server.CreateTestCard(t, "テストカード", "#3B82F6")
	category := server.CreateTestCategory(t, "食費", "#10B981", false)

	t.Run("delete existing expense", func(t *testing.T) {
		expense := server.CreateTestExpense(t, 1000.0, "削除予定支出", card.ID, category.ID)

		w := server.MakeRequest("DELETE", fmt.Sprintf("/api/expenses/%s", expense.ID), nil)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Expense deleted successfully", response.Message)

		// Verify expense is deleted
		w = server.MakeRequest("GET", fmt.Sprintf("/api/expenses/%s", expense.ID), nil)
		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("delete non-existent expense", func(t *testing.T) {
		nonExistentID := uuid.New()

		w := server.MakeRequest("DELETE", fmt.Sprintf("/api/expenses/%s", nonExistentID), nil)

		assert.Equal(t, http.StatusNotFound, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "EXPENSE_NOT_FOUND", response.Error.Code)
	})

	t.Run("invalid expense ID format", func(t *testing.T) {
		w := server.MakeRequest("DELETE", "/api/expenses/invalid-uuid", nil)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "INVALID_UUID", response.Error.Code)
	})
}