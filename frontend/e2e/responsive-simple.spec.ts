import { test, expect } from '@playwright/test';
import { waitForLoadingToComplete, viewports } from './test-utils';

test.describe('レスポンシブデザイン（基本テスト）', () => {
  
  test.describe('モバイルビューポート', () => {
    test.use({ viewport: viewports.mobile });

    test('モバイルでの基本表示', async ({ page }) => {
      await page.goto('/');
      await waitForLoadingToComplete(page);

      // ページが正常に表示されることを確認
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('header').first()).toBeVisible();

      // カード管理ページでの表示確認
      await page.goto('/cards');
      await waitForLoadingToComplete(page);
      await expect(page.locator('h1')).toContainText('カード管理');

      // 追加ボタンが表示されることを確認
      const addButton = page.locator('button:has-text("新しいカードを追加"), button:has-text("カードを追加")');
      await expect(addButton.first()).toBeVisible();
    });

    test('モバイルでのモーダル表示', async ({ page }) => {
      await page.goto('/cards');
      await waitForLoadingToComplete(page);

      // 追加ボタンをクリック
      const addButton = page.locator('button:has-text("新しいカードを追加"), button:has-text("カードを追加")');
      await addButton.first().click();

      // モーダルが表示されることを確認
      const modal = page.locator('div.fixed.inset-0.z-50');
      await expect(modal).toBeVisible();

      // モーダル内のフォーム要素が表示されることを確認
      const nameInput = modal.locator('input[type="text"]');
      await expect(nameInput).toBeVisible();

      // モーダルを閉じる
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('タブレットビューポート', () => {
    test.use({ viewport: viewports.tablet });

    test('タブレットでの基本表示', async ({ page }) => {
      await page.goto('/');
      await waitForLoadingToComplete(page);

      // ページが正常に表示されることを確認
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('header').first()).toBeVisible();

      // カード管理ページでの表示確認
      await page.goto('/cards');
      await waitForLoadingToComplete(page);
      await expect(page.locator('h1')).toContainText('カード管理');
    });
  });

  test.describe('デスクトップビューポート', () => {
    test.use({ viewport: viewports.desktop });

    test('デスクトップでの基本表示', async ({ page }) => {
      await page.goto('/');
      await waitForLoadingToComplete(page);

      // ページが正常に表示されることを確認
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('header').first()).toBeVisible();

      // ナビゲーションリンクが表示されることを確認
      const navLinks = page.locator('header a');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(0);

      // カード管理ページでの表示確認
      await page.goto('/cards');
      await waitForLoadingToComplete(page);
      await expect(page.locator('h1')).toContainText('カード管理');
    });

    test('デスクトップでのモーダル表示', async ({ page }) => {
      await page.goto('/cards');
      await waitForLoadingToComplete(page);

      // 追加ボタンをクリック
      const addButton = page.locator('button:has-text("新しいカードを追加"), button:has-text("カードを追加")');
      await addButton.first().click();

      // モーダルが表示されることを確認
      const modal = page.locator('div.fixed.inset-0.z-50');
      await expect(modal).toBeVisible();

      // モーダルを閉じる
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('ビューポート切り替えテスト', () => {
    test('動的なレスポンシブ対応確認', async ({ page }) => {
      // デスクトップサイズで開始
      await page.setViewportSize(viewports.desktop);
      await page.goto('/cards');
      await waitForLoadingToComplete(page);

      // デスクトップでの表示確認
      await expect(page.locator('h1')).toContainText('カード管理');

      // モバイルサイズに変更
      await page.setViewportSize(viewports.mobile);
      await page.waitForTimeout(500); // レイアウト調整を待つ

      // モバイルでも表示されることを確認
      await expect(page.locator('h1')).toContainText('カード管理');

      // デスクトップサイズに戻す
      await page.setViewportSize(viewports.desktop);
      await page.waitForTimeout(500);

      // デスクトップレイアウトに戻ることを確認
      await expect(page.locator('h1')).toContainText('カード管理');
    });
  });
});