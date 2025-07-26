import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from '../../components/ConfirmDialog';

// Modal コンポーネントをモック
jest.mock('../../components/Modal', () => {
  return function MockModal({ isOpen, onClose, title, children, size }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal" data-size={size}>
        <div data-testid="modal-title">{title}</div>
        <button data-testid="modal-close" onClick={onClose}>Close</button>
        <div data-testid="modal-content">{children}</div>
      </div>
    );
  };
});

describe('ConfirmDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  
  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnConfirm.mockClear();
  });

  it('does not render when isOpen is false', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Confirm Action"
        message="Are you sure?"
      />
    );
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders with default props when isOpen is true', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Confirm Action"
        message="Are you sure?"
      />
    );
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Confirm Action');
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
    expect(screen.getByText('確認')).toBeInTheDocument();
  });

  it('renders with custom button text', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="This action cannot be undone"
        confirmText="Delete"
        cancelText="Cancel"
      />
    );
    
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('displays correct icon for danger type', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="This action cannot be undone"
        type="danger"
      />
    );
    
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('displays correct icon for warning type', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Warning"
        message="Please be careful"
        type="warning"
      />
    );
    
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('displays correct icon for info type', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Information"
        message="Please note"
        type="info"
      />
    );
    
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Confirm Action"
        message="Are you sure?"
      />
    );
    
    const cancelButton = screen.getByText('キャンセル');
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm and onClose when confirm button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Confirm Action"
        message="Are you sure?"
      />
    );
    
    const confirmButton = screen.getByText('確認');
    await user.click(confirmButton);
    
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('applies correct button class for danger type', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="This action cannot be undone"
        type="danger"
      />
    );
    
    const confirmButton = screen.getByText('確認');
    expect(confirmButton).toHaveClass('btn', 'btn-danger');
  });

  it('applies correct button class for warning type', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Warning"
        message="Please be careful"
        type="warning"
      />
    );
    
    const confirmButton = screen.getByText('確認');
    expect(confirmButton).toHaveClass('btn', 'btn-primary');
  });

  it('uses small modal size', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Confirm Action"
        message="Are you sure?"
      />
    );
    
    const modal = screen.getByTestId('modal');
    expect(modal).toHaveAttribute('data-size', 'sm');
  });
});