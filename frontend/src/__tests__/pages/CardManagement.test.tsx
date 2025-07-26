// API をモック（import.meta.envの問題を回避）
jest.mock('../../services/api', () => ({
  cardApi: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CardManagement from '../../pages/CardManagement';
import { cardApi } from '../../services/api';
import { Card } from '../../types';
const mockedCardApi = cardApi as jest.Mocked<typeof cardApi>;

// コンポーネントをモック
jest.mock('../../components/Modal', () => {
  return function MockModal({ isOpen, onClose, title, children }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <button data-testid="modal-close" onClick={onClose}>
          Close
        </button>
        <div data-testid="modal-content">{children}</div>
      </div>
    );
  };
});

jest.mock('../../components/ConfirmDialog', () => {
  return function MockConfirmDialog({ isOpen, onClose, onConfirm, title, message }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="confirm-dialog">
        <div data-testid="confirm-title">{title}</div>
        <div data-testid="confirm-message">{message}</div>
        <button data-testid="confirm-cancel" onClick={onClose}>
          Cancel
        </button>
        <button data-testid="confirm-ok" onClick={onConfirm}>
          OK
        </button>
      </div>
    );
  };
});

jest.mock('../../components/LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

const mockCards: Card[] = [
  {
    id: '1',
    name: 'テストカード1',
    color: '#FF0000',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'テストカード2',
    color: '#00FF00',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

describe('CardManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn(); // エラーログを抑制
  });

  it('should display loading spinner initially', () => {
    mockedCardApi.getAll.mockImplementation(() => new Promise(() => {})); // never resolves

    render(<CardManagement />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display cards after loading', async () => {
    mockedCardApi.getAll.mockResolvedValue(mockCards);

    render(<CardManagement />);

    await waitFor(() => {
      expect(screen.getByText('テストカード1')).toBeInTheDocument();
    });

    expect(screen.getByText('テストカード2')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });

  it('should display error message when fetching fails', async () => {
    mockedCardApi.getAll.mockRejectedValue(new Error('API Error'));

    render(<CardManagement />);

    await waitFor(() => {
      expect(screen.getByText('カードの取得に失敗しました')).toBeInTheDocument();
    });
  });

  it('should open modal when add button is clicked', async () => {
    mockedCardApi.getAll.mockResolvedValue(mockCards);
    const user = userEvent.setup();

    render(<CardManagement />);

    await waitFor(() => {
      expect(screen.getByText('テストカード1')).toBeInTheDocument();
    });

    const addButton = screen.getByText('新しいカードを追加');
    await user.click(addButton);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('カードを追加');
  });

  it('should create new card when form is submitted', async () => {
    const newCard: Card = {
      id: '3',
      name: '新しいカード',
      color: '#0000FF',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    mockedCardApi.getAll.mockResolvedValue(mockCards);
    mockedCardApi.create.mockResolvedValue(newCard);

    const user = userEvent.setup();

    render(<CardManagement />);

    await waitFor(() => {
      expect(screen.getByText('テストカード1')).toBeInTheDocument();
    });

    // モーダルを開く
    const addButton = screen.getByText('新しいカードを追加');
    await user.click(addButton);

    // フォームに入力
    const nameInput = screen.getByRole('textbox');
    await user.type(nameInput, '新しいカード');

    // 送信ボタンをクリック
    const submitButton = screen.getByRole('button', { name: '追加' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedCardApi.create).toHaveBeenCalledWith({
        name: '新しいカード',
        color: '#8142e7', // デフォルトカラー
      });
    });

    // モーダルが閉じることを確認
    await waitFor(() => {
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  it('should open edit modal when edit button is clicked', async () => {
    mockedCardApi.getAll.mockResolvedValue(mockCards);
    const user = userEvent.setup();

    render(<CardManagement />);

    await waitFor(() => {
      expect(screen.getByText('テストカード1')).toBeInTheDocument();
    });

    // 編集ボタンをクリック（最初のカードの編集ボタン）
    const editButtons = screen.getAllByTitle('編集');
    await user.click(editButtons[0]);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('カードを編集');
    expect(screen.getByDisplayValue('テストカード1')).toBeInTheDocument();
  });

  it('should update card when edit form is submitted', async () => {
    const updatedCard: Card = {
      ...mockCards[0],
      name: '更新されたカード',
    };

    mockedCardApi.getAll.mockResolvedValue(mockCards);
    mockedCardApi.update.mockResolvedValue(updatedCard);

    const user = userEvent.setup();

    render(<CardManagement />);

    await waitFor(() => {
      expect(screen.getByText('テストカード1')).toBeInTheDocument();
    });

    // 編集ボタンをクリック
    const editButtons = screen.getAllByTitle('編集');
    await user.click(editButtons[0]);

    // 名前を変更
    const nameInput = screen.getByDisplayValue('テストカード1');
    await user.clear(nameInput);
    await user.type(nameInput, '更新されたカード');

    // 送信ボタンをクリック
    const submitButton = screen.getByRole('button', { name: '更新' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedCardApi.update).toHaveBeenCalledWith('1', {
        name: '更新されたカード',
        color: '#FF0000',
      });
    });
  });

  it('should show delete confirmation dialog when delete button is clicked', async () => {
    mockedCardApi.getAll.mockResolvedValue(mockCards);
    const user = userEvent.setup();

    render(<CardManagement />);

    await waitFor(() => {
      expect(screen.getByText('テストカード1')).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    const deleteButtons = screen.getAllByTitle('削除');
    await user.click(deleteButtons[0]);

    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-title')).toHaveTextContent('カードを削除');
  });

  it('should delete card when deletion is confirmed', async () => {
    mockedCardApi.getAll.mockResolvedValue(mockCards);
    mockedCardApi.delete.mockResolvedValue();

    const user = userEvent.setup();

    render(<CardManagement />);

    await waitFor(() => {
      expect(screen.getByText('テストカード1')).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    const deleteButtons = screen.getAllByTitle('削除');
    await user.click(deleteButtons[0]);

    // 削除を確認
    const confirmButton = screen.getByTestId('confirm-ok');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockedCardApi.delete).toHaveBeenCalledWith('1');
    });

    // 確認ダイアログが閉じることを確認
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });
  });

  it('should handle create error', async () => {
    mockedCardApi.getAll.mockResolvedValue(mockCards);
    mockedCardApi.create.mockRejectedValue(new Error('Create failed'));

    const user = userEvent.setup();

    render(<CardManagement />);

    await waitFor(() => {
      expect(screen.getByText('テストカード1')).toBeInTheDocument();
    });

    // モーダルを開く
    const addButton = screen.getByText('新しいカードを追加');
    await user.click(addButton);

    // フォームに入力
    const nameInput = screen.getByRole('textbox');
    await user.type(nameInput, '新しいカード');

    // 送信ボタンをクリック
    const submitButton = screen.getByRole('button', { name: '追加' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('カードの作成に失敗しました')).toBeInTheDocument();
    });
  });

  it('should handle update error', async () => {
    mockedCardApi.getAll.mockResolvedValue(mockCards);
    mockedCardApi.update.mockRejectedValue(new Error('Update failed'));

    const user = userEvent.setup();

    render(<CardManagement />);

    await waitFor(() => {
      expect(screen.getByText('テストカード1')).toBeInTheDocument();
    });

    // 編集ボタンをクリック
    const editButtons = screen.getAllByTitle('編集');
    await user.click(editButtons[0]);

    // 送信ボタンをクリック
    const submitButton = screen.getByRole('button', { name: '更新' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('カードの更新に失敗しました')).toBeInTheDocument();
    });
  });

  it('should handle delete error', async () => {
    mockedCardApi.getAll.mockResolvedValue(mockCards);
    mockedCardApi.delete.mockRejectedValue(new Error('Delete failed'));

    const user = userEvent.setup();

    render(<CardManagement />);

    await waitFor(() => {
      expect(screen.getByText('テストカード1')).toBeInTheDocument();
    });

    // 削除ボタンをクリック
    const deleteButtons = screen.getAllByTitle('削除');
    await user.click(deleteButtons[0]);

    // 削除を確認
    const confirmButton = screen.getByTestId('confirm-ok');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('カードの削除に失敗しました')).toBeInTheDocument();
    });
  });

  it('should close modal when close button is clicked', async () => {
    mockedCardApi.getAll.mockResolvedValue(mockCards);
    const user = userEvent.setup();

    render(<CardManagement />);

    await waitFor(() => {
      expect(screen.getByText('テストカード1')).toBeInTheDocument();
    });

    // モーダルを開く
    const addButton = screen.getByText('新しいカードを追加');
    await user.click(addButton);

    expect(screen.getByTestId('modal')).toBeInTheDocument();

    // モーダルを閉じる
    const closeButton = screen.getByTestId('modal-close');
    await user.click(closeButton);

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });
});