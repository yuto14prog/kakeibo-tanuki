# 家計簿たぬき (Kakeibo Tanuki)

複数のクレジットカードの支出を管理するための家計簿アプリケーション。

## アーキテクチャ

- **フロントエンド**: React + TypeScript + Vite + Tailwind CSS
- **バックエンド**: Go + Gin + GORM
- **データベース**: PostgreSQL
- **コンテナ**: Docker + Docker Compose

## 機能

### 実装済み機能

1. **プロジェクト構造**
   - Go バックエンドAPI
   - React フロントエンド
   - Docker コンテナ設定

2. **データベース**
   - PostgreSQL設定
   - マイグレーション
   - 初期データ（デフォルトカテゴリ）

3. **バックエンドAPI**
   - カード管理 (CRUD)
   - カテゴリ管理 (CRUD)
   - 支出管理 (CRUD)
   - レポート機能 (月次・年次)

4. **フロントエンド基盤**
   - React Router による SPA 構成
   - API通信レイヤー
   - 基本的なダッシュボード

### 実装予定機能

- 支出登録・編集画面
- 支出一覧・フィルタリング
- カード管理画面
- カテゴリ管理画面
- レポート・グラフ表示
- データ検証・エラーハンドリング

## 開発環境のセットアップ

### 前提条件

- Docker
- Docker Compose
- Go 1.21+ (ローカル開発用)
- Node.js 18+ (ローカル開発用)

### 起動方法

1. リポジトリのクローン
```bash
git clone <repository-url>
cd kakeibo-tanuki
```

2. 環境変数の設定
```bash
cp .env.example .env
```

3. Docker Compose で全サービスを起動
```bash
docker-compose up -d
```

4. アプリケーションへのアクセス
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8080
- データベース: localhost:5432

### ローカル開発

#### バックエンドの起動
```bash
cd backend
go run cmd/api/main.go
```

#### フロントエンドの起動
```bash
cd frontend
npm install
npm run dev
```

## API エンドポイント

### カード管理
- `GET /api/cards` - カード一覧取得
- `POST /api/cards` - カード作成
- `GET /api/cards/:id` - 特定カード取得
- `PUT /api/cards/:id` - カード更新
- `DELETE /api/cards/:id` - カード削除

### カテゴリ管理
- `GET /api/categories` - カテゴリ一覧取得
- `POST /api/categories` - カテゴリ作成
- `GET /api/categories/:id` - 特定カテゴリ取得
- `PUT /api/categories/:id` - カテゴリ更新
- `DELETE /api/categories/:id` - カテゴリ削除

### 支出管理
- `GET /api/expenses` - 支出一覧取得（フィルタ対応）
- `POST /api/expenses` - 支出作成
- `GET /api/expenses/:id` - 特定支出取得
- `PUT /api/expenses/:id` - 支出更新
- `DELETE /api/expenses/:id` - 支出削除

### レポート
- `GET /api/reports/monthly` - 月次レポート
- `GET /api/reports/yearly` - 年次レポート

## データベーススキーマ

### cards テーブル
- `id` (UUID) - 主キー
- `name` (VARCHAR) - カード名
- `color` (VARCHAR) - カードカラー
- `created_at` (TIMESTAMP) - 作成日時
- `updated_at` (TIMESTAMP) - 更新日時

### categories テーブル
- `id` (UUID) - 主キー
- `name` (VARCHAR) - カテゴリ名
- `color` (VARCHAR) - カテゴリカラー
- `created_at` (TIMESTAMP) - 作成日時
- `updated_at` (TIMESTAMP) - 更新日時

### expenses テーブル
- `id` (UUID) - 主キー
- `amount` (DECIMAL) - 金額
- `date` (DATE) - 支出日
- `description` (TEXT) - 説明
- `card_id` (UUID) - カードID（外部キー）
- `category_id` (UUID) - カテゴリID（外部キー）
- `created_at` (TIMESTAMP) - 作成日時
- `updated_at` (TIMESTAMP) - 更新日時

## 貢献

プロジェクトへの貢献は歓迎します。Issue や Pull Request をお気軽に作成してください。

## ライセンス

MIT License