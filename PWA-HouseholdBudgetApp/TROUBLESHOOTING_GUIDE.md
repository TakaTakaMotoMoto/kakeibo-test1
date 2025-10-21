# PWA家計簿アプリ - トラブルシューティングガイド

## 概要

このガイドは、PWA家計簿アプリで発生する可能性のある問題と、その解決方法を詳しく説明します。
問題が発生した際は、まずこのガイドを参照してください。

## 緊急時の対応

### アプリが全く動作しない場合
1. **ブラウザの確認**: Chrome、Firefox、Safari、Edgeの最新版を使用
2. **強制再読み込み**: Ctrl+F5 (Windows) または Cmd+Shift+R (Mac)
3. **キャッシュクリア**: ブラウザの設定からキャッシュとCookieを削除
4. **別ブラウザで確認**: 問題がブラウザ固有かを確認

### データが消失した場合
1. **ブラウザデータの確認**: 開発者ツール > Application > Local Storage
2. **バックアップの確認**: 事前にバックアップを取っていた場合は復元
3. **一時的な問題の可能性**: ページを再読み込みして確認

## 一般的な問題と解決方法

### 1. 初期化関連の問題

#### 問題: 「データが表示されない」
**症状**: 
- 取引リストが空
- カテゴリが表示されない
- 資金元が表示されない

**原因**:
- 初期化処理の失敗
- ローカルストレージの問題
- JavaScript エラー

**解決手順**:
```javascript
// 1. ブラウザコンソールで状態確認
console.log('Storage check:', window.storage);
console.log('Data check:', {
    categories: window.storage?.getCategories()?.length || 0,
    fundSources: window.storage?.getFundSources()?.length || 0,
    transactions: window.storage?.getTransactions()?.length || 0
});

// 2. 強制再初期化
if (window.storage) {
    window.storage.forceReinitialize();
    location.reload();
}
```

#### 問題: 「追加ボタンが表示されない」
**症状**:
- 資金元の「+ 資金元を追加」ボタンが見えない
- カテゴリ管理ボタンが表示されない

**解決手順**:
```javascript
// UI要素の強制再描画
if (window.uiManager) {
    window.uiManager.renderFundSources();
    window.uiManager.updateAuthDependentUI();
}
```

### 2. 認証関連の問題

#### 問題: 「ログイン時にエラーが発生」
**症状**:
- "updateAuthDependentUI is not defined" エラー
- ログイン後に画面が更新されない
- JavaScript エラーが表示される

**解決手順**:
```javascript
// 1. 認証状態のリセット
localStorage.removeItem('currentUser');
localStorage.removeItem('isLoggedIn');

// 2. 認証システムの確認
console.log('Auth manager:', window.authManager);
console.log('UI manager:', window.uiManager);

// 3. ページ再読み込み
location.reload();
```#### 問題: 「認証
状態が不安定」
**症状**:
- ログイン状態が保持されない
- ユーザー情報が表示されない
- 認証後にデータが切り替わらない

**解決手順**:
```javascript
// 認証状態の手動修復
if (window.authManager) {
    // 現在の認証状態を確認
    console.log('Login status:', window.authManager.getIsLoggedIn());
    console.log('Current user:', window.authManager.getCurrentUser());
    
    // UI更新を強制実行
    window.authManager.updateAuthUI();
}
```

### 3. データ関連の問題

#### 問題: 「取引の追加ができない」
**症状**:
- 保存ボタンを押してもエラーが発生
- フォームが送信されない
- データが保存されない

**解決手順**:
1. **入力値の確認**: 必須フィールドがすべて入力されているか
2. **ストレージ容量の確認**: ローカルストレージの容量制限に達していないか
3. **手動でのデータ追加テスト**:
```javascript
// テスト用の取引データを追加
const testTransaction = {
    id: 'test-' + Date.now(),
    amount: -1000,
    categoryId: 'food',
    fundSourceId: 'cash',
    date: new Date().toISOString().split('T')[0],
    note: 'テスト取引'
};

try {
    window.dataManager.addTransaction(testTransaction);
    console.log('Transaction added successfully');
} catch (error) {
    console.error('Failed to add transaction:', error);
}
```

