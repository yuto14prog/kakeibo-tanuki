package unit

import (
	"testing"

	"github.com/go-playground/validator/v10"
	"github.com/stretchr/testify/assert"
	
	"kakeibo-tanuki/internal/models"
)

func TestCategoryValidation(t *testing.T) {
	validate := validator.New()

	tests := []struct {
		name       string
		category   models.Category
		wantValid  bool
		wantErrors []string
	}{
		{
			name: "Valid category",
			category: models.Category{
				Name:     "食費",
				Color:    "#10B981",
				IsShared: false,
			},
			wantValid: true,
		},
		{
			name: "Valid shared category",
			category: models.Category{
				Name:     "家賃",
				Color:    "#EF4444",
				IsShared: true,
			},
			wantValid: true,
		},
		{
			name: "Empty name",
			category: models.Category{
				Name:     "",
				Color:    "#10B981",
				IsShared: false,
			},
			wantValid:  false,
			wantErrors: []string{"Name"},
		},
		{
			name: "Name too long",
			category: models.Category{
				Name:     "これは非常に長いカテゴリ名です。５０文字を超える長さのカテゴリ名は許可されません。この文字列は制限を超えています。",
				Color:    "#10B981",
				IsShared: false,
			},
			wantValid:  false,
			wantErrors: []string{"Name"},
		},
		{
			name: "Invalid color format",
			category: models.Category{
				Name:     "テストカテゴリ",
				Color:    "invalid-color",
				IsShared: false,
			},
			wantValid:  false,
			wantErrors: []string{"Color"},
		},
		{
			name: "Empty color",
			category: models.Category{
				Name:     "テストカテゴリ",
				Color:    "",
				IsShared: false,
			},
			wantValid:  false,
			wantErrors: []string{"Color"},
		},
		{
			name: "Valid short hex color",
			category: models.Category{
				Name:     "テストカテゴリ",
				Color:    "#ABC",
				IsShared: false,
			},
			wantValid: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validate.Struct(tt.category)
			
			if tt.wantValid {
				assert.NoError(t, err, "Expected category to be valid")
			} else {
				assert.Error(t, err, "Expected category to be invalid")
				
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

func TestCreateCategoryRequestValidation(t *testing.T) {
	validate := validator.New()

	tests := []struct {
		name       string
		request    models.CreateCategoryRequest
		wantValid  bool
		wantErrors []string
	}{
		{
			name: "Valid create request",
			request: models.CreateCategoryRequest{
				Name:     "新しいカテゴリ",
				Color:    "#3B82F6",
				IsShared: false,
			},
			wantValid: true,
		},
		{
			name: "Valid shared create request",
			request: models.CreateCategoryRequest{
				Name:     "共通カテゴリ",
				Color:    "#8B5CF6",
				IsShared: true,
			},
			wantValid: true,
		},
		{
			name: "Empty name",
			request: models.CreateCategoryRequest{
				Name:     "",
				Color:    "#3B82F6",
				IsShared: false,
			},
			wantValid:  false,
			wantErrors: []string{"Name"},
		},
		{
			name: "Invalid color",
			request: models.CreateCategoryRequest{
				Name:     "新しいカテゴリ",
				Color:    "blue",
				IsShared: false,
			},
			wantValid:  false,
			wantErrors: []string{"Color"},
		},
		{
			name: "Name at limit (50 chars)",
			request: models.CreateCategoryRequest{
				Name:     "１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５６７８９０１２３４５",
				Color:    "#3B82F6",
				IsShared: false,
			},
			wantValid: true,
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

func TestUpdateCategoryRequestValidation(t *testing.T) {
	validate := validator.New()

	tests := []struct {
		name       string
		request    models.UpdateCategoryRequest
		wantValid  bool
		wantErrors []string
	}{
		{
			name: "Valid update request",
			request: models.UpdateCategoryRequest{
				Name:     "更新されたカテゴリ",
				Color:    "#EF4444",
				IsShared: true,
			},
			wantValid: true,
		},
		{
			name: "Toggle shared flag",
			request: models.UpdateCategoryRequest{
				Name:     "通常カテゴリ",
				Color:    "#10B981",
				IsShared: false,
			},
			wantValid: true,
		},
		{
			name: "Empty name",
			request: models.UpdateCategoryRequest{
				Name:     "",
				Color:    "#EF4444",
				IsShared: false,
			},
			wantValid:  false,
			wantErrors: []string{"Name"},
		},
		{
			name: "Invalid color",
			request: models.UpdateCategoryRequest{
				Name:     "更新されたカテゴリ",
				Color:    "red",
				IsShared: false,
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