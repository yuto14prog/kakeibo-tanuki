import { test, expect } from '@playwright/test';
import { 
  waitForLoadingToComplete,
  viewports,
  testData
} from './test-utils';

test.describe('レスポンシブデザイン', () => {
  
  test.describe('モバイルビューポート', () => {
    test.use({ viewport: viewports.mobile });

    test('モバイルでのナビゲーション動作', async ({ page }) => {
      await page.goto('/');
      await waitForLoadingToComplete(page);

      // 1. ハンバーガーメニューの存在確認
      const hamburgerMenu = page.locator('button[aria-label*="メニュー"], button:has-text("☰"), .hamburger, [data-testid="mobile-menu-button"]');
      if (await hamburgerMenu.count() > 0) {
        await expect(hamburgerMenu.first()).toBeVisible();

        // 2. ハンバーガーメニューをクリックしてナビゲーションを開く
        await hamburgerMenu.first().click();
        
        // 3. モバイルナビゲーションメニューが表示されることを確認
        const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav, nav.mobile');
        if (await mobileNav.count() > 0) {
          await expect(mobileNav.first()).toBeVisible();
          
          // 4. ナビゲーションリンクが表示されることを確認
          await expect(page.locator('a[href="/"], a:has-text("ダッシュボード")')).toBeVisible();
          await expect(page.locator('a[href="/expenses"], a:has-text("支出")')).toBeVisible();
          await expect(page.locator('a[href="/cards"], a:has-text("カード")')).toBeVisible();
          await expect(page.locator('a[href="/categories"], a:has-text("カテゴリ")')).toBeVisible();
          await expect(page.locator('a[href="/reports"], a:has-text("レポート")')).toBeVisible();

          // 5. メニューを閉じる
          await hamburgerMenu.first().click();
          await expect(mobileNav.first()).not.toBeVisible();
        }
      } else {
        // ハンバーガーメニューがない場合でも、モバイルでは通常のnavは非表示
        // デスクトップナビゲーションは hidden md:flex クラスによりモバイルでは非表示
        const desktopNav = page.locator('nav.hidden.md\\:flex');
        if (await desktopNav.count() > 0) {
          await expect(desktopNav).not.toBeVisible();
        }
      }
    });

    test('モバイルでのカード管理画面', async ({ page }) => {
      await page.goto('/cards');
      await waitForLoadingToComplete(page);
      // ページタイトルの確認
      await expect(page.locator('h1')).toContainText('💳 カード管理');

      // 1. カード追加ボタンが適切に表示されることを確認
      const addButton = page.locator('button:has-text("新しいカードを追加"), button:has-text("追加")');
      await expect(addButton.first()).toBeVisible();

      // 2. カードグリッドがモバイルレイアウトに適応していることを確認
      // （1列表示になるなど）
      const cardGrid = page.locator('.grid, [class*="grid"]');
      if (await cardGrid.count() > 0) {
        await expect(cardGrid.first()).toBeVisible();
      }

      // 3. モーダルがモバイル画面に適応していることを確認
      await addButton.first().click();
      const modal = page.locator('[data-testid="modal"], .modal');
      if (await modal.count() > 0) {
        await expect(modal.first()).toBeVisible();
        
        // モーダルが画面いっぱいに表示されるか、適切なサイズで表示されることを確認
        const modalBox = modal.first();
        const boundingBox = await modalBox.boundingBox();
        
        if (boundingBox) {
          // モーダルが画面幅の大部分を占めることを確認
          expect(boundingBox.width).toBeGreaterThan(300);
        }

        // モーダルを閉じる
        const closeButton = page.locator('[data-testid="modal-close"], button:has-text("✕"), button:has-text("閉じる")');
        if (await closeButton.count() > 0) {
          await closeButton.first().click();
        }
      }
    });

    test('モバイルでの支出登録フォーム', async ({ page }) => {
      await page.goto('/expenses');
      await waitForLoadingToComplete(page);

      const addButton = page.locator('button:has-text("新しい支出を追加"), a:has-text("新しい支出")');
      if (await addButton.count() > 0) {
        await addButton.first().click();
        
        // 支出登録ページに移動するか、モーダルが開くかを確認
        await page.waitForTimeout(500);
        
        // フォーム要素がモバイルで適切に表示されることを確認
        const amountInput = page.locator('input[name="amount"], input[type="number"]');
        const dateInput = page.locator('input[name="date"], input[type="date"]');
        
        if (await amountInput.count() > 0) {
          await expect(amountInput.first()).toBeVisible();
          
          // モバイルでフォーム入力が正常に動作することを確認
          await amountInput.first().fill('1000');
          await expect(amountInput.first()).toHaveValue('1000');
        }
        
        if (await dateInput.count() > 0) {
          await expect(dateInput.first()).toBeVisible();
        }
      }
    });

    test('モバイルでのレポート画面', async ({ page }) => {
      await page.goto('/reports');
      await waitForLoadingToComplete(page);
      // ページタイトルの確認
      await expect(page.locator('h1')).toContainText('📈 レポート');

      // 1. グラフがモバイルサイズに適応していることを確認
      const canvas = page.locator('canvas');
      if (await canvas.count() > 0) {
        await expect(canvas.first()).toBeVisible();
        
        const canvasBox = await canvas.first().boundingBox();
        if (canvasBox) {
          // グラフがビューポート内に収まっていることを確認
          expect(canvasBox.width).toBeLessThanOrEqual(viewports.mobile.width);
        }
      }

      // 2. タブナビゲーションがモバイルで適切に動作することを確認
      const monthlyTab = page.locator('button:has-text("月次"), [role="tab"]:has-text("月次")');
      const yearlyTab = page.locator('button:has-text("年次"), [role="tab"]:has-text("年次")');
      
      if (await monthlyTab.count() > 0 && await yearlyTab.count() > 0) {
        await monthlyTab.first().click();
        await waitForLoadingToComplete(page);
        
        await yearlyTab.first().click();
        await waitForLoadingToComplete(page);
      }

      // 3. フィルター要素がモバイルで適切に表示されることを確認
      const filters = page.locator('select, input[type="month"], input[type="date"]');
      if (await filters.count() > 0) {
        await expect(filters.first()).toBeVisible();
      }
    });
  });

  test.describe('タブレットビューポート', () => {
    test.use({ viewport: viewports.tablet });

    test('タブレットでのレイアウト確認', async ({ page }) => {
      await page.goto('/');
      await waitForLoadingToComplete(page);
      // ページタイトルの確認
      await expect(page.locator('h1')).toContainText('ダッシュボード');

      // 1. ナビゲーションがタブレットサイズに適応していることを確認
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();

      // 2. カード管理ページでのグリッドレイアウト確認
      await page.goto('/cards');
      await waitForLoadingToComplete(page);

      const cardGrid = page.locator('.grid, [class*="grid"]');
      if (await cardGrid.count() > 0) {
        await expect(cardGrid.first()).toBeVisible();
        
        // タブレットでは2列程度のグリッドになることを期待
        const cards = page.locator('.card, [class*="card"]');
        if (await cards.count() >= 2) {
          const firstCard = await cards.first().boundingBox();
          const secondCard = await cards.nth(1).boundingBox();
          
          if (firstCard && secondCard) {
            // 2つのカードが横並びになっていることを確認
            expect(Math.abs(firstCard.y - secondCard.y)).toBeLessThan(50);
          }
        }
      }
    });

    test('タブレットでのモーダル表示', async ({ page }) => {
      await page.goto('/cards');
      await waitForLoadingToComplete(page);

      const addButton = page.locator('button:has-text("新しいカードを追加")');
      if (await addButton.count() > 0) {
        await addButton.first().click();
        
        const modal = page.locator('[data-testid="modal"], .modal');
        if (await modal.count() > 0) {
          await expect(modal.first()).toBeVisible();
          
          // タブレットサイズでモーダルが適切なサイズで表示されることを確認
          const modalBox = await modal.first().boundingBox();
          if (modalBox) {
            expect(modalBox.width).toBeLessThan(viewports.tablet.width * 0.9);
            expect(modalBox.width).toBeGreaterThan(400);
          }

          const closeButton = page.locator('[data-testid="modal-close"]');
          if (await closeButton.count() > 0) {
            await closeButton.first().click();
          }
        }
      }
    });
  });

  test.describe('デスクトップビューポート', () => {
    test.use({ viewport: viewports.desktop });

    test('デスクトップでのフルレイアウト確認', async ({ page }) => {
      await page.goto('/');
      await waitForLoadingToComplete(page);
      // ページタイトルの確認
      await expect(page.locator('h1')).toContainText('ダッシュボード');

      // 1. フルナビゲーションが表示されることを確認
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();

      // ハンバーガーメニューが非表示であることを確認
      const hamburgerMenu = page.locator('button[aria-label*="メニュー"], .hamburger');
      if (await hamburgerMenu.count() > 0) {
        await expect(hamburgerMenu.first()).not.toBeVisible();
      }

      // 2. カード管理ページでのグリッドレイアウト確認
      await page.goto('/cards');
      await waitForLoadingToComplete(page);

      const cardGrid = page.locator('.grid, [class*="grid"]');
      if (await cardGrid.count() > 0) {
        await expect(cardGrid.first()).toBeVisible();
        
        // デスクトップでは3列以上のグリッドになることを期待
        const cards = page.locator('.card, [class*="card"]');
        if (await cards.count() >= 3) {
          const firstCard = await cards.first().boundingBox();
          const thirdCard = await cards.nth(2).boundingBox();
          
          if (firstCard && thirdCard) {
            // 3つのカードが横並びになっていることを確認
            expect(Math.abs(firstCard.y - thirdCard.y)).toBeLessThan(50);
          }
        }
      }

      // 3. レポートページでのデスクトップレイアウト確認
      await page.goto('/reports');
      await waitForLoadingToComplete(page);

      const canvas = page.locator('canvas');
      if (await canvas.count() > 0) {
        await expect(canvas.first()).toBeVisible();
        
        // デスクトップでグラフが大きく表示されることを確認
        const canvasBox = await canvas.first().boundingBox();
        if (canvasBox) {
          expect(canvasBox.width).toBeGreaterThanOrEqual(384);
        }
      }
    });

    test('デスクトップでのモーダル表示', async ({ page }) => {
      await page.goto('/cards');
      await waitForLoadingToComplete(page);

      const addButton = page.locator('button:has-text("新しいカードを追加")');
      if (await addButton.count() > 0) {
        await addButton.first().click();
        
        const modal = page.locator('[data-testid="modal"], .modal');
        if (await modal.count() > 0) {
          await expect(modal.first()).toBeVisible();
          
          // デスクトップでモーダルが中央に適切なサイズで表示されることを確認
          const modalBox = await modal.first().boundingBox();
          if (modalBox) {
            expect(modalBox.width).toBeLessThan(600);
            expect(modalBox.width).toBeGreaterThan(400);
            
            // モーダルが画面中央に表示されることを確認
            const viewportWidth = viewports.desktop.width;
            const centerX = viewportWidth / 2;
            const modalCenterX = modalBox.x + modalBox.width / 2;
            expect(Math.abs(modalCenterX - centerX)).toBeLessThan(100);
          }

          const closeButton = page.locator('[data-testid="modal-close"]');
          if (await closeButton.count() > 0) {
            await closeButton.first().click();
          }
        }
      }
    });
  });

  test.describe('ビューポート切り替えテスト', () => {
    test('動的なレスポンシブ対応確認', async ({ page }) => {
      // 1. デスクトップサイズで開始
      await page.setViewportSize(viewports.desktop);
      await page.goto('/cards');
      await waitForLoadingToComplete(page);

      // デスクトップレイアウトの確認
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();

      // 2. タブレットサイズに変更
      await page.setViewportSize(viewports.tablet);
      await page.waitForTimeout(500); // レイアウト調整を待つ

      // タブレットレイアウトへの適応を確認
      await expect(nav).toBeVisible();

      // 3. モバイルサイズに変更
      await page.setViewportSize(viewports.mobile);
      await page.waitForTimeout(500);

      // モバイルレイアウトへの適応を確認
      const hamburgerMenu = page.locator('button[aria-label*="メニュー"], .hamburger');
      if (await hamburgerMenu.count() > 0) {
        await expect(hamburgerMenu.first()).toBeVisible();
      }

      // 4. デスクトップサイズに戻す
      await page.setViewportSize(viewports.desktop);
      await page.waitForTimeout(500);

      // デスクトップレイアウトに戻ることを確認
      await expect(nav).toBeVisible();
      if (await hamburgerMenu.count() > 0) {
        await expect(hamburgerMenu.first()).not.toBeVisible();
      }
    });
  });

  test.describe('画面向き変更テスト', () => {
    test('ランドスケープ・ポートレート切り替え', async ({ page }) => {
      // 1. ポートレート（縦向き）モバイル
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/reports');
      await waitForLoadingToComplete(page);

      const canvas = page.locator('canvas');
      if (await canvas.count() > 0) {
        const portraitCanvasBox = await canvas.first().boundingBox();
        
        // 2. ランドスケープ（横向き）モバイル
        await page.setViewportSize({ width: 667, height: 375 });
        await page.waitForTimeout(500);
        
        const landscapeCanvasBox = await canvas.first().boundingBox();
        
        // グラフが画面サイズに適応していることを確認
        if (portraitCanvasBox && landscapeCanvasBox) {
          // ランドスケープでは幅が同じか大きくなることを期待（完全に同じ場合もOK）
          expect(landscapeCanvasBox.width).toBeGreaterThanOrEqual(portraitCanvasBox.width);
        }
      }
    });
  });

  test.describe('テキストサイズとアクセシビリティ', () => {
    test('大きなフォントサイズでの表示確認', async ({ page }) => {
      // ブラウザのフォントサイズを大きくするエミュレーション
      await page.addStyleTag({
        content: `
          * {
            font-size: 18px !important;
          }
          h1 { font-size: 32px !important; }
          h2 { font-size: 28px !important; }
          h3 { font-size: 24px !important; }
        `
      });

      await page.goto('/');
      await waitForLoadingToComplete(page);

      // 大きなフォントサイズでもレイアウトが崩れないことを確認
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();

      // カード管理ページでも確認
      await page.goto('/cards');
      await waitForLoadingToComplete(page);
      
      const addButton = page.locator('button:has-text("新しいカードを追加")');
      if (await addButton.count() > 0) {
        await expect(addButton.first()).toBeVisible();
      }
    });
  });
});