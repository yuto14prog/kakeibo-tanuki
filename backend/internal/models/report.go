package models

import (
	"github.com/google/uuid"
)

type MonthlyReport struct {
	Year         int                     `json:"year"`
	Month        int                     `json:"month"`
	TotalAmount  float64                 `json:"totalAmount"`
	ByCategory   []CategoryExpenseSum    `json:"byCategory"`
	ByCard       []CardExpenseSum        `json:"byCard"`
}

type YearlyReport struct {
	Year        int                   `json:"year"`
	TotalAmount float64               `json:"totalAmount"`
	MonthlyData []MonthlyExpenseSum   `json:"monthlyData"`
	ByCategory  []CategoryExpenseSum  `json:"byCategory"`
	ByCard      []CardExpenseSum      `json:"byCard"`
}

type CategoryExpenseSum struct {
	CategoryID   uuid.UUID `json:"categoryId"`
	CategoryName string    `json:"categoryName"`
	Color        string    `json:"color"`
	TotalAmount  float64   `json:"totalAmount"`
	Count        int       `json:"count"`
}

type CardExpenseSum struct {
	CardID      uuid.UUID `json:"cardId"`
	CardName    string    `json:"cardName"`
	Color       string    `json:"color"`
	TotalAmount float64   `json:"totalAmount"`
	Count       int       `json:"count"`
}

type MonthlyExpenseSum struct {
	Year        int     `json:"year"`
	Month       int     `json:"month"`
	TotalAmount float64 `json:"totalAmount"`
	Count       int     `json:"count"`
}

type ReportFilters struct {
	Year   int        `json:"year"`
	Month  *int       `json:"month,omitempty"`
	CardID *uuid.UUID `json:"cardId,omitempty"`
}