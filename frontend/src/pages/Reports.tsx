import React, { useState, useEffect } from 'react';
import { reportApi, cardApi } from '../services/api';
import { MonthlyReport, YearlyReport, Card } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [yearlyReport, setYearlyReport] = useState<YearlyReport | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedCard, setSelectedCard] = useState<string>('');

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthlyReport();
    } else {
      fetchYearlyReport();
    }
  }, [activeTab, selectedYear, selectedMonth, selectedCard]);

  const fetchCards = async () => {
    try {
      const cardsData = await cardApi.getAll();
      setCards(cardsData);
    } catch (err) {
      console.error('Error fetching cards:', err);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await reportApi.getMonthlyReport(
        selectedYear,
        selectedMonth,
        selectedCard || undefined
      );
      setMonthlyReport(report);
    } catch (err) {
      setError('月次レポートの取得に失敗しました');
      console.error('Error fetching monthly report:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchYearlyReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const report = await reportApi.getYearlyReport(
        selectedYear,
        selectedCard || undefined
      );
      setYearlyReport(report);
    } catch (err) {
      setError('年次レポートの取得に失敗しました');
      console.error('Error fetching yearly report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const getCategoryPieData = (byCategory: any[]) => ({
    labels: byCategory.map(item => item.categoryName),
    datasets: [
      {
        data: byCategory.map(item => item.totalAmount),
        backgroundColor: byCategory.map(item => item.color),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  });

  const getCardPieData = (byCard: any[]) => ({
    labels: byCard.map(item => item.cardName),
    datasets: [
      {
        data: byCard.map(item => item.totalAmount),
        backgroundColor: byCard.map(item => item.color),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  });

  const getMonthlyLineData = (monthlyData: any[]) => ({
    labels: monthlyData.map(item => `${item.month}月`),
    datasets: [
      {
        label: '支出金額',
        data: monthlyData.map(item => item.totalAmount),
        borderColor: '#8142e7',
        backgroundColor: 'rgba(129, 66, 231, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
    ],
  });

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ¥${context.parsed.toLocaleString()}`;
          },
        },
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ¥${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '¥' + value.toLocaleString();
          },
        },
      },
    },
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}月` }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📈 レポート</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">支出の詳細な分析とグラフを確認できます</p>
        </div>
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-600">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'monthly'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            📊 月次レポート
          </button>
          <button
            onClick={() => setActiveTab('yearly')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'yearly'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            📈 年次レポート
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔍 フィルター</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">年</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="form-select"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
          </div>
          
          {activeTab === 'monthly' && (
            <div>
              <label className="form-label">月</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="form-select"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="form-label">カード</label>
            <select
              value={selectedCard}
              onChange={(e) => setSelectedCard(e.target.value)}
              className="form-select"
            >
              <option value="">すべてのカード</option>
              {cards.map(card => (
                <option key={card.id} value={card.id}>{card.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'monthly' && monthlyReport && (
            <>
              {/* Monthly Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card text-center">
                  <div className="text-3xl font-bold text-primary-600">
                    {selectedYear}年{selectedMonth}月
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">期間</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-bold text-red-600">
                    ¥{monthlyReport.totalAmount.toLocaleString()}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">総支出</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {(monthlyReport.byCategory.reduce((sum, cat) => sum + cat.count, 0))}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">支出件数</div>
                </div>
              </div>

              {/* Monthly Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {monthlyReport.byCategory.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">カテゴリ別支出</h3>
                    <div className="h-80">
                      <Pie data={getCategoryPieData(monthlyReport.byCategory)} options={chartOptions} />
                    </div>
                  </div>
                )}
                
                {monthlyReport.byCard.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">カード別支出</h3>
                    <div className="h-80">
                      <Pie data={getCardPieData(monthlyReport.byCard)} options={chartOptions} />
                    </div>
                  </div>
                )}
              </div>

              {/* Category Details */}
              {monthlyReport.byCategory.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">カテゴリ別詳細</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">カテゴリ</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">金額</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">件数</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">割合</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {monthlyReport.byCategory.map((category) => (
                          <tr key={category.categoryId}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div
                                  className="w-4 h-4 rounded-full mr-3"
                                  style={{ backgroundColor: category.color }}
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{category.categoryName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              ¥{category.totalAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {category.count}件
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {((category.totalAmount / monthlyReport.totalAmount) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'yearly' && yearlyReport && (
            <>
              {/* Yearly Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card text-center">
                  <div className="text-3xl font-bold text-primary-600">
                    {selectedYear}年
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">期間</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-bold text-red-600">
                    ¥{yearlyReport.totalAmount.toLocaleString()}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">年間総支出</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    ¥{yearlyReport.monthlyData.length > 0 ? Math.round(yearlyReport.totalAmount / 12).toLocaleString() : 0}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">月平均支出</div>
                </div>
              </div>

              {/* Monthly Trend Chart */}
              {yearlyReport.monthlyData.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">月別支出推移</h3>
                  <div className="h-80">
                    <Line data={getMonthlyLineData(yearlyReport.monthlyData)} options={lineChartOptions} />
                  </div>
                </div>
              )}

              {/* Yearly Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {yearlyReport.byCategory.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">年間カテゴリ別支出</h3>
                    <div className="h-80">
                      <Pie data={getCategoryPieData(yearlyReport.byCategory)} options={chartOptions} />
                    </div>
                  </div>
                )}
                
                {yearlyReport.byCard.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">年間カード別支出</h3>
                    <div className="h-80">
                      <Pie data={getCardPieData(yearlyReport.byCard)} options={chartOptions} />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* No Data Message */}
          {((activeTab === 'monthly' && monthlyReport && monthlyReport.totalAmount === 0) ||
            (activeTab === 'yearly' && yearlyReport && yearlyReport.totalAmount === 0)) && (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                データがありません
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                選択した期間に支出データがありません
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;