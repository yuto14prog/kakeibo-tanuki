import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Header from '../../components/Header';
import { ThemeProvider } from '../../contexts/ThemeContext';

// useLocation のモック用に、現在のパスを設定可能にする
const renderWithRouter = (initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('Header', () => {
  it('should render app title', () => {
    renderWithRouter();
    
    expect(screen.getByText('家計簿たぬき')).toBeInTheDocument();
    expect(screen.getByText('🦝')).toBeInTheDocument();
  });

  it('should render all navigation items', () => {
    renderWithRouter();
    
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
    expect(screen.getByText('支出一覧')).toBeInTheDocument();
    expect(screen.getByText('支出登録')).toBeInTheDocument();
    expect(screen.getByText('カード管理')).toBeInTheDocument();
    expect(screen.getByText('カテゴリ管理')).toBeInTheDocument();
    expect(screen.getByText('レポート')).toBeInTheDocument();
  });

  it('should render all navigation icons', () => {
    renderWithRouter();
    
    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('📋')).toBeInTheDocument();
    expect(screen.getByText('➕')).toBeInTheDocument();
    expect(screen.getByText('💳')).toBeInTheDocument();
    expect(screen.getByText('🏷️')).toBeInTheDocument();
    expect(screen.getByText('📈')).toBeInTheDocument();
  });

  it('should highlight active navigation item', () => {
    renderWithRouter(['/cards']);
    
    const cardsLink = screen.getByRole('link', { name: /💳 カード管理/ });
    expect(cardsLink).toHaveClass('bg-primary-100', 'text-primary-700');
    
    const dashboardLink = screen.getByRole('link', { name: /📊 ダッシュボード/ });
    expect(dashboardLink).not.toHaveClass('bg-primary-100', 'text-primary-700');
  });

  it('should render theme toggle button', () => {
    renderWithRouter();
    
    // テーマ切り替えボタンが存在することを確認（デスクトップ版）
    const themeButtons = screen.getAllByRole('button');
    expect(themeButtons.length).toBeGreaterThan(0);
    
    // デスクトップのテーマボタンを探す
    const desktopThemeButton = themeButtons.find(button => 
      button.classList.contains('ml-4')
    );
    expect(desktopThemeButton).toBeInTheDocument();
    
    // SVG アイコンが存在することを確認
    const svgIcon = desktopThemeButton?.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
  });

  it('should toggle theme when theme button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter();
    
    // デスクトップのテーマボタンを取得
    const themeButtons = screen.getAllByRole('button');
    const themeButton = themeButtons.find(button => 
      button.classList.contains('ml-4')
    ) as HTMLElement;
    
    // 初期状態では light テーマ
    expect(document.documentElement).not.toHaveClass('dark');
    
    // テーマ切り替えボタンをクリック
    await user.click(themeButton);
    
    // dark クラスが追加されることを確認
    expect(document.documentElement).toHaveClass('dark');
    
    // もう一度クリックして light に戻る
    await user.click(themeButton);
    
    // dark クラスが削除されることを確認
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('should render mobile menu toggle button on small screens', () => {
    // モバイル画面を想定してレンダリング
    renderWithRouter();
    
    // モバイルメニューボタンを探す（通常はハンバーガーメニュー）
    // ここでは、実際のモバイルメニューの実装に依存します
    // 現在のコードからはモバイルメニューの詳細が見えないため、
    // この部分は実装に合わせて調整が必要です
  });

  it('should have correct navigation links', () => {
    renderWithRouter();
    
    const expectedLinks = [
      { text: 'ダッシュボード', href: '/' },
      { text: '支出一覧', href: '/expenses' },
      { text: '支出登録', href: '/expenses/new' },
      { text: 'カード管理', href: '/cards' },
      { text: 'カテゴリ管理', href: '/categories' },
      { text: 'レポート', href: '/reports' },
    ];

    expectedLinks.forEach(({ text, href }) => {
      const link = screen.getByRole('link', { name: new RegExp(text) });
      expect(link).toHaveAttribute('href', href);
    });
  });

  it('should have app logo link to home', () => {
    renderWithRouter();
    
    const logoLink = screen.getByRole('link', { name: /🦝 家計簿たぬき/ });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('should apply dark theme styles when in dark mode', () => {
    // localStorage に dark テーマを設定
    const localStorageMock = {
      getItem: jest.fn(() => 'true'),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    renderWithRouter();
    
    // ヘッダー要素が dark テーマのクラスを持つことを確認
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('dark:bg-gray-900', 'dark:border-gray-600');
  });

  it('should show correct active state for different routes', () => {
    const routes = [
      { path: '/', expectedActive: 'ダッシュボード' },
      { path: '/expenses', expectedActive: '支出一覧' },
      { path: '/expenses/new', expectedActive: '支出登録' },
      { path: '/cards', expectedActive: 'カード管理' },
      { path: '/categories', expectedActive: 'カテゴリ管理' },
      { path: '/reports', expectedActive: 'レポート' },
    ];

    routes.forEach(({ path, expectedActive }) => {
      const { unmount } = renderWithRouter([path]);
      
      const activeLink = screen.getByRole('link', { name: new RegExp(expectedActive) });
      expect(activeLink).toHaveClass('bg-primary-100', 'text-primary-700');
      
      unmount();
    });
  });

  it('should have accessible roles and labels', () => {
    renderWithRouter();
    
    // ヘッダーが適切な role を持つことを確認
    expect(screen.getByRole('banner')).toBeInTheDocument();
    
    // ナビゲーションが適切な role を持つことを確認
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    
    // すべてのリンクが適切な role を持つことを確認
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(7); // ロゴ + 6つのナビゲーションリンク
    
    // ボタンが適切な role を持つことを確認（複数のボタンがある場合）
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2); // デスクトップ + モバイルのテーマボタン
  });
});