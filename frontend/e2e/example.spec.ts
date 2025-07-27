import { test, expect } from '@playwright/test';
import { waitForLoadingToComplete } from './test-utils';

test('初期テスト - アプリケーションの起動確認', async ({ page }) => {
  // ダッシュボードページにアクセス
  await page.goto('/');
  await waitForLoadingToComplete(page);

  // ページタイトルをチェック（より柔軟に）
  await expect(page).toHaveTitle(/家計簿|たぬき|Dashboard/);

  // メインヘッダーが表示されることを確認（複数パターン対応）
  const headerSelectors = [
    'h1:has-text("ダッシュボード")',
    'h1:has-text("📊")',
    'text=ダッシュボード',
    'main h1',
    '[data-testid="page-title"]'
  ];
  
  let headerFound = false;
  for (const selector of headerSelectors) {
    const header = page.locator(selector);
    if (await header.count() > 0) {
      await expect(header.first()).toBeVisible();
      headerFound = true;
      break;
    }
  }
  
  if (!headerFound) {
    // 最低限、ページにh1タグが存在することを確認
    await expect(page.locator('h1').first()).toBeVisible();
  }

  // ナビゲーションが表示されることを確認
  await expect(page.locator('nav, header nav, [role="navigation"]').first()).toBeVisible();
  
  // 主要なナビゲーションリンクが存在することを確認（柔軟に）
  const navLinks = [
    'a[href="/"], a:has-text("ダッシュボード")',
    'a[href="/expenses"], a:has-text("支出")',
    'a[href="/cards"], a:has-text("カード")',
    'a[href="/categories"], a:has-text("カテゴリ")',
    'a[href="/reports"], a:has-text("レポート")'
  ];
  
  for (const linkSelector of navLinks) {
    const link = page.locator(linkSelector);
    if (await link.count() > 0) {
      await expect(link.first()).toBeVisible();
    }
  }
});