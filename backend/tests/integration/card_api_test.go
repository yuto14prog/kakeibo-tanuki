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

func TestCardAPI_GetCards(t *testing.T) {
	server := SetupTestServer(t)
	defer server.CleanupTestServer()

	t.Run("empty cards list", func(t *testing.T) {
		w := server.MakeRequest("GET", "/api/cards", nil)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Cards retrieved successfully", response.Message)

		// Check that data is an empty array
		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var cards []models.Card
		err = json.Unmarshal(dataBytes, &cards)
		require.NoError(t, err)
		assert.Empty(t, cards)
	})

	t.Run("cards list with data", func(t *testing.T) {
		// Create test cards
		card1 := server.CreateTestCard(t, "テストカード1", "#FF0000")
		card2 := server.CreateTestCard(t, "テストカード2", "#00FF00")

		w := server.MakeRequest("GET", "/api/cards", nil)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var cards []models.Card
		err = json.Unmarshal(dataBytes, &cards)
		require.NoError(t, err)

		assert.Len(t, cards, 2)

		// Check cards are returned in creation order (newest first)
		assert.Equal(t, card2.Name, cards[0].Name)
		assert.Equal(t, card1.Name, cards[1].Name)
	})
}

func TestCardAPI_CreateCard(t *testing.T) {
	server := SetupTestServer(t)
	defer server.CleanupTestServer()

	t.Run("valid card creation", func(t *testing.T) {
		requestBody := models.CreateCardRequest{
			Name:  "新しいカード",
			Color: "#3B82F6",
		}

		w := server.MakeRequest("POST", "/api/cards", requestBody)

		assert.Equal(t, http.StatusCreated, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Card created successfully", response.Message)

		// Check created card data
		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var card models.Card
		err = json.Unmarshal(dataBytes, &card)
		require.NoError(t, err)

		assert.Equal(t, requestBody.Name, card.Name)
		assert.Equal(t, requestBody.Color, card.Color)
		assert.NotEqual(t, uuid.Nil, card.ID)
		assert.NotZero(t, card.CreatedAt)
		assert.NotZero(t, card.UpdatedAt)
	})

	t.Run("invalid card creation - empty name", func(t *testing.T) {
		requestBody := models.CreateCardRequest{
			Name:  "",
			Color: "#3B82F6",
		}

		w := server.MakeRequest("POST", "/api/cards", requestBody)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "VALIDATION_ERROR", response.Error.Code)
		assert.Contains(t, response.Error.Message, "Validation failed")
	})

	t.Run("invalid card creation - invalid color", func(t *testing.T) {
		requestBody := models.CreateCardRequest{
			Name:  "テストカード",
			Color: "invalid-color",
		}

		w := server.MakeRequest("POST", "/api/cards", requestBody)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "VALIDATION_ERROR", response.Error.Code)
		assert.Contains(t, response.Error.Message, "Validation failed")
	})

	t.Run("invalid request body", func(t *testing.T) {
		w := server.MakeRequest("POST", "/api/cards", "invalid json")

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "INVALID_REQUEST", response.Error.Code)
	})
}

func TestCardAPI_GetCard(t *testing.T) {
	server := SetupTestServer(t)
	defer server.CleanupTestServer()

	t.Run("get existing card", func(t *testing.T) {
		card := server.CreateTestCard(t, "テストカード", "#FF5733")

		w := server.MakeRequest("GET", fmt.Sprintf("/api/cards/%s", card.ID), nil)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var retrievedCard models.Card
		err = json.Unmarshal(dataBytes, &retrievedCard)
		require.NoError(t, err)

		assert.Equal(t, card.ID, retrievedCard.ID)
		assert.Equal(t, card.Name, retrievedCard.Name)
		assert.Equal(t, card.Color, retrievedCard.Color)
	})

	t.Run("get non-existent card", func(t *testing.T) {
		nonExistentID := uuid.New()

		w := server.MakeRequest("GET", fmt.Sprintf("/api/cards/%s", nonExistentID), nil)

		assert.Equal(t, http.StatusNotFound, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "CARD_NOT_FOUND", response.Error.Code)
		assert.Equal(t, "Card not found", response.Error.Message)
	})

	t.Run("invalid card ID format", func(t *testing.T) {
		w := server.MakeRequest("GET", "/api/cards/invalid-uuid", nil)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "INVALID_UUID", response.Error.Code)
	})
}

