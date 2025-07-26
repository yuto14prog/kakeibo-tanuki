import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../../components/Modal';

describe('Modal', () => {
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('calls onClose when clicking the close button', async () => {
    const user = userEvent.setup();
    
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );
    
    const closeButton = screen.getByRole('button');
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the background overlay', async () => {
    const user = userEvent.setup();
    
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );
    
    const overlay = document.querySelector('.bg-gray-500');
    if (overlay) {
      await user.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onClose when pressing Escape key', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when pressing other keys', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal" size="sm">
        <div>Modal content</div>
      </Modal>
    );
    
    let modalContent = document.querySelector('.max-w-md');
    expect(modalContent).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal" size="lg">
        <div>Modal content</div>
      </Modal>
    );
    
    modalContent = document.querySelector('.max-w-2xl');
    expect(modalContent).toBeInTheDocument();
  });

  it('sets body overflow to hidden when open', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('resets body overflow when unmounted', () => {
    const { unmount } = render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );
    
    unmount();
    expect(document.body.style.overflow).toBe('unset');
  });
});