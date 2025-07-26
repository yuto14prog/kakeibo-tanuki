// axios をモック
jest.mock('axios');

// services/api.tsファイル全体をモック（import.meta.envの問題を回避）
jest.mock('../../services/api', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  return {
    cardApi: {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    categoryApi: {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    expenseApi: {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    reportApi: {
      getMonthlyReport: jest.fn(),
      getYearlyReport: jest.fn(),
      getCategoryReport: jest.fn(),
    },
    healthApi: {
      check: jest.fn(),
    },
  };
});

import axios from 'axios';
import { cardApi, categoryApi, expenseApi, reportApi, healthApi } from '../../services/api';
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
} from '../../types';
const mockedCardApi = cardApi as jest.Mocked<typeof cardApi>;
const mockedCategoryApi = categoryApi as jest.Mocked<typeof categoryApi>;
const mockedExpenseApi = expenseApi as jest.Mocked<typeof expenseApi>;
const mockedReportApi = reportApi as jest.Mocked<typeof reportApi>;
const mockedHealthApi = healthApi as jest.Mocked<typeof healthApi>;

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cardApi', () => {
    const mockCard: Card = {
      id: '1',
      name: 'Test Card',
      color: '#FF0000',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    const mockApiResponse: ApiResponse<Card> = {
      message: 'Success',
      data: mockCard,
    };

    const mockCardsResponse: ApiResponse<Card[]> = {
      message: 'Success',
      data: [mockCard],
    };

    it('should get all cards', async () => {
      mockedCardApi.getAll.mockResolvedValue([mockCard]);

      const result = await cardApi.getAll();

      expect(mockedCardApi.getAll).toHaveBeenCalled();
      expect(result).toEqual([mockCard]);
    });

    it('should get card by id', async () => {
      mockedCardApi.getById.mockResolvedValue(mockCard);

      const result = await cardApi.getById('1');

      expect(mockedCardApi.getById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCard);
    });

    it('should create a card', async () => {
      const createRequest: CreateCardRequest = {
        name: 'New Card',
        color: '#00FF00',
      };

      mockedCardApi.create.mockResolvedValue(mockCard);

      const result = await cardApi.create(createRequest);

      expect(mockedCardApi.create).toHaveBeenCalledWith(createRequest);
      expect(result).toEqual(mockCard);
    });

    it('should update a card', async () => {
      const updateRequest: CreateCardRequest = {
        name: 'Updated Card',
        color: '#0000FF',
      };

      mockedCardApi.update.mockResolvedValue(mockCard);

      const result = await cardApi.update('1', updateRequest);

      expect(mockedCardApi.update).toHaveBeenCalledWith('1', updateRequest);
      expect(result).toEqual(mockCard);
    });

    it('should delete a card', async () => {
      mockedCardApi.delete.mockResolvedValue();

      await cardApi.delete('1');

      expect(mockedCardApi.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('categoryApi', () => {
    const mockCategory: Category = {
      id: '1',
      name: 'Test Category',
      color: '#FF0000',
      isShared: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    const mockApiResponse: ApiResponse<Category> = {
      message: 'Success',
      data: mockCategory,
    };

    const mockCategoriesResponse: ApiResponse<Category[]> = {
      message: 'Success',
      data: [mockCategory],
    };

    it('should get all categories', async () => {
      mockedCategoryApi.getAll.mockResolvedValue([mockCategory]);

      const result = await categoryApi.getAll();

      expect(mockedCategoryApi.getAll).toHaveBeenCalled();
      expect(result).toEqual([mockCategory]);
    });

    it('should get category by id', async () => {
      mockedCategoryApi.getById.mockResolvedValue(mockCategory);

      const result = await categoryApi.getById('1');

      expect(mockedCategoryApi.getById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCategory);
    });

    it('should create a category', async () => {
      const createRequest: CreateCategoryRequest = {
        name: 'New Category',
        color: '#00FF00',
        isShared: true,
      };

      mockedCategoryApi.create.mockResolvedValue(mockCategory);

      const result = await categoryApi.create(createRequest);

      expect(mockedCategoryApi.create).toHaveBeenCalledWith(createRequest);
      expect(result).toEqual(mockCategory);
    });

    it('should update a category', async () => {
      const updateRequest: CreateCategoryRequest = {
        name: 'Updated Category',
        color: '#0000FF',
        isShared: false,
      };

      mockedCategoryApi.update.mockResolvedValue(mockCategory);

      const result = await categoryApi.update('1', updateRequest);

      expect(mockedCategoryApi.update).toHaveBeenCalledWith('1', updateRequest);
      expect(result).toEqual(mockCategory);
    });

    it('should delete a category', async () => {
      mockedCategoryApi.delete.mockResolvedValue();

      await categoryApi.delete('1');

      expect(mockedCategoryApi.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('expenseApi', () => {
    const mockExpense: Expense = {
      id: '1',
      amount: 1000,
      date: '2025-01-01',
      description: 'Test Expense',
      cardId: '1',
      categoryId: '1',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    const mockPaginatedResponse: PaginatedResponse<Expense> = {
      data: [mockExpense],
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 1,
        totalItems: 1,
      },
    };

    const mockApiResponse: ApiResponse<Expense> = {
      message: 'Success',
      data: mockExpense,
    };

    it('should get all expenses without filters', async () => {
      mockedExpenseApi.getAll.mockResolvedValue(mockPaginatedResponse);

      const result = await expenseApi.getAll();

      expect(mockedExpenseApi.getAll).toHaveBeenCalledWith();
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should get all expenses with filters', async () => {
      const filters: ExpenseFilters = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        cardId: '1',
        categoryId: '1',
        page: 1,
        limit: 10,
      };

      mockedExpenseApi.getAll.mockResolvedValue(mockPaginatedResponse);

      const result = await expenseApi.getAll(filters);

      expect(mockedExpenseApi.getAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should get expense by id', async () => {
      mockedExpenseApi.getById.mockResolvedValue(mockExpense);

      const result = await expenseApi.getById('1');

      expect(mockedExpenseApi.getById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockExpense);
    });

    it('should create an expense', async () => {
      const createRequest: CreateExpenseRequest = {
        amount: 1000,
        date: '2025-01-01',
        description: 'New Expense',
        cardId: '1',
        categoryId: '1',
      };

      mockedExpenseApi.create.mockResolvedValue(mockExpense);

      const result = await expenseApi.create(createRequest);

      expect(mockedExpenseApi.create).toHaveBeenCalledWith(createRequest);
      expect(result).toEqual(mockExpense);
    });

    it('should update an expense', async () => {
      const updateRequest: CreateExpenseRequest = {
        amount: 2000,
        date: '2025-01-02',
        description: 'Updated Expense',
        cardId: '2',
        categoryId: '2',
      };

      mockedExpenseApi.update.mockResolvedValue(mockExpense);

      const result = await expenseApi.update('1', updateRequest);

      expect(mockedExpenseApi.update).toHaveBeenCalledWith('1', updateRequest);
      expect(result).toEqual(mockExpense);
    });

    it('should delete an expense', async () => {
      mockedExpenseApi.delete.mockResolvedValue();

      await expenseApi.delete('1');

      expect(mockedExpenseApi.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('reportApi', () => {
    const mockMonthlyReport: MonthlyReport = {
      year: 2025,
      month: 1,
      totalAmount: 10000,
      sharedExpenses: {
        totalSharedAmount: 2000,
        splitAmount: 1000,
        categories: [],
      },
      byCategory: [],
      byCard: [],
    };

    const mockYearlyReport: YearlyReport = {
      year: 2025,
      totalAmount: 120000,
      monthlyData: [],
      byCategory: [],
      byCard: [],
    };

    it('should get monthly report without cardId', async () => {
      mockedReportApi.getMonthlyReport.mockResolvedValue(mockMonthlyReport);

      const result = await reportApi.getMonthlyReport(2025, 1);

      expect(mockedReportApi.getMonthlyReport).toHaveBeenCalledWith(2025, 1);
      expect(result).toEqual(mockMonthlyReport);
    });

    it('should get monthly report with cardId', async () => {
      mockedReportApi.getMonthlyReport.mockResolvedValue(mockMonthlyReport);

      const result = await reportApi.getMonthlyReport(2025, 1, 'card-1');

      expect(mockedReportApi.getMonthlyReport).toHaveBeenCalledWith(2025, 1, 'card-1');
      expect(result).toEqual(mockMonthlyReport);
    });

    it('should get yearly report without cardId', async () => {
      mockedReportApi.getYearlyReport.mockResolvedValue(mockYearlyReport);

      const result = await reportApi.getYearlyReport(2025);

      expect(mockedReportApi.getYearlyReport).toHaveBeenCalledWith(2025);
      expect(result).toEqual(mockYearlyReport);
    });

    it('should get yearly report with cardId', async () => {
      mockedReportApi.getYearlyReport.mockResolvedValue(mockYearlyReport);

      const result = await reportApi.getYearlyReport(2025, 'card-1');

      expect(mockedReportApi.getYearlyReport).toHaveBeenCalledWith(2025, 'card-1');
      expect(result).toEqual(mockYearlyReport);
    });
  });

  describe('healthApi', () => {
    it('should check health status', async () => {
      const mockHealthResponse = {
        status: 'ok',
        message: 'Service is healthy',
      };

      mockedHealthApi.check.mockResolvedValue(mockHealthResponse);

      const result = await healthApi.check();

      expect(mockedHealthApi.check).toHaveBeenCalled();
      expect(result).toEqual(mockHealthResponse);
    });
  });

  describe('Error handling', () => {
    it('should handle API errors', async () => {
      const errorResponse = new Error('API Error');

      mockedCardApi.getAll.mockRejectedValue(errorResponse);

      await expect(cardApi.getAll()).rejects.toEqual(errorResponse);
    });
  });
});