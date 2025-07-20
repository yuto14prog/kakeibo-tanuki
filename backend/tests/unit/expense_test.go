package unit

import (
	"testing"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	
	"kakeibo-tanuki/internal/models"
)

func TestExpenseValidation(t *testing.T) {
	validate := validator.New()
	cardID := uuid.New()
	categoryID := uuid.New()

	tests := []struct {
		name       string
		expense    models.Expense
		wantValid  bool
		wantErrors []string
	}{
		{
			name: "Valid expense",
			expense: models.Expense{
				Amount:      1000.50,
				Date:        time.Now(),
				Description: "Test expense",
				CardID:      cardID,
				CategoryID:  categoryID,
				Card:        models.Card{Name: "Test models.Card", Color: "#3B82F6"},
				Category:    models.Category{Name: "Test models.Category", Color: "#10B981"},
			},
			wantValid: true,
		},
		{
			name: "Valid expense without description",
			expense: models.Expense{
				Amount:     500.0,
				Date:       time.Now(),
				CardID:     cardID,
				CategoryID: categoryID,
				Card:       models.Card{Name: "Test models.Card", Color: "#3B82F6"},
				Category:   models.Category{Name: "Test models.Category", Color: "#10B981"},
			},
			wantValid: true,
		},
		{
			name: "Zero amount",
			expense: models.Expense{
				Amount:      0,
				Date:        time.Now(),
				Description: "Test expense",
				CardID:      cardID,
				CategoryID:  categoryID,
			},
			wantValid:  false,
			wantErrors: []string{"Amount"},
		},
		{
			name: "Negative amount",
			expense: models.Expense{
				Amount:      -100.0,
				Date:        time.Now(),
				Description: "Test expense",
				CardID:      cardID,
				CategoryID:  categoryID,
			},
			wantValid:  false,
			wantErrors: []string{"Amount"},
		},
		{
			name: "Missing card ID",
			expense: models.Expense{
				Amount:      1000.0,
				Date:        time.Now(),
				Description: "Test expense",
				CategoryID:  categoryID,
			},
			wantValid:  false,
			wantErrors: []string{"CardID"},
		},
		{
			name: "Missing category ID",
			expense: models.Expense{
				Amount:      1000.0,
				Date:        time.Now(),
				Description: "Test expense",
				CardID:      cardID,
			},
			wantValid:  false,
			wantErrors: []string{"CategoryID"},
		},
		{
			name: "Missing date",
			expense: models.Expense{
				Amount:      1000.0,
				Description: "Test expense",
				CardID:      cardID,
				CategoryID:  categoryID,
			},
			wantValid:  false,
			wantErrors: []string{"Date"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validate.Struct(tt.expense)
			
			if tt.wantValid {
				assert.NoError(t, err, "Expected expense to be valid")
			} else {
				assert.Error(t, err, "Expected expense to be invalid")
				
				if err != nil {
					validationErrs := err.(validator.ValidationErrors)
					fieldNames := make([]string, len(validationErrs))
					for i, fieldErr := range validationErrs {
						fieldNames[i] = fieldErr.Field()
					}
					
					for _, expectedField := range tt.wantErrors {
						assert.Contains(t, fieldNames, expectedField, "Expected validation error for field: %s", expectedField)
					}
				}
			}
		})
	}
}