#### 問題: 「カテゴリ選択時にサブカテゴリが更新されない」
**症状**:
- カテゴリを選択してもサブカテゴリの選択肢が変わらない
- サブカテゴリが空のまま

**解決手順**:
```javascript
// サブカテゴリ更新の手動実行
if (window.uiManager) {
    // 食費カテゴリの場合
    window.uiManager.updateSubcategoryOptions('food');
    
    // 全カテゴリのサブカテゴリを確認
    const categories = window.storage.getCategories();
    categories.forEach(cat => {
        const subcats = window.storage.getSubcategoriesByCategory(cat.id);
        console.log(`${cat.name}: ${subcats.length} subcategories`);
    });
}
```

### 4. 共有機能の問題

#### 問題: 「共有ユーザーの追加ができない」
**症状**:
- メールアドレスを入力しても追加されない
- 共有管理画面でエラーが発生
- モックデータが表示される

**解決手順**:
```javascript
// 共有機能の状態確認
console.log('Sharing methods available:', {
    getSharedUsers: typeof window.dataManager.getSharedUsers,
    addSharedUser: typeof window.dataManager.addSharedUser,
    removeSharedUser: typeof window.dataManager.removeSharedUser
});

// 共有ユーザーの手動追加テスト
try {
    window.dataManager.addSharedUser('test@example.com', ['cash']);
    console.log('Shared user added successfully');
} catch (error) {
    console.error('Failed to add shared user:', error);
}
```

#### 問題: 「共有インジケーターが表示されない」
**症状**:
- 共有設定をしても🔗アイコンが表示されない
- 共有状態が視覚的に分からない

**解決手順**:
```javascript
// 共有状態の確認と修復
const fundSources = window.storage.getFundSources();
fundSources.forEach(fs => {
    const sharing = window.dataManager.getFundSourceSharingSettings(fs.id);
    console.log(`${fs.name} sharing:`, sharing);
});

// UI の強制更新
window.uiManager.renderFundSources();
```

### 5. パフォーマンス関連の問題

#### 問題: 「アプリの動作が重い」
**症状**:
- ページの読み込みが遅い
- 操作の反応が悪い
- ブラウザがフリーズする

**解決手順**:
1. **データ量の確認**:
```javascript
// データ量の確認
const dataSize = {
    transactions: window.storage.getTransactions().length,
    categories: window.storage.getCategories().length,
    fundSources: window.storage.getFundSources().length
};
console.log('Data size:', dataSize);

// ストレージ使用量の確認
let totalSize = 0;
for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length;
    }
}
console.log(`Storage usage: ${(totalSize / 1024).toFixed(2)} KB`);
```

2. **古いデータの削除**:
```javascript
// 6ヶ月以上前の取引を削除
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
const cutoffDate = sixMonthsAgo.toISOString().split('T')[0];

const transactions = window.storage.getTransactions();
const recentTransactions = transactions.filter(t => t.date >= cutoffDate);
window.storage.setTransactions(recentTransactions);
console.log(`Deleted ${transactions.length - recentTransactions.length} old transactions`);
```

### 6. UI関連の問題

#### 問題: 「モーダルが表示されない」
**症状**:
- 追加・編集フォームが開かない
- モーダルの背景が表示されるが内容が見えない
- ボタンをクリックしても反応がない

**解決手順**:
```javascript
// モーダル要素の確認
const modals = document.querySelectorAll('.modal');
console.log('Modal elements:', modals.length);

// モーダルの強制表示テスト
if (window.uiManager) {
    try {
        window.uiManager.showTransactionModal();
        console.log('Modal opened successfully');
    } catch (error) {
        console.error('Failed to open modal:', error);
    }
}
```

#### 問題: 「レスポンシブデザインが崩れる」
**症状**:
- スマートフォンで表示が崩れる
- ボタンが押せない
- 文字が読めない

**解決手順**:
1. **ビューポートの確認**: HTMLのviewportメタタグが正しく設定されているか
2. **CSS読み込みの確認**:
```javascript
// CSS読み込み状況の確認
const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
console.log('Stylesheets loaded:', stylesheets.length);
stylesheets.forEach((sheet, index) => {
    console.log(`${index + 1}: ${sheet.href}`);
});
```

