import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { expenseApi, cardApi, categoryApi } from '../services/api';
import { Expense, Card, Category } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';

const ExpenseList: React.FC = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; expense: Expense | null }>({
    isOpen: false,
    expense: null,
  });

  // Filters
  const [filters, setFilters] = useState({
    cardId: '',
    categoryId: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesResponse, cardsData, categoriesData] = await Promise.all([
        expenseApi.getAll(),
        cardApi.getAll(),
        categoryApi.getAll(),
      ]);
      setExpenses(expensesResponse.data);
      setCards(cardsData);
      setCategories(categoriesData);
    } catch (err) {
      setError('データの取得に失敗しました');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expense: Expense) => {
    try {
      await expenseApi.delete(expense.id);
      setExpenses(expenses.filter(e => e.id !== expense.id));
      setDeleteDialog({ isOpen: false, expense: null });
    } catch (err) {
      setError('支出の削除に失敗しました');
      console.error('Error deleting expense:', err);
    }
  };

  const getCardName = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    return card ? card.name : '不明なカード';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '不明なカテゴリ';
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#10B981';
  };

  const getCardColor = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    return card ? card.color : '#8142e7';
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesCard = !filters.cardId || expense.cardId === filters.cardId;
    const matchesCategory = !filters.categoryId || expense.categoryId === filters.categoryId;
    const matchesStartDate = !filters.startDate || new Date(expense.date) >= new Date(filters.startDate);
    const matchesEndDate = !filters.endDate || new Date(expense.date) <= new Date(filters.endDate);
    const matchesMinAmount = !filters.minAmount || expense.amount >= Number(filters.minAmount);
    const matchesMaxAmount = !filters.maxAmount || expense.amount <= Number(filters.maxAmount);

    return matchesCard && matchesCategory && matchesStartDate && matchesEndDate && matchesMinAmount && matchesMaxAmount;
  });

  const clearFilters = () => {
    setFilters({
      cardId: '',
      categoryId: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
    });
  };

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📋 支出一覧</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">登録された支出を確認・管理できます</p>
        </div>
        <Link to="/expenses/new" className="btn btn-primary btn-lg">
          <span className="mr-2">➕</span>
          新しい支出を登録
        </Link>
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

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔍 絞り込み</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="form-label">カード</label>
            <select
              value={filters.cardId}
              onChange={(e) => setFilters({ ...filters, cardId: e.target.value })}
              className="form-select"
            >
              <option value="">すべてのカード</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">カテゴリ</label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              className="form-select"
            >
              <option value="">すべてのカテゴリ</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">開始日</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">終了日</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">最小金額</label>
            <input
              type="number"
              value={filters.minAmount}
              onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
              className="form-input"
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="form-label">最大金額</label>
            <input
              type="number"
              value={filters.maxAmount}
              onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
              className="form-input"
              placeholder="上限なし"
              min="0"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {filteredExpenses.length}件 / 合計{expenses.length}件
          </p>
          <button
            onClick={clearFilters}
            className="btn btn-secondary btn-sm"
          >
            フィルターをクリア
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            {filteredExpenses.length}
          </div>
          <div className="text-gray-600">支出件数</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">
            ¥{totalAmount.toLocaleString()}
          </div>
          <div className="text-gray-600">合計金額</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            ¥{filteredExpenses.length > 0 ? Math.round(totalAmount / filteredExpenses.length).toLocaleString() : 0}
          </div>
          <div className="text-gray-600">平均金額</div>
        </div>
      </div>

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {expenses.length === 0 ? '支出がありません' : '条件に合う支出がありません'}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {expenses.length === 0 
              ? '最初の支出を登録しましょう'
              : 'フィルター条件を変更してください'
            }
          </p>
          {expenses.length === 0 && (
            <Link to="/expenses/new" className="btn btn-primary">
              支出を登録
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExpenses
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((expense) => (
              <div key={expense.id} className="card card-hover">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-1 h-16 rounded-full"
                      style={{ backgroundColor: getCardColor(expense.cardId) }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{expense.description}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300 mt-1">
                        <span className="flex items-center">
                          💳 {getCardName(expense.cardId)}
                        </span>
                        <span className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-1"
                            style={{ backgroundColor: getCategoryColor(expense.categoryId) }}
                          />
                          {getCategoryName(expense.categoryId)}
                        </span>
                        <span>📅 {new Date(expense.date).toLocaleDateString('ja-JP')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        ¥{expense.amount.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => navigate(`/expenses/${expense.id}/edit`)}
                        className="icon-btn text-gray-400 hover:text-primary-600"
                        title="編集"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ isOpen: true, expense })}
                        className="icon-btn text-gray-400 hover:text-red-600"
                        title="削除"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, expense: null })}
        onConfirm={() => deleteDialog.expense && handleDelete(deleteDialog.expense)}
        title="支出を削除"
        message={`「${deleteDialog.expense?.description}」を削除してもよろしいですか？この操作は取り消せません。`}
        confirmText="削除"
        type="danger"
      />
    </div>
  );
};

export default ExpenseList;