# デザイン文書

## 概要

複数クレジットカード対応家計簿アプリは、Webベースのシングルページアプリケーション（SPA）として設計します。フロントエンドとバックエンドを分離したRESTful APIアーキテクチャを採用し、リレーショナルデータベースでデータを永続化します。

## アーキテクチャ

### システム全体構成

```mermaid
graph LR
    A[フロントエンド<br/>React SPA<br/>Port: 3000] -->|HTTP/HTTPS<br/>REST API| B[バックエンド<br/>Golang API<br/>Port: 8080]
    B -->|SQL<br/>GORM| C[データベース<br/>PostgreSQL<br/>Port: 5432]

    subgraph "Docker Environment"
        A
        B
        C
    end

    style A fill:#61dafb
    style B fill:#00add8
    style C fill:#336791
```

### 技術スタック

**フロントエンド:**
- React 18 with TypeScript
- React Router for SPA routing
- Axios for HTTP client
- Chart.js for data visualization
- Tailwind CSS for styling

**バックエンド:**
- Go 1.21+
- Gin Web Framework for HTTP routing
- GORM for database ORM
- golang-migrate for database migrations
- validator/v10 for input validation
- bcrypt for password hashing

**データベース:**
- PostgreSQL 15
- Connection pooling with pgxpool

**開発・デプロイ:**
- Vite for frontend build
- Docker for containerization
- Environment-based configuration

## コンポーネントとインターフェース

### フロントエンドコンポーネント構成

```
App
├── Header (ナビゲーション)
├── Router
│   ├── Dashboard (ダッシュボード)
│   ├── ExpenseList (支出一覧)
│   ├── ExpenseForm (支出登録・編集)
│   ├── CardManagement (カード管理)
│   ├── CategoryManagement (カテゴリ管理)
│   └── Reports (レポート)
└── Footer
```

### バックエンドAPI設計

**RESTful API エンドポイント:**

```
GET    /api/cards              # カード一覧取得
POST   /api/cards              # カード作成
PUT    /api/cards/:id          # カード更新
DELETE /api/cards/:id          # カード削除

GET    /api/categories         # カテゴリ一覧取得
POST   /api/categories         # カテゴリ作成
PUT    /api/categories/:id     # カテゴリ更新
DELETE /api/categories/:id     # カテゴリ削除

GET    /api/expenses           # 支出一覧取得（フィルタ対応）
POST   /api/expenses           # 支出作成
PUT    /api/expenses/:id       # 支出更新
DELETE /api/expenses/:id       # 支出削除

GET    /api/reports/monthly    # 月次レポート
GET    /api/reports/yearly     # 年次レポート
```

### データ構造体 (Go Structs)

**Card Model:**
```go
type Card struct {
    ID        string    `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
    Name      string    `json:"name" gorm:"not null" validate:"required,max=100"`
    Color     string    `json:"color" gorm:"not null;default:#3B82F6" validate:"required,hexcolor"`
    CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
    UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}
```

**Category Model:**
```go
type Category struct {
    ID        string    `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
    Name      string    `json:"name" gorm:"not null;unique" validate:"required,max=50"`
    Color     string    `json:"color" gorm:"not null;default:#10B981" validate:"required,hexcolor"`
    CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
    UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}
```

**Expense Model:**
```go
type Expense struct {
    ID          string    `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
    Amount      float64   `json:"amount" gorm:"not null;check:amount > 0" validate:"required,gt=0"`
    Date        time.Time `json:"date" gorm:"not null" validate:"required"`
    Description string    `json:"description"`
    CardID      string    `json:"cardId" gorm:"not null" validate:"required,uuid"`
    CategoryID  string    `json:"categoryId" gorm:"not null" validate:"required,uuid"`
    Card        Card      `json:"card,omitempty" gorm:"foreignKey:CardID;constraint:OnDelete:CASCADE"`
    Category    Category  `json:"category,omitempty" gorm:"foreignKey:CategoryID;constraint:OnDelete:RESTRICT"`
    CreatedAt   time.Time `json:"createdAt" gorm:"autoCreateTime"`
    UpdatedAt   time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}
```

## データモデル

### データベーススキーマ

**cards テーブル:**
```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**categories テーブル:**
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL DEFAULT '#10B981',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**expenses テーブル:**
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  description TEXT,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### インデックス設計

```sql
-- 支出検索の高速化
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_card_id ON expenses(card_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_date_card ON expenses(date DESC, card_id);

-- レポート生成の高速化
CREATE INDEX idx_expenses_date_amount ON expenses(date, amount);
```

### 初期データ

```sql
-- デフォルトカテゴリ
INSERT INTO categories (name, color) VALUES
('食費', '#EF4444'),
('交通費', '#3B82F6'),
('娯楽費', '#8B5CF6'),
('光熱費', '#F59E0B'),
('その他', '#6B7280');
```

## エラーハンドリング

### フロントエンドエラーハンドリング

**Error Boundary:**
```typescript
class ErrorBoundary extends React.Component {
  // アプリケーション全体のエラーをキャッチ
  // ユーザーフレンドリーなエラーメッセージを表示
}
```

**API エラーハンドリング:**
```typescript
// HTTP ステータスコード別のエラー処理
// ネットワークエラーの処理
// タイムアウトエラーの処理
```

### バックエンドエラーハンドリング

**エラーレスポンス形式:**
```go
type ErrorResponse struct {
    Error struct {
        Code    string      `json:"code"`
        Message string      `json:"message"`
        Details interface{} `json:"details,omitempty"`
    } `json:"error"`
    Timestamp string `json:"timestamp"`
    Path      string `json:"path"`
}
```

**エラー分類:**
- 400: バリデーションエラー
- 404: リソース未発見
- 409: データ競合エラー
- 500: サーバー内部エラー

## テスト戦略

### フロントエンドテスト

**単体テスト (Jest + React Testing Library):**
- コンポーネントの描画テスト
- ユーザーインタラクションテスト
- カスタムフックのテスト

**統合テスト:**
- API通信を含むコンポーネントテスト
- ルーティングテスト

**E2Eテスト (Playwright):**
- 主要なユーザーフローのテスト
- 支出登録から一覧表示までの一連の流れ

### バックエンドテスト

**単体テスト (Go testing + testify):**
- ビジネスロジックのテスト
- バリデーション機能のテスト
- ユーティリティ関数のテスト

**統合テスト:**
- API エンドポイントのテスト (httptest)
- データベース操作のテスト (testcontainers-go)

**テストデータベース:**
- テスト専用のPostgreSQLコンテナ
- テスト実行前後のデータクリーンアップ
- トランザクションベースのテスト分離

### テストカバレッジ目標

- 単体テスト: 80%以上
- 統合テスト: 主要機能の100%
- E2Eテスト: クリティカルパスの100%