func TestCardAPI_UpdateCard(t *testing.T) {
	server := SetupTestServer(t)
	defer server.CleanupTestServer()

	t.Run("valid card update", func(t *testing.T) {
		card := server.CreateTestCard(t, "元のカード", "#FF0000")

		updateRequest := models.UpdateCardRequest{
			Name:  "更新されたカード",
			Color: "#00FF00",
		}

		w := server.MakeRequest("PUT", fmt.Sprintf("/api/cards/%s", card.ID), updateRequest)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		dataBytes, err := json.Marshal(response.Data)
		require.NoError(t, err)
		var updatedCard models.Card
		err = json.Unmarshal(dataBytes, &updatedCard)
		require.NoError(t, err)

		assert.Equal(t, card.ID, updatedCard.ID)
		assert.Equal(t, updateRequest.Name, updatedCard.Name)
		assert.Equal(t, updateRequest.Color, updatedCard.Color)
		assert.True(t, updatedCard.UpdatedAt.After(card.UpdatedAt))
	})

	t.Run("update non-existent card", func(t *testing.T) {
		nonExistentID := uuid.New()

		updateRequest := models.UpdateCardRequest{
			Name:  "更新されたカード",
			Color: "#00FF00",
		}

		w := server.MakeRequest("PUT", fmt.Sprintf("/api/cards/%s", nonExistentID), updateRequest)

		assert.Equal(t, http.StatusNotFound, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "CARD_NOT_FOUND", response.Error.Code)
	})

	t.Run("invalid update data", func(t *testing.T) {
		card := server.CreateTestCard(t, "テストカード", "#FF0000")

		updateRequest := models.UpdateCardRequest{
			Name:  "", // Invalid empty name
			Color: "#00FF00",
		}

		w := server.MakeRequest("PUT", fmt.Sprintf("/api/cards/%s", card.ID), updateRequest)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "VALIDATION_ERROR", response.Error.Code)
	})
}

func TestCardAPI_DeleteCard(t *testing.T) {
	server := SetupTestServer(t)
	defer server.CleanupTestServer()

	t.Run("delete card without expenses", func(t *testing.T) {
		card := server.CreateTestCard(t, "削除予定カード", "#FF0000")

		w := server.MakeRequest("DELETE", fmt.Sprintf("/api/cards/%s", card.ID), nil)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.SuccessResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "Card deleted successfully", response.Message)

		// Verify card is deleted
		w = server.MakeRequest("GET", fmt.Sprintf("/api/cards/%s", card.ID), nil)
		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("delete card with expenses", func(t *testing.T) {
		card := server.CreateTestCard(t, "使用中カード", "#FF0000")
		category := server.CreateTestCategory(t, "テストカテゴリ", "#00FF00", false)
		
		// Create expense using the card
		server.CreateTestExpense(t, 1000.0, "テスト支出", card.ID, category.ID)

		w := server.MakeRequest("DELETE", fmt.Sprintf("/api/cards/%s", card.ID), nil)

		assert.Equal(t, http.StatusConflict, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "CARD_HAS_EXPENSES", response.Error.Code)
		assert.Contains(t, response.Error.Message, "Cannot delete card with associated expenses")
	})

	t.Run("delete non-existent card", func(t *testing.T) {
		nonExistentID := uuid.New()

		w := server.MakeRequest("DELETE", fmt.Sprintf("/api/cards/%s", nonExistentID), nil)

		assert.Equal(t, http.StatusNotFound, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "CARD_NOT_FOUND", response.Error.Code)
	})

	t.Run("invalid card ID format", func(t *testing.T) {
		w := server.MakeRequest("DELETE", "/api/cards/invalid-uuid", nil)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		assert.Equal(t, "INVALID_UUID", response.Error.Code)
	})
}