func TestCreateExpenseRequestValidation(t *testing.T) {
	validate := validator.New()
	cardIDStr := uuid.New().String()
	categoryIDStr := uuid.New().String()

	tests := []struct {
		name       string
		request    models.CreateExpenseRequest
		wantValid  bool
		wantErrors []string
	}{
		{
			name: "Valid create request",
			request: models.CreateExpenseRequest{
				Amount:      1500.75,
				Date:        "2025-01-15T10:30:00Z",
				Description: "新しい支出",
				CardID:      cardIDStr,
				CategoryID:  categoryIDStr,
			},
			wantValid: true,
		},
		{
			name: "Valid request without description",
			request: models.CreateExpenseRequest{
				Amount:     750.0,
				Date:       "2025-01-15T10:30:00Z",
				CardID:     cardIDStr,
				CategoryID: categoryIDStr,
			},
			wantValid: true,
		},
		{
			name: "Zero amount",
			request: models.CreateExpenseRequest{
				Amount:      0,
				Date:        "2025-01-15T10:30:00Z",
				Description: "Invalid expense",
				CardID:      cardIDStr,
				CategoryID:  categoryIDStr,
			},
			wantValid:  false,
			wantErrors: []string{"Amount"},
		},
		{
			name: "Negative amount",
			request: models.CreateExpenseRequest{
				Amount:      -500.0,
				Date:        "2025-01-15T10:30:00Z",
				Description: "Invalid expense",
				CardID:      cardIDStr,
				CategoryID:  categoryIDStr,
			},
			wantValid:  false,
			wantErrors: []string{"Amount"},
		},
		{
			name: "Empty date",
			request: models.CreateExpenseRequest{
				Amount:      1000.0,
				Date:        "",
				Description: "Invalid expense",
				CardID:      cardIDStr,
				CategoryID:  categoryIDStr,
			},
			wantValid:  false,
			wantErrors: []string{"Date"},
		},
		{
			name: "Empty card ID",
			request: models.CreateExpenseRequest{
				Amount:      1000.0,
				Date:        "2025-01-15T10:30:00Z",
				Description: "Invalid expense",
				CardID:      "",
				CategoryID:  categoryIDStr,
			},
			wantValid:  false,
			wantErrors: []string{"CardID"},
		},
		{
			name: "Empty category ID",
			request: models.CreateExpenseRequest{
				Amount:      1000.0,
				Date:        "2025-01-15T10:30:00Z",
				Description: "Invalid expense",
				CardID:      cardIDStr,
				CategoryID:  "",
			},
			wantValid:  false,
			wantErrors: []string{"CategoryID"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validate.Struct(tt.request)
			
			if tt.wantValid {
				assert.NoError(t, err)
			} else {
				assert.Error(t, err)
				
				if err != nil {
					validationErrs := err.(validator.ValidationErrors)
					fieldNames := make([]string, len(validationErrs))
					for i, fieldErr := range validationErrs {
						fieldNames[i] = fieldErr.Field()
					}
					
					for _, expectedField := range tt.wantErrors {
						assert.Contains(t, fieldNames, expectedField)
					}
				}
			}
		})
	}
}

func TestUpdateExpenseRequestValidation(t *testing.T) {
	validate := validator.New()
	cardIDStr := uuid.New().String()
	categoryIDStr := uuid.New().String()

	tests := []struct {
		name       string
		request    models.UpdateExpenseRequest
		wantValid  bool
		wantErrors []string
	}{
		{
			name: "Valid update request",
			request: models.UpdateExpenseRequest{
				Amount:      2000.25,
				Date:        "2025-01-16T15:45:00Z",
				Description: "更新された支出",
				CardID:      cardIDStr,
				CategoryID:  categoryIDStr,
			},
			wantValid: true,
		},
		{
			name: "Valid update without description",
			request: models.UpdateExpenseRequest{
				Amount:     1250.0,
				Date:       "2025-01-16T15:45:00Z",
				CardID:     cardIDStr,
				CategoryID: categoryIDStr,
			},
			wantValid: true,
		},
		{
			name: "Zero amount",
			request: models.UpdateExpenseRequest{
				Amount:      0,
				Date:        "2025-01-16T15:45:00Z",
				Description: "Invalid update",
				CardID:      cardIDStr,
				CategoryID:  categoryIDStr,
			},
			wantValid:  false,
			wantErrors: []string{"Amount"},
		},
		{
			name: "Empty date",
			request: models.UpdateExpenseRequest{
				Amount:      1500.0,
				Date:        "",
				Description: "Invalid update",
				CardID:      cardIDStr,
				CategoryID:  categoryIDStr,
			},
			wantValid:  false,
			wantErrors: []string{"Date"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validate.Struct(tt.request)
			
			if tt.wantValid {
				assert.NoError(t, err)
			} else {
				assert.Error(t, err)
				
				if err != nil {
					validationErrs := err.(validator.ValidationErrors)
					fieldNames := make([]string, len(validationErrs))
					for i, fieldErr := range validationErrs {
						fieldNames[i] = fieldErr.Field()
					}
					
					for _, expectedField := range tt.wantErrors {
						assert.Contains(t, fieldNames, expectedField)
					}
				}
			}
		})
	}
}