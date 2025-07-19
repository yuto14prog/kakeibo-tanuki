import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { expenseApi, cardApi, categoryApi } from '../services/api';
import { Card, Category, CreateExpenseRequest, Expense } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const ExpenseForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [cards, setCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateExpenseRequest>({
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    cardId: '',
    categoryId: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      fetchExpense(id);
    }
  }, [isEdit, id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [cardsData, categoriesData] = await Promise.all([
        cardApi.getAll(),
        categoryApi.getAll(),
      ]);
      setCards(cardsData);
      setCategories(categoriesData);
      
      if (cardsData.length > 0 && !formData.cardId) {
        setFormData(prev => ({ ...prev, cardId: cardsData[0].id }));
      }
      if (categoriesData.length > 0 && !formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: categoriesData[0].id }));
      }
    } catch (err) {
      setError('初期データの取得に失敗しました');
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpense = async (expenseId: string) => {
    try {
      const expense = await expenseApi.getById(expenseId);
      setFormData({
        amount: expense.amount,
        description: expense.description,
        date: new Date(expense.date).toISOString().split('T')[0],
        cardId: expense.cardId,
        categoryId: expense.categoryId,
      });
    } catch (err) {
      setError('支出データの取得に失敗しました');
      console.error('Error fetching expense:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      setError('金額は0円より大きい値を入力してください');
      return;
    }

    if (!formData.description.trim()) {
      setError('説明を入力してください');
      return;
    }

    if (!formData.cardId || !formData.categoryId) {
      setError('カードとカテゴリを選択してください');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Send formData as-is (date is already in YYYY-MM-DD format)
      const requestData = formData;
      console.log('Sending expense data:', requestData);

      if (isEdit && id) {
        await expenseApi.update(id, requestData);
      } else {
        await expenseApi.create(requestData);
      }

      navigate('/expenses');
    } catch (err) {
      setError(isEdit ? '支出の更新に失敗しました' : '支出の登録に失敗しました');
      console.error('Error saving expense:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/expenses');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEdit ? '📝 支出を編集' : '➕ 支出を登録'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          {isEdit ? '支出情報を更新できます' : '新しい支出を記録できます'}
        </p>
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

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <label className="form-label">金額 *</label>
            <div className="relative">
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="form-input pl-8"
                placeholder="0"
                required
                min="1"
                step="1"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">¥</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="form-label">説明 *</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input"
              placeholder="例: ランチ代"
              required
              maxLength={200}
            />
          </div>

          {/* Date */}
          <div>
            <label className="form-label">日付 *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="form-input"
              required
            />
          </div>

          {/* Card Selection */}
          <div>
            <label className="form-label">使用カード *</label>
            {cards.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-200">
                  カードが登録されていません。
                  <button
                    type="button"
                    onClick={() => navigate('/cards')}
                    className="text-primary-600 hover:text-primary-700 underline ml-1"
                  >
                    カード管理ページ
                  </button>
                  で最初にカードを登録してください。
                </p>
              </div>
            ) : (
              <select
                value={formData.cardId}
                onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
                className="form-select"
                required
              >
                <option value="">カードを選択してください</option>
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <label className="form-label">カテゴリ *</label>
            {categories.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-200">
                  カテゴリが登録されていません。
                  <button
                    type="button"
                    onClick={() => navigate('/categories')}
                    className="text-primary-600 hover:text-primary-700 underline ml-1"
                  >
                    カテゴリ管理ページ
                  </button>
                  で最初にカテゴリを登録してください。
                </p>
              </div>
            ) : (
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="form-select"
                required
              >
                <option value="">カテゴリを選択してください</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary flex-1"
              disabled={submitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={submitting || cards.length === 0 || categories.length === 0}
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  {isEdit ? '更新中...' : '登録中...'}
                </div>
              ) : (
                isEdit ? '更新' : '登録'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;