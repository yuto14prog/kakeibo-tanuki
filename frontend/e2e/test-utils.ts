import { Page, expect } from '@playwright/test';

/**
 * E2Eテスト用ユーティリティ関数
 */

// テストデータ
export const testData = {
  cards: [
    { name: 'テストカード1', color: '#FF0000' },
    { name: 'テストカード2', color: '#00FF00' },
    { name: 'メインカード', color: '#0000FF' },
  ],
  categories: [
    { name: 'テスト食費', color: '#EF4444', isShared: false },
    { name: 'テスト交通費', color: '#3B82F6', isShared: false },
    { name: '共通支出', color: '#8B5CF6', isShared: true },
  ],
  expenses: [
    {
      amount: '1000',
      date: '2025-01-15',
      description: 'テスト支出1',
      card: 'テストカード1',
      category: 'テスト食費',
    },
    {
      amount: '2500',
      date: '2025-01-16',
      description: 'テスト支出2',
      card: 'テストカード2',
      category: 'テスト交通費',
    },
    {
      amount: '5000',
      date: '2025-01-17',
      description: '共通テスト支出',
      card: 'メインカード',
      category: '共通支出',
    },
  ],
};

/**
 * ページヘッダーをチェック
 */
export async function checkPageHeader(page: Page, title: string) {
  await expect(page.locator('h1')).toContainText(title);
}

/**
 * ナビゲーションをチェック
 */
export async function checkNavigation(page: Page) {
  // ナビゲーション要素が存在することを確認
  await expect(page.locator('nav')).toBeVisible();
  await expect(page.locator('a[href="/"]')).toBeVisible();
  await expect(page.locator('a[href="/expenses"]')).toBeVisible();
  await expect(page.locator('a[href="/cards"]')).toBeVisible();
  await expect(page.locator('a[href="/categories"]')).toBeVisible();
  await expect(page.locator('a[href="/reports"]')).toBeVisible();
}

/**
 * ローディング状態を待つ
 */
export async function waitForLoadingToComplete(page: Page) {
  // ページが読み込まれるまで待つ
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  
  // ローディングスピナーが消えるまで待つ（存在する場合のみ）
  try {
    await page.waitForSelector('[data-testid="loading"], .loading', { state: 'hidden', timeout: 2000 });
  } catch {
    // ローディングスピナーがない場合はエラーを無視
  }
  
  // 短い待機でDOMの安定化を待つ
  await page.waitForTimeout(500);
}

/**
 * テーマ切り替えボタンをクリック
 */
export async function toggleTheme(page: Page) {
  // テーマ切り替えボタンを探す（複数の可能性を考慮）
  const themeButton = page.locator('button[title*="テーマ"], button[title*="ダーク"], button[title*="ライト"]').first();
  await themeButton.click();
  // テーマ変更のアニメーション完了を待つ
  await page.waitForTimeout(500);
}

/**
 * ダークモードが適用されているかチェック
 */
export async function checkDarkMode(page: Page, isDark: boolean = true) {
  const html = page.locator('html');
  if (isDark) {
    await expect(html).toHaveClass(/dark/);
  } else {
    await expect(html).not.toHaveClass(/dark/);
  }
}

/**
 * モーダルが開いているかチェック
 */
export async function checkModalOpen(page: Page, title: string) {
  // モーダルの表示を待つ（z-50クラスのdivを探す）
  await page.waitForSelector('div.fixed.inset-0.z-50', { timeout: 5000 });
  const modal = page.locator('div.fixed.inset-0.z-50').first();
  await expect(modal).toBeVisible();
  
  // モーダル内のタイトル（h3要素）を確認
  const titleElement = modal.locator('h3');
  await expect(titleElement).toContainText(title);
}

/**
 * モーダルを閉じる
 */
export async function closeModal(page: Page) {
  // モーダル内の閉じるボタン（SVGアイコン付きボタン）をクリック
  const modal = page.locator('div.fixed.inset-0.z-50').first();
  const closeButton = modal.locator('button').filter({ has: page.locator('svg') }).first();
  
  if (await closeButton.count() > 0) {
    await closeButton.click();
  } else {
    // フォールバック: Escapeキーで閉じる
    await page.keyboard.press('Escape');
  }
  
  // モーダルが閉じることを確認
  await expect(page.locator('div.fixed.inset-0.z-50')).not.toBeVisible();
}

/**
 * 確認ダイアログをチェックして確認
 */
export async function confirmDialog(page: Page, expectedTitle: string) {
  // 確認ダイアログ（Modal内のConfirmDialog）の表示を待つ
  await page.waitForSelector('div.fixed.inset-0.z-50', { timeout: 5000 });
  
  const dialog = page.locator('div.fixed.inset-0.z-50').first();
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(expectedTitle);
  
  // 確認ボタンを探してクリック（2番目のボタンが確認ボタン）
  const buttons = dialog.locator('button');
  const buttonCount = await buttons.count();
  
  if (buttonCount >= 2) {
    // 通常、2番目のボタンが確認ボタン
    await buttons.nth(1).click();
  } else {
    // フォールバック: テキストで探す
    const confirmButton = dialog.locator('button:has-text("削除"), button:has-text("確認"), button:has-text("OK")');
    if (await confirmButton.count() > 0) {
      await confirmButton.first().click();
    }
  }
  
  // ダイアログが閉じることを確認
  await expect(dialog).not.toBeVisible();
}

/**
 * エラーメッセージをチェック
 */
export async function checkErrorMessage(page: Page, message: string) {
  await expect(page.locator('.alert-error')).toContainText(message);
}

/**
 * 成功メッセージをチェック
 */
export async function checkSuccessMessage(page: Page, message: string) {
  await expect(page.locator('.alert-success')).toContainText(message);
}

/**
 * フォーム入力ヘルパー
 */
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [field, value] of Object.entries(fields)) {
    await page.fill(`[name="${field}"], input[placeholder*="${field}"]`, value);
  }
}

/**
 * セレクトボックスから選択
 */
export async function selectOption(page: Page, selector: string, option: string) {
  await page.selectOption(selector, { label: option });
}

/**
 * テーブルの行数をチェック
 */
export async function checkTableRowCount(page: Page, tableSelector: string, expectedCount: number) {
  await expect(page.locator(`${tableSelector} tbody tr`)).toHaveCount(expectedCount);
}

/**
 * レスポンシブビューポートの設定
 */
export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
};