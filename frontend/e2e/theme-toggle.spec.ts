import { test, expect } from '@playwright/test';
import { 
  checkPageHeader, 
  waitForLoadingToComplete
} from './test-utils';

test.describe('ダークモード・テーマ切り替え機能', () => {
  test.beforeEach(async ({ page }) => {
    // ダッシュボードページから開始
    await page.goto('/');
    await waitForLoadingToComplete(page);
  });

  test('テーマ切り替えボタンの動作確認', async ({ page }) => {
    // テーマ切り替えボタンの存在確認
    const themeToggleButton = page.locator('button[title*="テーマ"], button[title*="ダーク"], button[title*="ライト"]');
    await expect(themeToggleButton.first()).toBeVisible();

    // 初期状態の確認
    const html = page.locator('html');
    const initialClass = await html.getAttribute('class');
    const isInitiallyDark = initialClass?.includes('dark') || false;

    // テーマを切り替え
    await themeToggleButton.first().click();
    await page.waitForTimeout(500);

    // テーマが変更されたことを確認
    const afterToggleClass = await html.getAttribute('class');
    const isAfterToggleDark = afterToggleClass?.includes('dark') || false;
    
    // 初期状態と逆になっていることを確認
    expect(isAfterToggleDark).toBe(!isInitiallyDark);

    // もう一度切り替えて元に戻ることを確認
    await themeToggleButton.first().click();
    await page.waitForTimeout(500);

    const afterSecondToggleClass = await html.getAttribute('class');
    const isAfterSecondToggleDark = afterSecondToggleClass?.includes('dark') || false;
    
    expect(isAfterSecondToggleDark).toBe(isInitiallyDark);
  });

  test('ダークモードでの UI 表示確認', async ({ page }) => {
    // テーマ切り替えボタンを探す
    const themeToggleButton = page.locator('button[title*="テーマ"], button[title*="ダーク"], button[title*="ライト"]');
    
    // 確実にダークモードにするため、現在の状態を確認してから切り替え
    const html = page.locator('html');
    const currentClass = await html.getAttribute('class');
    const isCurrentlyDark = currentClass?.includes('dark') || false;
    
    if (!isCurrentlyDark) {
      await themeToggleButton.first().click();
      await page.waitForTimeout(500);
    }

    // ダークモードが適用されていることを確認
    const finalClass = await html.getAttribute('class');
    expect(finalClass).toContain('dark');

    // ヘッダーが表示されることを確認
    const header = page.locator('header, nav');
    await expect(header.first()).toBeVisible();

    // メインコンテンツが表示されることを確認
    const mainContent = page.locator('main, h1');
    await expect(mainContent.first()).toBeVisible();
  });

  test('テーマ設定の永続化テスト', async ({ page }) => {
    // 初期状態を確認
    const html = page.locator('html');
    const initialClass = await html.getAttribute('class');
    const isInitiallyDark = initialClass?.includes('dark') || false;

    // テーマを切り替え
    const themeToggleButton = page.locator('button[title*="テーマ"], button[title*="ダーク"], button[title*="ライト"]');
    await themeToggleButton.first().click();
    await page.waitForTimeout(500);

    // 変更後の状態を確認
    const afterToggleClass = await html.getAttribute('class');
    const isAfterToggleDark = afterToggleClass?.includes('dark') || false;
    expect(isAfterToggleDark).toBe(!isInitiallyDark);

    // ページをリロード
    await page.reload();
    await waitForLoadingToComplete(page);

    // テーマ設定が保持されていることを確認
    const afterReloadClass = await html.getAttribute('class');
    const isAfterReloadDark = afterReloadClass?.includes('dark') || false;
    expect(isAfterReloadDark).toBe(isAfterToggleDark);

    // 元に戻しておく
    if (isAfterToggleDark !== isInitiallyDark) {
      const otherPageThemeButton = page.locator('button[title*="テーマ"], button[title*="ダーク"], button[title*="ライト"]');
      await otherPageThemeButton.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('アクセシビリティ: テーマ切り替えボタンの操作性', async ({ page }) => {
    const themeToggleButton = page.locator('button[title*="テーマ"], button[title*="ダーク"], button[title*="ライト"]');

    // キーボードでのアクセス確認
    await themeToggleButton.first().focus();
    await expect(themeToggleButton.first()).toBeFocused();

    // Enterキーでの操作確認
    const html = page.locator('html');
    const beforeKeyPress = await html.getAttribute('class');
    
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    const afterKeyPress = await html.getAttribute('class');
    
    // キーボード操作でもテーマが切り替わることを確認
    expect(beforeKeyPress).not.toEqual(afterKeyPress);

    // ボタンのtitle属性確認
    const title = await themeToggleButton.first().getAttribute('title');
    expect(title).toBeTruthy();
    expect(title).toMatch(/テーマ|ダーク|ライト/);
  });
});