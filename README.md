# 家計簿アプリ (Household Budget App)

## 🌟 2つのバージョンを提供

### 📱 PWA版（推奨）
**すぐに使える！App Store不要のウェブアプリ**
- 🚀 **即座に利用開始**: ブラウザでアクセスするだけ
- 📱 **アプリライク**: ホーム画面に追加してネイティブアプリのように使用
- 🌐 **クロスプラットフォーム**: iPhone、Android、PC対応
- ⚡ **オフライン対応**: インターネット接続なしでも使用可能

**👉 [PWA版を今すぐ使う](https://takatakamotomoto.github.io/kakeibo-test1/PWA-HouseholdBudgetApp/)**

### 🍎 iOS/iPadOS版（開発者向け）
SwiftUIとSwiftDataを使用したネイティブアプリ版

**要件:**
- iOS 17.0以上
- Xcode 15.0以上
- Swift 5.9以上

## 主な機能

### ✅ 完全実装済み
- **取引管理**: 収支の記録、編集、削除
- **カテゴリ管理**: カスタムカテゴリとサブカテゴリの作成
- **資金元管理**: 複数の資金源（財布、銀行口座など）の管理
- **グラフ表示**: 月次・年次の支出グラフ、カテゴリ別内訳
- **ユーザーアカウント**: アカウント作成と共有機能
- **ローカライゼーション**: 日本語・英語対応
- **ダークモード**: 完全対応
- **アクセシビリティ**: VoiceOver、Dynamic Type対応
- **iPad対応**: 最適化されたレイアウト
- **データ永続化**: SwiftDataによる安全なデータ保存
- **エラーハンドリング**: 包括的なエラー処理
- **テスト**: 包括的なユニット・UIテスト

### 🔧 統合・最適化機能
- **統合テスト**: 包括的な統合テストスイート
- **パフォーマンス最適化**: メモリ管理とパフォーマンス監視
- **デバイス互換性**: iPhone・iPad対応確認
- **エンドツーエンドテスト**: 完全なユーザーフロー検証
- **データ整合性**: 自動データ整合性チェック
- **最終統合検証**: 全機能の統合確認

## プロジェクト構造

```
HouseholdBudgetApp/
├── App/
│   ├── HouseholdBudgetApp.swift    # メインアプリ
│   └── ContentView.swift           # ルートビュー
├── Models/                         # SwiftDataモデル
│   ├── Transaction.swift           # 取引モデル
│   ├── Category.swift              # カテゴリモデル
│   ├── Subcategory.swift           # サブカテゴリモデル
│   ├── FundSource.swift            # 資金元モデル
│   └── UserAccount.swift           # ユーザーアカウントモデル
├── ViewModels/                     # ビューモデル
│   ├── TransactionViewModel.swift  # 取引管理
│   ├── CategoryViewModel.swift     # カテゴリ管理
│   ├── FundSourceViewModel.swift   # 資金元管理
│   ├── ChartViewModel.swift        # グラフデータ
│   └── UserAccountViewModel.swift  # アカウント管理
├── Views/                          # SwiftUIビュー
│   ├── Transaction/                # 取引関連ビュー
│   ├── Category/                   # カテゴリ関連ビュー
│   ├── FundSource/                 # 資金元関連ビュー
│   ├── Chart/                      # グラフ関連ビュー
│   ├── Settings/                   # 設定関連ビュー
│   ├── Account/                    # アカウント関連ビュー
│   └── iPad/                       # iPad最適化ビュー
├── Utilities/                      # ユーティリティ
│   ├── DataMigrationManager.swift  # データマイグレーション
│   ├── DataIntegrityService.swift  # データ整合性
│   ├── IntegrationTestManager.swift # 統合テスト
│   ├── PerformanceOptimizer.swift  # パフォーマンス最適化
│   ├── DeviceCompatibilityManager.swift # デバイス互換性
│   ├── EndToEndTestRunner.swift    # エンドツーエンドテスト
│   ├── FinalIntegrationValidator.swift # 最終統合検証
│   └── Errors/                     # エラー定義
└── Resources/                      # リソース
    ├── ja.lproj/                   # 日本語リソース
    ├── en.lproj/                   # 英語リソース
    └── Assets.xcassets             # アセット
```

## アーキテクチャ

### MVVM パターン
- **Model**: SwiftDataモデル（データ永続化）
- **View**: SwiftUIビュー（UI表示）
- **ViewModel**: ObservableObjectビューモデル（ビジネスロジック）

### データフロー
```
User Input → SwiftUI View → ViewModel → SwiftData Model → Persistence
```

## 統合テスト・最適化

### 統合テストスイート
アプリには包括的な統合テストが含まれています：

1. **統合テスト**: コンポーネント間の連携テスト
2. **エンドツーエンドテスト**: 完全なユーザーフローテスト
3. **デバイス互換性テスト**: iPhone・iPad対応確認
4. **パフォーマンステスト**: メモリ使用量・処理速度測定
5. **最終統合検証**: 全機能の統合確認

### アクセス方法
設定画面 → Integration Tests から各種テストを実行できます。

### パフォーマンス最適化
- メモリ使用量の監視と最適化
- データベースクエリの最適化
- キャッシュ管理
- リソースクリーンアップ

## データモデル

### Transaction（取引）
- 金額、日付、メモ、作成・更新日時
- カテゴリ、サブカテゴリ、資金元との関連
- UUID による一意識別

### Category（カテゴリ）
- 名前、アイコン、色、カスタムフラグ
- サブカテゴリとの1対多関係（カスケード削除）
- 取引との1対多関係

### Subcategory（サブカテゴリ）
- 名前
- カテゴリとの多対1関係
- 取引との1対多関係

### FundSource（資金元）
- 名前、現在残高、初期残高、共有設定
- 取引との1対多関係
- ユーザーアカウントとの多対多関係

### UserAccount（ユーザーアカウント）
- ユーザー名、メールアドレス、作成日時
- 共有資金元との多対多関係

## 開発・テスト

### 開発環境
- Xcode 15.0以上
- iOS Simulator または実機（iOS 17.0以上）
- Swift 5.9以上

### テスト実行
```bash
# ユニットテスト
xcodebuild test -scheme HouseholdBudgetApp -destination 'platform=iOS Simulator,name=iPhone 15'

# UIテスト
xcodebuild test -scheme HouseholdBudgetApp -destination 'platform=iOS Simulator,name=iPhone 15' -only-testing:HouseholdBudgetAppUITests

# 統合テスト（アプリ内から実行）
設定 → Integration Tests → 各種テスト実行
```

### デバッグ・最適化
- 統合テストでパフォーマンス問題を特定
- メモリリーク検出
- データ整合性チェック
- デバイス互換性確認

## 特徴

### 🌍 多言語対応
- 日本語・英語の完全対応
- 通貨・日付の地域対応
- 動的言語切り替え

### 🎨 ユーザビリティ
- ダークモード完全対応
- Dynamic Type対応
- VoiceOver対応
- 直感的なUI/UX

### 📱 デバイス対応
- iPhone（縦向き）
- iPad（縦・横向き最適化）
- 異なる画面サイズへの適応

### 🔒 データ安全性
- SwiftDataによる暗号化
- データ整合性チェック
- 自動バックアップ機能
- マイグレーション対応

### ⚡ パフォーマンス
- 最適化されたデータベースクエリ
- メモリ効率的な実装
- 大量データ対応
- リアルタイム更新

## 🚀 クイックスタート

### PWA版を使用する場合
1. ブラウザで https://takatakamotomoto.github.io/kakeibo-test1/PWA-HouseholdBudgetApp/ にアクセス
2. 「ホーム画面に追加」でアプリとしてインストール
3. すぐに家計簿管理を開始！

### iOS版を開発する場合
1. このリポジトリをクローン
2. Xcodeで `HouseholdBudgetApp.xcodeproj` を開く
3. iOS Simulatorまたは実機で実行

## 📁 プロジェクト構成

```
kakeibo-test1/
├── PWA-HouseholdBudgetApp/     # PWA版（推奨）
│   ├── index.html              # メインアプリ
│   ├── manifest.json           # PWA設定
│   ├── sw.js                   # Service Worker
│   ├── styles/                 # スタイルシート
│   ├── js/                     # JavaScript
│   └── icons/                  # アプリアイコン
├── HouseholdBudgetApp/         # iOS版
│   ├── Models/                 # SwiftDataモデル
│   ├── Views/                  # SwiftUIビュー
│   ├── ViewModels/             # ビューモデル
│   └── Utilities/              # ユーティリティ
└── HouseholdBudgetAppTests/    # テストファイル
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。