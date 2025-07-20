export interface Card {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  date: string;
  description: string;
  cardId: string;
  categoryId: string;
  card?: Card;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardRequest {
  name: string;
  color: string;
}

export interface CreateCategoryRequest {
  name: string;
  color: string;
  isShared: boolean;
}

export interface CreateExpenseRequest {
  amount: number;
  date: string;
  description: string;
  cardId: string;
  categoryId: string;
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  cardId?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  totalAmount: number;
  sharedExpenses: SharedExpensesSummary;
  byCategory: CategoryExpenseSum[];
  byCard: CardExpenseSum[];
}

export interface YearlyReport {
  year: number;
  totalAmount: number;
  monthlyData: MonthlyExpenseSum[];
  byCategory: CategoryExpenseSum[];
  byCard: CardExpenseSum[];
}

export interface CategoryExpenseSum {
  categoryId: string;
  categoryName: string;
  color: string;
  isShared: boolean;
  totalAmount: number;
  count: number;
}

export interface SharedExpensesSummary {
  totalSharedAmount: number;
  splitAmount: number;
  categories: CategoryExpenseSum[];
}

export interface CardExpenseSum {
  cardId: string;
  cardName: string;
  color: string;
  totalAmount: number;
  count: number;
}

export interface MonthlyExpenseSum {
  year: number;
  month: number;
  totalAmount: number;
  count: number;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}