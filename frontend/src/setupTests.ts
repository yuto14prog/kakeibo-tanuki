import '@testing-library/jest-dom';
import React from 'react';

// import.meta.env のモック - より詳細に設定
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:8080',
        MODE: 'test',
        BASE_URL: '/',
        PROD: false,
        DEV: true,
      },
    },
  },
  writable: true,
  configurable: true,
});

// Node.js環境でのESMサポート
if (typeof global !== 'undefined') {
  (global as any).import = {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:8080',
        MODE: 'test',
        BASE_URL: '/',
        PROD: false,
        DEV: true,
      },
    },
  };
}

// グローバルなprocess環境の設定
process.env.NODE_ENV = 'test';

// Chart.js のモック
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
  ArcElement: jest.fn(),
}));

// react-chartjs-2 のモック
jest.mock('react-chartjs-2', () => ({
  Line: () => React.createElement('div', { 'data-testid': 'line-chart' }, 'Line Chart'),
  Pie: () => React.createElement('div', { 'data-testid': 'pie-chart' }, 'Pie Chart'),
}));

// Window.matchMedia のモック（テーマ切り替えテスト用）
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});