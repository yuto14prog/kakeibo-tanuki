package unit

import (
	"testing"

	"github.com/go-playground/validator/v10"
	"github.com/stretchr/testify/assert"
	
	"kakeibo-tanuki/internal/models"
)

func TestCardValidation(t *testing.T) {
	validate := validator.New()

	tests := []struct {
		name       string
		card       models.Card
		wantValid  bool
		wantErrors []string
	}{
		{
			name: "Valid card",
			card: models.Card{
				Name:  "メインカード",
				Color: "#FF5733",
			},
			wantValid: true,
		},
		{
			name: "Empty name",
			card: models.Card{
				Name:  "",
				Color: "#FF5733",
			},
			wantValid:  false,
			wantErrors: []string{"Name"},
		},
		{
			name: "Name too long",
			card: models.Card{
				Name:  "１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１",
				Color: "#FF5733",
			},
			wantValid:  false,
			wantErrors: []string{"Name"},
		},
		{
			name: "Invalid color format",
			card: models.Card{
				Name:  "テストカード",
				Color: "invalid-color",
			},
			wantValid:  false,
			wantErrors: []string{"Color"},
		},
		{
			name: "Empty color",
			card: models.Card{
				Name:  "テストカード",
				Color: "",
			},
			wantValid:  false,
			wantErrors: []string{"Color"},
		},
		{
			name: "Valid short hex color",
			card: models.Card{
				Name:  "テストカード",
				Color: "#ABC",
			},
			wantValid: true,
		},
		{
			name: "Valid long hex color",
			card: models.Card{
				Name:  "テストカード",
				Color: "#ABCDEF",
			},
			wantValid: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validate.Struct(tt.card)
			
			if tt.wantValid {
				assert.NoError(t, err, "Expected card to be valid")
			} else {
				assert.Error(t, err, "Expected card to be invalid")
				
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

func TestCreateCardRequestValidation(t *testing.T) {
	validate := validator.New()

	tests := []struct {
		name       string
		request    models.CreateCardRequest
		wantValid  bool
		wantErrors []string
	}{
		{
			name: "Valid create request",
			request: models.CreateCardRequest{
				Name:  "新しいカード",
				Color: "#3B82F6",
			},
			wantValid: true,
		},
		{
			name: "Empty name",
			request: models.CreateCardRequest{
				Name:  "",
				Color: "#3B82F6",
			},
			wantValid:  false,
			wantErrors: []string{"Name"},
		},
		{
			name: "Invalid color",
			request: models.CreateCardRequest{
				Name:  "新しいカード",
				Color: "blue",
			},
			wantValid:  false,
			wantErrors: []string{"Color"},
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

func TestUpdateCardRequestValidation(t *testing.T) {
	validate := validator.New()

	tests := []struct {
		name       string
		request    models.UpdateCardRequest
		wantValid  bool
		wantErrors []string
	}{
		{
			name: "Valid update request",
			request: models.UpdateCardRequest{
				Name:  "更新されたカード",
				Color: "#EF4444",
			},
			wantValid: true,
		},
		{
			name: "Empty name",
			request: models.UpdateCardRequest{
				Name:  "",
				Color: "#EF4444",
			},
			wantValid:  false,
			wantErrors: []string{"Name"},
		},
		{
			name: "Invalid color",
			request: models.UpdateCardRequest{
				Name:  "更新されたカード",
				Color: "red",
			},
			wantValid:  false,
			wantErrors: []string{"Color"},
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