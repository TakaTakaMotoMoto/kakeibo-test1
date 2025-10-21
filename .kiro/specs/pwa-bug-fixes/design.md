# PWA家計簿アプリ バグ修正設計書

## 概要

PWA家計簿アプリケーションで発見されたバグを体系的に修正し、アプリケーションの安定性と使いやすさを向上させるための設計書。

## アーキテクチャ

### 現在の問題分析

1. **資金元管理の問題**
   - `renderFundSources()`メソッドで追加ボタンの配置ロジックに問題
   - 空状態の処理が不適切で、追加ボタンが表示されない

2. **カテゴリ・サブカテゴリの問題**
   - `initializeDefaultData()`の実行タイミングの問題
   - ユーザー固有データキーの処理でデフォルトデータが消失

3. **認証システムの問題**
   - `updateAuthDependentUI()`メソッドの未定義エラー
   - 認証状態変更時のイベントハンドリングの不備

4. **共有設定の問題**
   - モックデータのハードコーディング
   - 実際の共有機能の未実装

## コンポーネント設計

### 1. 資金元管理コンポーネント

#### 修正対象ファイル
- `PWA-HouseholdBudgetApp/js/ui.js` - `renderFundSources()`メソッド

#### 設計変更
```javascript
renderFundSources() {
    const container = document.getElementById('fundsources-list');
    const fundSources = window.storage.getFundSources();

    // 常に追加ボタンを最初に表示
    let html = `
        <div class="fundsource-item add-fundsource" style="border: 2px dashed var(--border-color); justify-content: center; cursor: pointer;">
            <div class="fundsource-info text-center">
                <div class="fundsource-name">+ 資金元を追加</div>
            </div>
        </div>
    `;

    if (fundSources.length === 0) {
        html += `
            <div class="empty-state">
                <div class="empty-icon">💳</div>
                <h3>資金元がありません</h3>
                <p>上の「+ 資金元を追加」ボタンから追加してください</p>
            </div>
        `;
    } else {
        // 既存の資金元を表示
        html += fundSources.map(fundSource => {
            // 既存のレンダリングロジック
        }).join('');
    }

    container.innerHTML = html;
    // イベントリスナーの追加
}
```

### 2. データ初期化コンポーネント

#### 修正対象ファイル
- `PWA-HouseholdBudgetApp/js/storage.js` - `initializeDefaultData()`メソッド

#### 設計変更
```javascript
initializeDefaultData() {
    // ユーザー固有キーを考慮した初期化
    const userCategories = this.getCategories();
    const userSubcategories = this.getSubcategories();
    const userFundSources = this.getFundSources();

    if (userCategories.length === 0) {
        this.setCategories(this.getDefaultCategories());
    }
    
    if (userSubcategories.length === 0) {
        this.setSubcategories(this.getDefaultSubcategories());
    }
    
    if (userFundSources.length === 0) {
        this.setFundSources(this.getDefaultFundSources());
    }
}
```

### 3. 認証システムコンポーネント

#### 修正対象ファイル
- `PWA-HouseholdBudgetApp/js/ui.js` - `updateAuthDependentUI()`メソッドの追加
- `PWA-HouseholdBudgetApp/js/auth.js` - イベントハンドリングの改善

#### 設計変更
```javascript
// ui.jsに追加
updateAuthDependentUI() {
    this.updateUserInfoDisplay();
    this.loadInitialData();
    this.updateNavigationState();
}

updateUserInfoDisplay() {
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');
    const showLoginBtn = document.getElementById('show-login');
    const sharingSection = document.getElementById('sharing-section');

    if (window.authManager && window.authManager.getIsLoggedIn()) {
        const user = window.authManager.getCurrentUser();
        // ユーザー情報の表示
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (showLoginBtn) showLoginBtn.style.display = 'none';
        if (sharingSection) sharingSection.style.display = 'block';
    } else {
        // ログアウト状態の表示
        if (userInfo) userInfo.innerHTML = '';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (showLoginBtn) showLoginBtn.style.display = 'block';
        if (sharingSection) sharingSection.style.display = 'none';
    }
}
```

### 4. 共有機能コンポーネント

#### 修正対象ファイル
- `PWA-HouseholdBudgetApp/js/data.js` - `getSharedUsers()`メソッド
- `PWA-HouseholdBudgetApp/js/ui.js` - 共有管理メソッド群

#### 設計変更
```javascript
// data.jsの修正
getSharedUsers() {
    // 実際の共有ユーザーデータを取得
    const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
    if (!currentUser) return [];

    // ローカルストレージから共有設定を取得
    const sharingData = this.storage.getItem('sharing_users', []);
    return sharingData.filter(user => user.sharedWith.includes(currentUser.id));
}

// 共有ユーザーの追加・削除機能
addSharedUser(userEmail) {
    // 実装ロジック
}

removeSharedUser(userId) {
    // 実装ロジック
}
```

## データモデル

### 共有設定データ構造
```javascript
{
    fundSourceId: string,
    isShared: boolean,
    sharedWith: string[], // ユーザーIDの配列
    permissions: {
        canView: boolean,
        canEdit: boolean,
        canDelete: boolean
    },
    createdAt: Date,
    updatedAt: Date
}
```

### ユーザー管理データ構造
```javascript
{
    id: string,
    email: string,
    username: string,
    sharedFundSources: string[], // 共有されている資金元IDの配列
    invitations: [{
        fundSourceId: string,
        invitedBy: string,
        status: 'pending' | 'accepted' | 'declined',
        createdAt: Date
    }]
}
```

## エラーハンドリング

### 1. 初期化エラー
- デフォルトデータの作成失敗時の復旧処理
- 依存関係の読み込み失敗時の再試行機能

### 2. 認証エラー
- ログイン失敗時の適切なメッセージ表示
- セッション切れ時の自動ログアウト処理

### 3. データ整合性エラー
- 削除不可能なアイテムの削除試行時の警告
- 重複データの作成防止

## テスト戦略

### 1. 単体テスト
- 各修正メソッドの動作確認
- エラーケースの処理確認

### 2. 統合テスト
- 認証フローの完全なテスト
- データの作成・更新・削除フローのテスト

### 3. ユーザビリティテスト
- 修正後のUI操作の確認
- エラーメッセージの分かりやすさの確認

## パフォーマンス考慮事項

### 1. 初期化処理の最適化
- 必要最小限のデフォルトデータの作成
- 遅延読み込みの活用

### 2. UI更新の効率化
- 必要な部分のみの再レンダリング
- イベントリスナーの適切な管理

### 3. メモリ使用量の最適化
- 不要なデータの適切なクリーンアップ
- イベントリスナーのメモリリーク防止

## セキュリティ考慮事項

### 1. データアクセス制御
- ユーザー固有データの適切な分離
- 共有データのアクセス権限チェック

### 2. 入力値検証
- フォーム入力の適切なバリデーション
- XSS攻撃の防止

### 3. 認証セキュリティ
- パスワードハッシュ化の改善
- セッション管理の強化