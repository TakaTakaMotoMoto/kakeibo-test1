# 設計ドキュメント

## 概要

家計簿アプリは、SwiftUIとSwiftDataを使用したiOS/iPadOSネイティブアプリケーションです。MVVM（Model-View-ViewModel）アーキテクチャパターンを採用し、Apple純正のフレームワークのみで実装します。ローカルデータストレージにはSwiftDataを使用し、グラフ表示にはApple Chartsフレームワークを活用します。

## アーキテクチャ

### アーキテクチャパターン: MVVM

```
┌─────────────────────────────────────────────────────────┐
│                         View Layer                       │
│  (SwiftUI Views - TransactionListView, ChartView, etc.) │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                     ViewModel Layer                      │
│  (ObservableObject - TransactionViewModel, etc.)        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                      Model Layer                         │
│        (SwiftData Models - Transaction, Category)        │
└─────────────────────────────────────────────────────────┘
```

### レイヤー構成

1. **View Layer (SwiftUI)**
   - ユーザーインターフェースの表示
   - ユーザー入力の受付
   - ViewModelからのデータバインディング

2. **ViewModel Layer**
   - ビジネスロジックの実装
   - データの変換と整形
   - Modelとの連携

3. **Model Layer (SwiftData)**
   - データモデルの定義
   - データの永続化
   - データアクセスロジック

## コンポーネントとインターフェース

### データモデル (SwiftData)

#### Transaction（取引）
```swift
@Model
final class Transaction {
    var id: UUID
    var amount: Decimal
    var date: Date
    var note: String?
    var category: Category?
    var subcategory: Subcategory?
    var fundSource: FundSource?
    var createdAt: Date
    var updatedAt: Date
}
```

#### Category（カテゴリ）
```swift
@Model
final class Category {
    var id: UUID
    var name: String
    var iconName: String?
    var colorHex: String
    var isCustom: Bool
    var subcategories: [Subcategory]
    var transactions: [Transaction]
}
```

#### Subcategory（サブカテゴリ）
```swift
@Model
final class Subcategory {
    var id: UUID
    var name: String
    var category: Category?
    var transactions: [Transaction]
}
```

#### FundSource（資金元）
```swift
@Model
final class FundSource {
    var id: UUID
    var name: String
    var currentBalance: Decimal
    var initialBalance: Decimal
    var isShared: Bool
    var transactions: [Transaction]
    var createdAt: Date
}
```

#### UserAccount（ユーザーアカウント）
```swift
@Model
final class UserAccount {
    var id: UUID
    var username: String
    var email: String
    var sharedFundSources: [FundSource]
    var createdAt: Date
}
```

### ViewModels

#### TransactionViewModel
```swift
@Observable
final class TransactionViewModel {
    private let modelContext: ModelContext
    
    var transactions: [Transaction] = []
    var selectedCategory: Category?
    var selectedSubcategory: Subcategory?
    var selectedFundSource: FundSource?
    
    func createTransaction(amount: Decimal, date: Date, note: String?)
    func updateTransaction(_ transaction: Transaction)
    func deleteTransaction(_ transaction: Transaction)
    func fetchTransactions(for period: DateInterval)
}
```

#### CategoryViewModel
```swift
@Observable
final class CategoryViewModel {
    private let modelContext: ModelContext
    
    var categories: [Category] = []
    var predefinedCategories: [Category] = []
    
    func createCategory(name: String, iconName: String?, colorHex: String)
    func createSubcategory(name: String, for category: Category)
    func fetchCategories()
    func initializePredefinedCategories()
}
```

#### FundSourceViewModel
```swift
@Observable
final class FundSourceViewModel {
    private let modelContext: ModelContext
    
    var fundSources: [FundSource] = []
    
    func createFundSource(name: String, initialBalance: Decimal)
    func updateBalance(for fundSource: FundSource, amount: Decimal)
    func adjustBalance(for fundSource: FundSource, newBalance: Decimal)
    func fetchFundSources()
}
```

#### ChartViewModel
```swift
@Observable
final class ChartViewModel {
    private let modelContext: ModelContext
    
    var chartData: [ChartDataPoint] = []
    var selectedPeriod: ChartPeriod = .monthly
    var selectedMonth: Date = Date()
    
    func fetchMonthlyData(for year: Int)
    func fetchCategoryBreakdown(for month: Date)
    func fetchSubcategoryBreakdown(for category: Category, month: Date)
}
```

### Views

#### MainTabView
- タブベースのナビゲーション
- 取引一覧、グラフ、資金元、設定の4つのタブ

#### TransactionListView
- 取引の一覧表示
- 日付、カテゴリ、金額でのフィルタリング
- スワイプで削除

#### TransactionFormView
- 新規取引の作成
- 既存取引の編集
- バリデーション機能

#### ChartView
- 月次・年次グラフの表示
- カテゴリ別内訳
- サブカテゴリ別内訳（ドリルダウン）

#### FundSourceListView
- 資金元の一覧表示
- 現在残高の表示
- 新規資金元の作成

#### SettingsView
- アカウント設定
- 共有設定
- アプリ設定（言語、外観など）

## データモデル

### リレーションシップ

```
UserAccount (1) ──────── (N) FundSource
                              │
                              │ (1)
                              │
                              ▼
                         Transaction (N)
                              │
                              │ (1)
                              │
                              ▼
Category (1) ──────── (N) Subcategory
     │
     │ (1)
     │
     ▼
Transaction (N)
```

### データフロー

1. **取引作成フロー**
   ```
   User Input → TransactionFormView → TransactionViewModel 
   → ModelContext.insert() → SwiftData Storage
   ```

2. **グラフ表示フロー**
   ```
   ChartView → ChartViewModel → ModelContext.fetch() 
   → Data Processing → Chart Rendering
   ```

