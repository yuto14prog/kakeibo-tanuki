import { test, expect } from '@playwright/test';
import { waitForLoadingToComplete, checkModalOpen, closeModal } from './test-utils';

test.describe('カード管理機能（基本テスト）', () => {
  test.beforeEach(async ({ page }) => {
    // カード管理ページに移動
    await page.goto('/cards');
    await waitForLoadingToComplete(page);
  });

  test('カード管理ページの基本表示', async ({ page }) => {
    // ページタイトルの確認
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toContainText('カード管理');

    // 「新しいカードを追加」ボタンの存在確認
    const addButton = page.locator('button:has-text("新しいカードを追加"), button:has-text("カードを追加")');
    await expect(addButton.first()).toBeVisible();
  });

  test('カード追加モーダルの開閉', async ({ page }) => {
    // 追加ボタンをクリックしてモーダルを開く
    const addButton = page.locator('button:has-text("新しいカードを追加"), button:has-text("カードを追加")');
    await addButton.first().click();

    // モーダルが開くことを確認
    await checkModalOpen(page, 'カードを追加');

    // モーダルを閉じる
    await closeModal(page);
  });

  test('カード追加フォームの基本操作', async ({ page }) => {
    // 追加ボタンをクリック
    const addButton = page.locator('button:has-text("新しいカードを追加"), button:has-text("カードを追加")');
    await addButton.first().click();

    // モーダルが開くのを待つ
    await page.waitForSelector('div.fixed.inset-0.z-50', { timeout: 5000 });
    const modal = page.locator('div.fixed.inset-0.z-50').first();

    // フォーム要素の存在確認
    const nameInput = modal.locator('input[type="text"]');
    await expect(nameInput).toBeVisible();

    const colorInput = modal.locator('input[type="color"]');
    await expect(colorInput).toBeVisible();

    // カラーピッカーボタンの存在確認（w-12 h-12クラスを持つボタン）
    const colorButtons = modal.locator('button.w-12.h-12');
    const colorButtonCount = await colorButtons.count();
    expect(colorButtonCount).toBeGreaterThan(5); // 複数のカラーボタンがあることを確認

    // フォームに値を入力
    await nameInput.fill('テストカード');
    await expect(nameInput).toHaveValue('テストカード');

    // カラーボタンをクリック
    await colorButtons.first().click();

    // 送信ボタンの存在確認
    const submitButton = modal.locator('button:has-text("追加")');
    await expect(submitButton).toBeVisible();

    // モーダルを閉じる
    await closeModal(page);
  });

  test('空のカード一覧状態の確認', async ({ page }) => {
    // カードが存在しない場合のメッセージまたは空の状態を確認
    const emptyMessage = page.locator('text=カードがありません, text=最初のクレジットカードを追加');
    const cardItems = page.locator('.card, [class*="card"]');
    
    const cardCount = await cardItems.count();
    const hasEmptyMessage = await emptyMessage.count() > 0;
    
    // カードが存在するか、空のメッセージが表示されているかのいずれかであることを確認
    expect(cardCount > 0 || hasEmptyMessage).toBeTruthy();
  });

  test('ナビゲーションの確認', async ({ page }) => {
    // 他のページへのナビゲーションが機能することを確認
    const dashboardLink = page.locator('a[href="/"], a:has-text("ダッシュボード")');
    if (await dashboardLink.count() > 0) {
      await dashboardLink.first().click();
      await waitForLoadingToComplete(page);
      
      // ダッシュボードページに移動したことを確認
      await expect(page.locator('h1')).toContainText('ダッシュボード');
      
      // カード管理ページに戻る
      await page.goto('/cards');
      await waitForLoadingToComplete(page);
      await expect(page.locator('h1')).toContainText('カード管理');
    }
  });
});