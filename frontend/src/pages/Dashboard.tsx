import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { expenseApi, cardApi, categoryApi } from '../services/api';
import { Expense, Card, Category } from '../types';

const Dashboard: React.FC = () => {
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [cardCount, setCardCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch recent expenses
        const expensesResponse = await expenseApi.getAll({ limit: 5 });
        setRecentExpenses(expensesResponse.data);
        
        // Calculate total expenses for current month
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const startOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
        const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
        
        const monthlyExpenses = await expenseApi.getAll({
          startDate: startOfMonth,
          endDate: endOfMonth,
        });
        
        const monthlyTotal = monthlyExpenses.data.reduce((sum, expense) => sum + expense.amount, 0);
        setTotalExpenses(monthlyTotal);
        
        // Fetch cards and categories count
        const cards = await cardApi.getAll();
        const categories = await categoryApi.getAll();
        
        setCardCount(cards.length);
        setCategoryCount(categories.length);
      } catch (err) {
        setError('ダッシュボードデータの取得に失敗しました');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">ダッシュボード</h1>
        <Link
          to="/expenses/new"
          className="btn btn-primary"
        >
          支出を追加
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">今月の支出</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">登録カード数</p>
              <p className="text-2xl font-bold text-gray-800">{cardCount}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">カテゴリ数</p>
              <p className="text-2xl font-bold text-gray-800">{categoryCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">最近の支出</h2>
          <Link
            to="/expenses"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            すべて見る
          </Link>
        </div>
        
        {recentExpenses.length === 0 ? (
          <p className="text-gray-500">支出データがありません</p>
        ) : (
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: expense.category?.color }}
                  />
                  <div>
                    <p className="font-medium text-gray-800">{expense.description}</p>
                    <p className="text-sm text-gray-600">
                      {expense.category?.name} • {expense.card?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">{formatCurrency(expense.amount)}</p>
                  <p className="text-sm text-gray-600">{formatDate(expense.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/expenses/new"
          className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-800">支出を登録</h3>
              <p className="text-gray-600">新しい支出を追加します</p>
            </div>
          </div>
        </Link>

        <Link
          to="/reports"
          className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-800">レポートを見る</h3>
              <p className="text-gray-600">支出の分析とレポートを確認します</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;