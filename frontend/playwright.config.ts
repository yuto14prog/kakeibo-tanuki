import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E テスト設定
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* フルフルレッタルレポート */
  fullyParallel: true,
  /* CI環境でファイル時に失敗 */
  forbidOnly: !!process.env.CI,
  /* CI環境でのリトライ回数 */
  retries: process.env.CI ? 2 : 0,
  /* 並列ワーカー数 */
  workers: process.env.CI ? 1 : undefined,
  /* レポーター設定 */
  reporter: 'html',
  /* 共通設定 */
  use: {
    /* ベースURL */
    baseURL: 'http://localhost:3000',

    /* タイムアウト設定 */
    actionTimeout: 10000,
    navigationTimeout: 30000,

    /* 失敗時のスクリーンショット */
    screenshot: 'only-on-failure',

    /* 失敗時のビデオ録画 */
    video: 'retain-on-failure',

    /* トレース収集 */
    trace: 'on-first-retry',
  },

  /* プロジェクト設定（ブラウザ別） */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // テスト時間短縮のため、一時的にChromiumのみでテスト
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* モバイルテスト */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Microsoft Edgeの追加（オプション） */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
  ],

  /* 開発サーバー設定 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});