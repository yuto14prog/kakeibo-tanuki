import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

// LocalStorage のモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// テスト用コンポーネント
const TestComponent = () => {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="theme-status">{isDark ? 'dark' : 'light'}</div>
      <button data-testid="toggle-button" onClick={toggleTheme}>
        Toggle Theme
      </button>
    </div>
  );
};

const ThrowErrorComponent = () => {
  useTheme(); // ThemeProviderの外で使用してエラーを発生させる
  return <div>Should not render</div>;
};

describe('ThemeContext', () => {
  const originalClassListAdd = document.documentElement.classList.add;
  const originalClassListRemove = document.documentElement.classList.remove;

  beforeEach(() => {
    jest.clearAllMocks();
    // DOM classList のモック
    document.documentElement.classList.add = jest.fn();
    document.documentElement.classList.remove = jest.fn();
  });

  afterEach(() => {
    // クラスリストメソッドを復元
    document.documentElement.classList.add = originalClassListAdd;
    document.documentElement.classList.remove = originalClassListRemove;
    // DOMのクラスをクリーンアップ
    document.documentElement.classList.remove('dark');
  });

  it('provides default light theme when no saved theme', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme-status')).toHaveTextContent('light');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
  });

  it('loads saved dark theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('true');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
  });

  it('loads saved light theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('false');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme-status')).toHaveTextContent('light');
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
  });

  it('toggles theme from light to dark', async () => {
    localStorageMock.getItem.mockReturnValue('false');
    
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme-status')).toHaveTextContent('light');
    
    const toggleButton = screen.getByTestId('toggle-button');
    await user.click(toggleButton);
    
    expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'true');
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
  });

  it('toggles theme from dark to light', async () => {
    localStorageMock.getItem.mockReturnValue('true');
    
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');
    
    const toggleButton = screen.getByTestId('toggle-button');
    await user.click(toggleButton);
    
    expect(screen.getByTestId('theme-status')).toHaveTextContent('light');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'false');
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
  });

  it('saves theme changes to localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('false');
    
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const toggleButton = screen.getByTestId('toggle-button');
    await user.click(toggleButton);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'true');
  });

  it('throws error when useTheme is used outside ThemeProvider', () => {
    // コンソールエラーを抑制
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<ThrowErrorComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');
    
    consoleSpy.mockRestore();
  });

  it('applies dark class to documentElement when theme is dark', () => {
    localStorageMock.getItem.mockReturnValue('true');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
  });

  it('removes dark class from documentElement when theme is light', () => {
    localStorageMock.getItem.mockReturnValue('false');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
  });
});