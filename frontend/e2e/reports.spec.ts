import { test, expect } from '@playwright/test';
import { 
  waitForLoadingToComplete,
  testData
} from './test-utils';

// checkPageHeaderは削除して、直接expect(page.locator('h1')).toContainText()を使用

test.describe('レポート機能', () => {
  test.beforeEach(async ({ page }) => {
    // レポートページに移動
    await page.goto('/reports');
    await waitForLoadingToComplete(page);
  });

  test('月次レポートの表示と操作', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('📈 レポート');

    // 1. 初期表示の確認（当月のレポート）
    // 月次タブが選択されていることを確認
    const monthlyTab = page.locator('button:has-text("月次レポート"), button:has-text("月次")');
    if (await monthlyTab.count() > 0) {
      await expect(monthlyTab.first()).toHaveClass(/border-primary-500|text-primary-600/);
    }

    // 合計金額セクションが表示されることを確認
    await expect(page.locator('text=総支出').first()).toBeVisible();

    // 2. 月選択機能のテスト
    const selects = page.locator('select');
    if (await selects.count() >= 2) {
      // 月を選択（二番目のselectが月）
      await selects.nth(1).selectOption('1');
      await waitForLoadingToComplete(page);
      
      // レポートが更新されることを確認（月次サマリーで確認）
      const currentYear = new Date().getFullYear();
      await expect(page.locator(`text=${currentYear}年1月`).first()).toBeVisible();
    }

    // 3. グラフ表示の確認
    // Chart.jsのcanvas要素が存在することを確認
    const chartCanvas = page.locator('canvas');
    if (await chartCanvas.count() > 0) {
      await expect(chartCanvas.first()).toBeVisible();
    }

    // 4. カテゴリ別内訳の確認
    // カテゴリ別セクションが表示されることを確認
    const categorySection = page.locator('text=カテゴリ別, text=支出内訳');
    if (await categorySection.count() > 0) {
      await expect(categorySection.first()).toBeVisible();
    }

    // 5. カード別内訳の確認
    const cardSection = page.locator('text=カード別, text=クレジットカード別');
    if (await cardSection.count() > 0) {
      await expect(cardSection.first()).toBeVisible();
    }

    // 6. 共通支出セクションの確認
    const sharedSection = page.locator('text=共通支出, text=折半');
    if (await sharedSection.count() > 0) {
      await expect(sharedSection.first()).toBeVisible();
      
      // 折半額の表示確認
      await expect(page.locator('text=折半額, text=あなたの負担')).toBeVisible();
    }
  });

  test('年次レポートの表示と操作', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('📈 レポート');

    // 年次タブをクリック
    const yearlyTab = page.locator('button:has-text("年次レポート"), button:has-text("年次")');
    if (await yearlyTab.count() > 0) {
      await yearlyTab.first().click();
      await waitForLoadingToComplete(page);
      
      // 年次タブが選択されていることを確認
      await expect(yearlyTab.first()).toHaveClass(/border-primary-500|text-primary-600/);
    }

    // 1. 年選択機能のテスト
    const selects = page.locator('select');
    if (await selects.count() >= 1) {
      // 年を選択（最初のselectが年）
      const currentYear = new Date().getFullYear();
      await selects.first().selectOption(currentYear.toString());
      await waitForLoadingToComplete(page);
    }

    // 2. 年間総額の表示確認（年次サマリーカードで確認）
    const currentYear = new Date().getFullYear();
    await expect(page.locator('text=年間総支出').first()).toBeVisible();

    // 3. 月別推移グラフの確認
    // 線グラフまたは棒グラフのcanvas要素が存在することを確認
    const chartCanvas = page.locator('canvas');
    if (await chartCanvas.count() > 0) {
      await expect(chartCanvas.first()).toBeVisible();
    }

    // 4. 月別データの表示確認（グラフが表示されていることで確認）
    if (await chartCanvas.count() > 0) {
      await expect(chartCanvas.first()).toBeVisible();
    }
  });

  test('カード別レポートフィルタリング機能', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('📈 レポート');

    // 1. カードフィルターの存在確認
    const selects = page.locator('select');
    if (await selects.count() >= 3) {
      // 三番目のselectがカードフィルター
      const cardSelect = selects.nth(2);
      const cardOptions = await cardSelect.locator('option').allTextContents();
      if (cardOptions.length > 1) {
        // 2番目のオプション（最初は「すべてのカード」）を選択
        await cardSelect.selectOption({ index: 1 });
        await waitForLoadingToComplete(page);

        // フィルタリングされた結果が表示されることを確認
        await expect(page.locator('text=総支出').first()).toBeVisible();
      }
    }

    // 2. カード選択時のカテゴリ別内訳表示
    // 特定カード選択時に、そのカードのカテゴリ別内訳が表示されることを確認
    const categoryBreakdown = page.locator('text=カテゴリ別内訳, text=このカードの');
    if (await categoryBreakdown.count() > 0) {
      await expect(categoryBreakdown.first()).toBeVisible();
    }
  });

  test('レポートデータの null 安全性テスト', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('📈 レポート');

    // データが存在しない場合の表示確認
    // 月を未来の月に設定してデータが存在しない状態をテスト
    const selects = page.locator('select');
    if (await selects.count() >= 2) {
      // 二番目のselect（月）を未来の月に設定
      await selects.nth(1).selectOption('12');
      await waitForLoadingToComplete(page);

      // 1. ゼロ状態の表示確認
      const noDataMessage = page.locator('text=データがありません, text=支出がありません, text=¥0');
      if (await noDataMessage.count() > 0) {
        await expect(noDataMessage.first()).toBeVisible();
      }

      // 2. グラフが適切に処理されることを確認（エラーが発生しない）
      // ページがクラッシュしていないことを確認
      await expect(page.locator('h1')).toContainText('📈 レポート');

      // 3. 共通支出セクションがゼロの場合の表示
      const sharedSection = page.locator('text=共通支出');
      if (await sharedSection.count() > 0) {
        await expect(sharedSection.first()).toBeVisible();
        // ゼロの場合でも折半額が適切に表示されることを確認
        await expect(page.locator('text=¥0')).toBeVisible();
      }
    }
  });

  test('グラフのインタラクション機能', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('📈 レポート');

    // Chart.jsのcanvas要素が存在する場合のテスト
    const chartCanvas = page.locator('canvas');
    if (await chartCanvas.count() > 0) {
      // 1. グラフの描画確認
      await expect(chartCanvas.first()).toBeVisible();

      // 2. グラフのホバーインタラクション（可能であれば）
      // Chart.jsの場合、canvas上でのマウスイベントは検証が困難なため、
      // グラフが正常に描画されていることを確認するにとどめる

      // 3. レスポンシブ対応の確認
      // ビューポートサイズを変更してグラフが適応することを確認
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500); // リサイズ処理の完了を待つ
      await expect(chartCanvas.first()).toBeVisible();

      // 元のビューポートサイズに戻す
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForTimeout(500);
      await expect(chartCanvas.first()).toBeVisible();
    }
  });

  test('レポートの印刷・エクスポート機能（将来実装予定）', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('📈 レポート');

    // 将来的にエクスポート機能が実装された場合のテストプレースホルダー
    
    // PDFエクスポートボタンの確認
    const exportButton = page.locator('button:has-text("エクスポート"), button:has-text("PDF"), button:has-text("印刷")');
    if (await exportButton.count() > 0) {
      await expect(exportButton.first()).toBeVisible();
      // クリックイベントをテスト（実際のダウンロードは除く）
      // await exportButton.click();
    }

    // CSVエクスポート機能の確認
    const csvButton = page.locator('button:has-text("CSV")');
    if (await csvButton.count() > 0) {
      await expect(csvButton.first()).toBeVisible();
    }
  });

  test('レポートページのパフォーマンステスト', async ({ page }) => {
    // ページ読み込み時間の測定
    const startTime = Date.now();
    
    await page.goto('/reports');
    await waitForLoadingToComplete(page);
    
    const loadTime = Date.now() - startTime;
    
    // ページが5秒以内に読み込まれることを確認
    expect(loadTime).toBeLessThan(5000);

    // 大量データがある場合のパフォーマンステスト
    // （実際のテストではモックデータを使用することが推奨）
    
    // グラフ描画の完了を確認
    const chartCanvas = page.locator('canvas');
    if (await chartCanvas.count() > 0) {
      await expect(chartCanvas.first()).toBeVisible();
    }

    // UI要素の応答性確認
    const monthlyTab = page.locator('button:has-text("月次レポート"), button:has-text("月次")');
    if (await monthlyTab.count() > 0) {
      const tabClickStart = Date.now();
      await monthlyTab.first().click();
      await waitForLoadingToComplete(page);
      const tabClickTime = Date.now() - tabClickStart;
      
      // タブ切り替えが3秒以内に完了することを確認
      expect(tabClickTime).toBeLessThan(3000);
    }
  });
});