3. **資金元残高更新フロー**
   ```
   Transaction Created → FundSourceViewModel.updateBalance() 
   → FundSource.currentBalance -= amount → SwiftData Storage
   ```

## エラーハンドリング

### エラータイプ

```swift
enum BudgetAppError: LocalizedError {
    case invalidAmount
    case missingCategory
    case missingFundSource
    case insufficientBalance
    case dataCorruption
    case syncFailure
    
    var errorDescription: String? {
        switch self {
        case .invalidAmount:
            return NSLocalizedString("error.invalidAmount", comment: "")
        case .missingCategory:
            return NSLocalizedString("error.missingCategory", comment: "")
        // ... その他のケース
        }
    }
}
```

### エラーハンドリング戦略

1. **バリデーションエラー**
   - フォーム入力時にリアルタイムバリデーション
   - エラーメッセージをフォーム下部に表示
   - 送信ボタンを無効化

2. **データ永続化エラー**
   - try-catchでエラーをキャッチ
   - ユーザーにアラートで通知
   - ログに記録

3. **同期エラー**
   - リトライメカニズム（最大3回）
   - オフラインキューに保存
   - 接続回復時に自動再試行

## テスト戦略

### ユニットテスト

1. **ViewModelテスト**
   - ビジネスロジックの検証
   - データ変換の正確性
   - エラーハンドリング

2. **モデルテスト**
   - データバリデーション
   - リレーションシップの整合性

### UIテスト

1. **主要フローのテスト**
   - 取引作成フロー
   - カテゴリ選択フロー
   - グラフ表示フロー

2. **アクセシビリティテスト**
   - VoiceOver対応の検証
   - Dynamic Type対応の検証

### テストデータ

```swift
extension Transaction {
    static func mockTransaction() -> Transaction {
        let transaction = Transaction()
        transaction.amount = 1000
        transaction.date = Date()
        transaction.note = "テスト取引"
        return transaction
    }
}
```

## ローカライゼーション

### 文字列管理

- `Localizable.strings` (日本語)
- `Localizable.strings` (英語)

### ローカライズ対象

1. **UI文字列**
   - ボタンラベル
   - ナビゲーションタイトル
   - プレースホルダー

2. **エラーメッセージ**
   - バリデーションエラー
   - システムエラー

3. **カテゴリ名**
   - 事前定義カテゴリ
   - 事前定義サブカテゴリ

### フォーマット

```swift
// 通貨フォーマット
let formatter = NumberFormatter()
formatter.numberStyle = .currency
formatter.locale = Locale.current

// 日付フォーマット
let dateFormatter = DateFormatter()
dateFormatter.dateStyle = .medium
dateFormatter.locale = Locale.current
```

## アクセシビリティ

### VoiceOver対応

```swift
Button("追加") {
    // アクション
}
.accessibilityLabel("取引を追加")
.accessibilityHint("新しい取引を記録します")
```

### Dynamic Type対応

```swift
Text("金額")
    .font(.body)
    .dynamicTypeSize(.medium...(.accessibility3))
```

### カラーコントラスト

- WCAG AA基準に準拠
- セマンティックカラーの使用
- ダークモード対応

## パフォーマンス最適化

### データフェッチ最適化

```swift
// ページネーション
let descriptor = FetchDescriptor<Transaction>(
    sortBy: [SortDescriptor(\.date, order: .reverse)],
    predicate: #Predicate { $0.date >= startDate && $0.date <= endDate }
)
descriptor.fetchLimit = 50
```

### メモリ管理

- 大量データの遅延読み込み
- 不要なオブジェクトの適切な解放
- 画像キャッシング（カテゴリアイコン）

## セキュリティ

### データ保護

- SwiftDataのデフォルト暗号化を使用
- Keychainでの認証情報保存
- App Sandboxによる分離

### 認証（将来の拡張）

- Sign in with Appleの統合
- 生体認証（Face ID / Touch ID）

## 技術スタック

- **言語**: Swift 5.9+
- **UIフレームワーク**: SwiftUI
- **データ永続化**: SwiftData
- **グラフ**: Apple Charts
- **最小対応OS**: iOS 17.0
- **開発ツール**: Xcode 15+

## プロジェクト構造

```
HouseholdBudgetApp/
├── App/
│   ├── HouseholdBudgetApp.swift
│   └── ContentView.swift
├── Models/
│   ├── Transaction.swift
│   ├── Category.swift
│   ├── Subcategory.swift
│   ├── FundSource.swift
│   └── UserAccount.swift
├── ViewModels/
│   ├── TransactionViewModel.swift
│   ├── CategoryViewModel.swift
│   ├── FundSourceViewModel.swift
│   └── ChartViewModel.swift
├── Views/
│   ├── Transaction/
│   │   ├── TransactionListView.swift
│   │   ├── TransactionFormView.swift
│   │   └── TransactionRowView.swift
│   ├── Chart/
│   │   ├── ChartView.swift
│   │   ├── MonthlyChartView.swift
│   │   └── CategoryChartView.swift
│   ├── FundSource/
│   │   ├── FundSourceListView.swift
│   │   └── FundSourceFormView.swift
│   └── Settings/
│       └── SettingsView.swift
├── Utilities/
│   ├── Extensions/
│   │   ├── Date+Extensions.swift
│   │   └── Decimal+Extensions.swift
│   ├── Formatters/
│   │   ├── CurrencyFormatter.swift
│   │   └── DateFormatter.swift
│   └── Errors/
│       └── BudgetAppError.swift
└── Resources/
    ├── Localizable.strings (ja)
    ├── Localizable.strings (en)
    └── Assets.xcassets
```
