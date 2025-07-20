import React, { useState, useEffect } from 'react';
import { cardApi } from '../services/api';
import { Card, CreateCardRequest } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';

const CardManagement: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; card: Card | null }>({
    isOpen: false,
    card: null,
  });

  const [formData, setFormData] = useState<CreateCardRequest>({
    name: '',
    color: '#8142e7',
  });

  const predefinedColors = [
    '#8142e7', '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6', '#F97316'
  ];

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const fetchedCards = await cardApi.getAll();
      setCards(fetchedCards);
    } catch (err) {
      setError('カードの取得に失敗しました');
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCard) {
        const updatedCard = await cardApi.update(editingCard.id, formData);
        setCards(cards.map(card => card.id === editingCard.id ? updatedCard : card));
      } else {
        const newCard = await cardApi.create(formData);
        setCards([...cards, newCard]);
      }
      closeModal();
    } catch (err) {
      setError(editingCard ? 'カードの更新に失敗しました' : 'カードの作成に失敗しました');
      console.error('Error saving card:', err);
    }
  };

  const handleEdit = (card: Card) => {
    setEditingCard(card);
    setFormData({ name: card.name, color: card.color });
    setIsModalOpen(true);
  };

  const handleDelete = async (card: Card) => {
    try {
      await cardApi.delete(card.id);
      setCards(cards.filter(c => c.id !== card.id));
      setDeleteDialog({ isOpen: false, card: null });
    } catch (err) {
      setError('カードの削除に失敗しました');
      console.error('Error deleting card:', err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
    setFormData({ name: '', color: '#8142e7' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">💳 カード管理</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">クレジットカードを登録・管理できます</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary btn-lg"
        >
          <span className="mr-2">➕</span>
          新しいカードを追加
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">カードがありません</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">最初のクレジットカードを追加しましょう</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            カードを追加
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.id}
              className="card card-hover"
              style={{ borderTop: `4px solid ${card.color}` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: card.color }}
                  />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{card.name}</h3>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(card)}
                    className="icon-btn text-gray-400 hover:text-primary-600"
                    title="編集"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteDialog({ isOpen: true, card })}
                    className="icon-btn text-gray-400 hover:text-red-600"
                    title="削除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                作成日: {new Date(card.createdAt).toLocaleDateString('ja-JP')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCard ? 'カードを編集' : '新しいカードを追加'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">カード名</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              placeholder="例: メインカード"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="form-label">カラー</label>
            <div className="grid grid-cols-5 gap-3 mb-3">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-12 h-12 rounded-lg border-2 transition-all duration-200 ${
                    formData.color === color
                      ? 'border-primary-500 scale-110 shadow-lg'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="btn btn-secondary flex-1"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
            >
              {editingCard ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, card: null })}
        onConfirm={() => deleteDialog.card && handleDelete(deleteDialog.card)}
        title="カードを削除"
        message={`「${deleteDialog.card?.name}」を削除してもよろしいですか？関連する支出データも削除されます。`}
        confirmText="削除"
        type="danger"
      />
    </div>
  );
};

export default CardManagement;