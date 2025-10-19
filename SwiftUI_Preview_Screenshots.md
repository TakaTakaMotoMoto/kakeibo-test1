# SwiftUI Preview Screenshots

このドキュメントでは、各ビューのSwiftUI Previewを使用してUIの確認を行います。

## メインビュー構造

### 1. MainTabView (メインタブビュー)
```swift
// HouseholdBudgetApp/Views/MainTabView.swift
#Preview {
    MainTabView()
        .modelContainer(for: Transaction.self, inMemory: true)
}
```

**UI構成：**
- 下部タブバー（4つのタブ）
- 📝 取引、📊 グラフ、💳 資金元、⚙️ 設定
- iPhoneに最適化された縦向きレイアウト

### 2. TransactionListView (取引一覧)
```swift
// HouseholdBudgetApp/Views/Transaction/TransactionListView.swift
#Preview {
    TransactionListView()
        .modelContainer(for: Transaction.self, inMemory: true)
}
```

**UI構成：**
- 取引リスト表示
- 右上に「+」ボタン（新規作成）
- スワイプで編集・削除
- 検索・フィルター機能

### 3. TransactionFormView (取引入力フォーム)
```swift
// HouseholdBudgetApp/Views/Transaction/TransactionFormView.swift
#Preview {
    TransactionFormView()
        .modelContainer(for: Transaction.self, inMemory: true)
}
```

**UI構成：**
- 金額入力フィールド
- カテゴリ選択ピッカー
- 資金元選択ピッカー
- 日付選択
- メモ入力フィールド
- 保存・キャンセルボタン

### 4. ChartView (グラフ表示)
```swift
// HouseholdBudgetApp/Views/Chart/ChartView.swift
#Preview {
    ChartView()
        .modelContainer(for: Transaction.self, inMemory: true)
}
```

**UI構成：**
- セグメントコントロール（月次・カテゴリ別）
- 円グラフ・棒グラフ
- 凡例表示
- 期間選択機能

### 5. CategoryListView (カテゴリ管理)
```swift
// HouseholdBudgetApp/Views/Category/CategoryListView.swift
#Preview {
    CategoryListView()
        .modelContainer(for: Transaction.self, inMemory: true)
}
```

**UI構成：**
- カテゴリリスト
- カラーアイコン表示
- サブカテゴリ展開表示
- 編集・削除機能

### 6. FundSourceListView (資金元管理)
```swift
// HouseholdBudgetApp/Views/FundSource/FundSourceListView.swift
#Preview {
    FundSourceListView()
        .modelContainer(for: Transaction.self, inMemory: true)
}
```

**UI構成：**
- 資金元リスト
- 現在残高表示
- 残高調整ボタン
- 共有設定表示

### 7. SettingsView (設定画面)
```swift
// HouseholdBudgetApp/Views/Settings/SettingsView.swift
#Preview {
    SettingsView()
}
```

**UI構成：**
- セクション分けされた設定項目
- アカウント設定
- データ管理
- アプリ情報
- Integration Tests（新機能）

## iPad専用ビュー

### iPadMainView (iPad最適化レイアウト)
```swift
// HouseholdBudgetApp/Views/iPad/iPadMainView.swift
#Preview {
    iPadMainView()
        .modelContainer(for: Transaction.self, inMemory: true)
}
```

**UI構成：**
- サイドバーナビゲーション
- 分割ビュー（マスター・ディテール）
- 横向き最適化レイアウト