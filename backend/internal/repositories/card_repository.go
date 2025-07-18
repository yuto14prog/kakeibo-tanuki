package repositories

import (
	"kakeibo-tanuki/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type cardRepository struct {
	db *gorm.DB
}

func NewCardRepository(db *gorm.DB) CardRepository {
	return &cardRepository{db: db}
}

func (r *cardRepository) Create(card *models.Card) error {
	return r.db.Create(card).Error
}

func (r *cardRepository) GetByID(id uuid.UUID) (*models.Card, error) {
	var card models.Card
	err := r.db.Where("id = ?", id).First(&card).Error
	if err != nil {
		return nil, err
	}
	return &card, nil
}

func (r *cardRepository) GetAll() ([]models.Card, error) {
	var cards []models.Card
	err := r.db.Order("created_at DESC").Find(&cards).Error
	return cards, err
}

func (r *cardRepository) Update(card *models.Card) error {
	return r.db.Save(card).Error
}

func (r *cardRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Card{}, id).Error
}

func (r *cardRepository) HasExpenses(cardID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&models.Expense{}).Where("card_id = ?", cardID).Count(&count).Error
	return count > 0, err
}