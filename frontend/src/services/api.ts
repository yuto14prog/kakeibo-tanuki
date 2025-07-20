import axios from 'axios';
import {
  Card,
  Category,
  Expense,
  CreateCardRequest,
  CreateCategoryRequest,
  CreateExpenseRequest,
  ExpenseFilters,
  MonthlyReport,
  YearlyReport,
  ApiResponse,
  PaginatedResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Card API
export const cardApi = {
  async getAll(): Promise<Card[]> {
    const response = await api.get<ApiResponse<Card[]>>('/api/cards');
    return response.data.data;
  },

  async getById(id: string): Promise<Card> {
    const response = await api.get<ApiResponse<Card>>(`/api/cards/${id}`);
    return response.data.data;
  },

  async create(card: CreateCardRequest): Promise<Card> {
    const response = await api.post<ApiResponse<Card>>('/api/cards', card);
    return response.data.data;
  },

  async update(id: string, card: CreateCardRequest): Promise<Card> {
    const response = await api.put<ApiResponse<Card>>(`/api/cards/${id}`, card);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/cards/${id}`);
  },
};

// Category API
export const categoryApi = {
  async getAll(): Promise<Category[]> {
    const response = await api.get<ApiResponse<Category[]>>('/api/categories');
    return response.data.data;
  },

  async getById(id: string): Promise<Category> {
    const response = await api.get<ApiResponse<Category>>(`/api/categories/${id}`);
    return response.data.data;
  },

  async create(category: CreateCategoryRequest): Promise<Category> {
    const response = await api.post<ApiResponse<Category>>('/api/categories', category);
    return response.data.data;
  },

  async update(id: string, category: CreateCategoryRequest): Promise<Category> {
    const response = await api.put<ApiResponse<Category>>(`/api/categories/${id}`, category);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/categories/${id}`);
  },
};

// Expense API
export const expenseApi = {
  async getAll(filters?: ExpenseFilters): Promise<PaginatedResponse<Expense>> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.cardId) params.append('cardId', filters.cardId);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<PaginatedResponse<Expense>>(`/api/expenses?${params}`);
    return response.data;
  },

  async getById(id: string): Promise<Expense> {
    const response = await api.get<ApiResponse<Expense>>(`/api/expenses/${id}`);
    return response.data.data;
  },

  async create(expense: CreateExpenseRequest): Promise<Expense> {
    const response = await api.post<ApiResponse<Expense>>('/api/expenses', expense);
    return response.data.data;
  },

  async update(id: string, expense: CreateExpenseRequest): Promise<Expense> {
    const response = await api.put<ApiResponse<Expense>>(`/api/expenses/${id}`, expense);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/expenses/${id}`);
  },
};

// Report API
export const reportApi = {
  async getMonthlyReport(year: number, month: number, cardId?: string): Promise<MonthlyReport> {
    const params = new URLSearchParams();
    params.append('year', year.toString());
    params.append('month', month.toString());
    if (cardId) params.append('cardId', cardId);

    const response = await api.get<ApiResponse<MonthlyReport>>(`/api/reports/monthly?${params}`);
    return response.data.data;
  },

  async getYearlyReport(year: number, cardId?: string): Promise<YearlyReport> {
    const params = new URLSearchParams();
    params.append('year', year.toString());
    if (cardId) params.append('cardId', cardId);

    const response = await api.get<ApiResponse<YearlyReport>>(`/api/reports/yearly?${params}`);
    return response.data.data;
  },
};

// Health check
export const healthApi = {
  async check(): Promise<{ status: string; message: string }> {
    const response = await api.get('/health');
    return response.data;
  },
};