## 高度なトラブルシューティング

### デバッグモードの有効化
```javascript
// デバッグモードを有効にして詳細ログを表示
window.DEBUG = true;
localStorage.setItem('debug', 'true');

// 各コンポーネントの詳細状態を確認
console.log('Detailed app state:', {
    storage: {
        initialized: window.storage?.isInitialized?.() || false,
        userKey: window.storage?.getUserKey?.('test') || 'N/A'
    },
    auth: {
        loggedIn: window.authManager?.getIsLoggedIn?.() || false,
        user: window.authManager?.getCurrentUser?.() || null
    },
    ui: {
        initialized: !!window.uiManager,
        methods: Object.getOwnPropertyNames(window.uiManager || {}).length
    }
});
```

### 完全なリセット手順
```javascript
// 警告: すべてのデータが削除されます
function completeReset() {
    if (confirm('すべてのデータが削除されます。続行しますか？')) {
        // ローカルストレージを完全にクリア
        localStorage.clear();
        
        // セッションストレージもクリア
        sessionStorage.clear();
        
        // キャッシュをクリア（可能な場合）
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        
        // ページを再読み込み
        location.reload(true);
    }
}

// 実行する場合（注意して使用）
// completeReset();
```

### パフォーマンス測定
```javascript
// パフォーマンス測定の開始
function measurePerformance() {
    console.time('app-performance');
    
    // 各操作の測定
    console.time('data-load');
    const transactions = window.storage.getTransactions();
    console.timeEnd('data-load');
    
    console.time('ui-render');
    window.uiManager.renderTransactionList();
    console.timeEnd('ui-render');
    
    console.timeEnd('app-performance');
    
    // メモリ使用量の確認
    if (performance.memory) {
        console.log('Memory usage:', {
            used: `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
            total: `${(performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
            limit: `${(performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
        });
    }
}
```

## エラーコードと対処法

### E001: Storage Initialization Failed
**原因**: ローカルストレージの初期化に失敗
**対処法**: ブラウザのストレージ設定を確認、プライベートモードを無効化

### E002: Auth Manager Not Found
**原因**: 認証システムの読み込みに失敗
**対処法**: JavaScriptファイルの読み込み順序を確認、キャッシュをクリア

### E003: UI Component Missing
**原因**: UI要素が見つからない
**対処法**: HTMLファイルの整合性を確認、DOM読み込み完了後に実行

### E004: Data Validation Error
**原因**: 入力データの形式が不正
**対処法**: 入力値を確認、必須フィールドをすべて入力

### E005: Storage Quota Exceeded
**原因**: ローカルストレージの容量制限に達した
**対処法**: 古いデータを削除、ブラウザのストレージ設定を確認

## 予防策とベストプラクティス

### 定期的なメンテナンス
1. **月1回**: 古い取引データの整理
2. **週1回**: ブラウザキャッシュのクリア
3. **日常**: 重要なデータのバックアップ

### 安全な使用方法
1. **信頼できるネットワーク**: 公共Wi-Fiでの使用は避ける
2. **定期的なログアウト**: 共有PCでは必ずログアウト
3. **ブラウザの更新**: 常に最新版を使用

### データ保護
1. **定期バックアップ**: 重要なデータは定期的にエクスポート
2. **複数デバイス**: 可能であれば複数デバイスでデータを管理
3. **セキュリティ**: 強固なパスワードの使用

## サポートとお問い合わせ

### 自己解決できない場合
1. **GitHub Issues**: 技術的な問題の報告
2. **ドキュメント**: 関連ドキュメントの再確認
3. **コミュニティ**: ユーザーコミュニティでの質問

### 問題報告時の情報
- ブラウザの種類とバージョン
- 操作手順の詳細
- エラーメッセージの全文
- コンソールログの内容
- 期待される動作と実際の動作

---

**最終更新日**: 2025年10月21日  
**対象バージョン**: 1.0  
**作成者**: PWA家計簿アプリ開発チーム