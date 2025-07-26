import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('inline-block', 'w-8', 'h-8'); // default medium size
  });

  it('renders with small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('renders with large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toHaveClass('w-12', 'h-12');
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toHaveClass('custom-class');
  });

  it('has spinning animation', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.firstChild as HTMLElement;
    const spinnerElement = spinner.querySelector('div');
    expect(spinnerElement).toHaveClass('animate-spin');
  });
});