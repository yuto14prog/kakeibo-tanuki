# Kakeibo Tanuki - Design Document

## システム概要

Kakeibo Tanuki は家計簿管理ウェブアプリケーションです。React + TypeScript フロントエンドと Go バックエンドで構成されています。

## アーキテクチャ

### Frontend (React + TypeScript)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Chart.js
- **State Management**: React Context API

### Backend (Go)
- **Framework**: Gin (HTTP router)
- **Database**: PostgreSQL (production), SQLite (testing)
- **ORM**: GORM
- **Validation**: go-playground/validator
- **Architecture**: Clean Architecture pattern

## データモデル

### Card (支払い方法)
```go
type Card struct {
    ID        uuid.UUID `json:"id"`
    Name      string    `json:"name" validate:"required,max=50"`
    Color     string    `json:"color" validate:"required,hexcolor"`
    CreatedAt time.Time `json:"createdAt"`
    UpdatedAt time.Time `json:"updatedAt"`
}
```

### Category (カテゴリ)
```go
type Category struct {
    ID        uuid.UUID `json:"id"`
    Name      string    `json:"name" validate:"required,max=50"`
    Color     string    `json:"color" validate:"required,hexcolor"`
    IsShared  bool      `json:"isShared"`
    CreatedAt time.Time `json:"createdAt"`
    UpdatedAt time.Time `json:"updatedAt"`
}
```

### Expense (支出)
```go
type Expense struct {
    ID          uuid.UUID `json:"id"`
    Amount      float64   `json:"amount" validate:"required,gt=0"`
    Date        time.Time `json:"date" validate:"required"`
    Description string    `json:"description"`
    CardID      uuid.UUID `json:"cardId" validate:"required"`
    CategoryID  uuid.UUID `json:"categoryId" validate:"required"`
    Card        Card      `json:"card,omitempty"`
    Category    Category  `json:"category,omitempty"`
    CreatedAt   time.Time `json:"createdAt"`
    UpdatedAt   time.Time `json:"updatedAt"`
}
```

## API設計

### RESTful API エンドポイント

#### Cards API
- `GET /api/cards` - カード一覧取得
- `POST /api/cards` - カード作成
- `GET /api/cards/:id` - カード詳細取得
- `PUT /api/cards/:id` - カード更新
- `DELETE /api/cards/:id` - カード削除

#### Categories API
- `GET /api/categories` - カテゴリ一覧取得
- `POST /api/categories` - カテゴリ作成
- `GET /api/categories/:id` - カテゴリ詳細取得
- `PUT /api/categories/:id` - カテゴリ更新
- `DELETE /api/categories/:id` - カテゴリ削除

#### Expenses API
- `GET /api/expenses` - 支出一覧取得（ページネーション対応）
- `POST /api/expenses` - 支出作成
- `GET /api/expenses/:id` - 支出詳細取得
- `PUT /api/expenses/:id` - 支出更新
- `DELETE /api/expenses/:id` - 支出削除

#### Reports API
- `GET /api/reports/monthly` - 月次レポート取得
- `GET /api/reports/yearly` - 年次レポート取得

### レスポンス形式

#### 成功レスポンス
```json
{
  "message": "Operation successful",
  "data": {...}
}
```

#### エラーレスポンス
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": "Additional details"
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "path": "/api/endpoint"
}
```

#### ページネーションレスポンス
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "totalItems": 100
  }
}
```

## テストアーキテクチャ

### テスト戦略
- **Unit Tests**: モデルバリデーション、ビジネスロジック
- **Integration Tests**: リポジトリ、API エンドポイント
- **E2E Tests**: ユーザージャーニー（今後実装予定）

### テスト環境
- **Database**: In-memory SQLite for testing
- **Test Server**: Gin test server with isolated test environment
- **Test Framework**: Go standard testing + testify

### テストファイル構成
```
tests/
├── unit/           # Unit tests (models, validation)
├── integration/    # Integration tests (repository, API)
└── e2e/           # E2E tests (future)
```

## セキュリティ設計

### データ検証
- **Input Validation**: go-playground/validator による厳密な入力検証
- **SQL Injection Prevention**: GORM による ORM 使用
- **UUID Usage**: 予測困難な ID 生成

### エラーハンドリング
- **Structured Error Responses**: 一貫したエラーレスポンス形式
- **Input Sanitization**: 入力データの適切なサニタイズ
- **Constraint Validation**: データベース制約の適切な処理

## パフォーマンス設計

### データベース最適化
- **Indexing**: 適切なインデックス設計
- **Pagination**: 大量データの効率的な取得
- **Preloading**: 関連データの効率的な取得

### フロントエンド最適化
- **Chart.js Integration**: 効率的なデータ可視化
- **Lazy Loading**: 必要な時にデータを取得
- **Caching**: API レスポンスの適切なキャッシュ

## 今後の拡張予定

### フロントエンドテスト
- React Testing Library によるコンポーネントテスト
- Cypress/Playwright による E2E テスト

### 機能拡張
- ユーザー認証・認可
- 複数通貨対応
- データエクスポート機能
- 予算管理機能

### インフラストラクチャ
- Docker コンテナ化
- CI/CD パイプライン
- Production deployment strategy