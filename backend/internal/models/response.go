package models

import "time"

type ErrorResponse struct {
	Error struct {
		Code    string      `json:"code"`
		Message string      `json:"message"`
		Details interface{} `json:"details,omitempty"`
	} `json:"error"`
	Timestamp string `json:"timestamp"`
	Path      string `json:"path"`
}

type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Pagination Pagination  `json:"pagination"`
}

type Pagination struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	TotalPages int `json:"totalPages"`
	TotalItems int `json:"totalItems"`
}

func NewErrorResponse(code, message string, details interface{}, path string) *ErrorResponse {
	return &ErrorResponse{
		Error: struct {
			Code    string      `json:"code"`
			Message string      `json:"message"`
			Details interface{} `json:"details,omitempty"`
		}{
			Code:    code,
			Message: message,
			Details: details,
		},
		Timestamp: time.Now().Format(time.RFC3339),
		Path:      path,
	}
}

func NewSuccessResponse(message string, data interface{}) *SuccessResponse {
	return &SuccessResponse{
		Message: message,
		Data:    data,
	}
}

func NewPaginatedResponse(data interface{}, pagination Pagination) *PaginatedResponse {
	return &PaginatedResponse{
		Data:       data,
		Pagination: pagination,
	}
}