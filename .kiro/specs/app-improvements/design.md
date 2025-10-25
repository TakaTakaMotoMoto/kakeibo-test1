# 家計簿アプリ改善設計書

## 概要

家計簿PWAアプリケーションの8つの主要な機能修正・改善を実装し、ユーザビリティとデータ整合性を向上させる設計。

## アーキテクチャ

### 既存システム構成
- **フロントエンド**: PWA (HTML/CSS/JavaScript)
- **データ管理**: LocalStorage + IndexedDB
- **共有システム**: 招待トークンベース
- **UI管理**: モジュール化されたUI管理システム
- **グラフ表示**: Chart.js

### 改善対象コンポーネント
1. **共有システム (SharingManager)**
2. **招待システム (InvitationManager)**  
3. **UI表示システム (UIManager, UIRenderer)**
4. **資金元管理 (FundSourceManager)**
5. **グラフ表示 (ChartManager)**
6. **ローディング管理 (新規)**

## コンポーネントと インターフェース

### 1. 共有機能修正コンポーネント

#### SharingBugFix (新規)
```javascript
class SharingBugFix {
    investigateNullObjectError() {
        // "null is not an object" エラーの根本原因を調査
        // 1. 招待送信時のオブジェクト初期化チェック
        // 2. 未定義変数へのアクセスを特定
        // 3. 適切な初期化処理を追加
    }
    
    fixInvitationSendingBug() {
        // 招待送信処理の修正
        // オブジェクトの存在確認と適切な初期化
    }
}
```

#### InvitationManager (修正)
```javascript
class InvitationManager {
    resendInvitation(invitationId) {
        // 既存招待を無効化
        // 新しいトークンを生成
        // UI重複表示を防止
    }
    
    createInvitation(data) {
        const now = new Date();
        return {
            ...data,
            createdAt: now,
            expiresAt: new Date(now.getTime() + 10 * 60 * 1000) // createdAt + 10分
        };
    }
}
```

### 2. UI表示改善コンポーネント

#### InvitationTokenDisplay (修正)
```javascript
class InvitationTokenDisplay {
    displayTokenInfo(token) {
        // 白文字問題を解決：黒文字で表示
        const styles = {
            color: '#000000',
            backgroundColor: '#ffffff',
            border: '1px solid #cccccc'
        };
    }
}
```

#### LoadingManager (新規)
```javascript
class LoadingManager {
    showLoading(message = 'データを処理中...') {
        // サーバー通信時のローディング表示
    }
    
    hideLoading() {
        // ローディング非表示
    }
    
    isServerOperation(operation) {
        // サーバー通信が必要な操作かを判定
    }
}
```

### 3. 資金元管理改善コンポーネント

#### FundSourceTypeSelector (新規)
```javascript
class FundSourceTypeSelector {
    getAvailableTypes() {
        return [
            { id: 'bank', name: '銀行口座', icon: '🏦' },
            { id: 'cash', name: '現金', icon: '💵' },
            { id: 'credit', name: 'クレジットカード', icon: '💳' },
            { id: 'digital', name: 'デジタル決済', icon: '📱' }
        ];
    }
    
    renderTypeSelector(selectedType = null) {
        // タイプ選択UIを生成
    }
}
```

#### FundSourceManager (拡張)
```javascript
class FundSourceManager {
    addFundSource(fundSourceData) {
        // タイプ選択を必須に
        if (!fundSourceData.type) {
            throw new Error('資金元タイプを選択してください');
        }
        
        // 追加後にUI更新
        const result = this.storage.addFundSource(fundSourceData);
        this.refreshUI();
        return result;
    }
    
    refreshUI() {
        // データ再取得とUI更新
        window.uiUpdateManager.refreshFundSources();
    }
}
```

### 4. グラフ表示改善コンポーネント

#### ChartManager (大幅修正)
```javascript
class ChartManager {
    constructor() {
        this.currentChartType = 'expense'; // デフォルトは支出
        this.currentDataType = 'category'; // カテゴリ別 or 月次
    }
    
    initializeTabs() {
        // 収入・支出タブの初期化
        this.createTabSystem();
    }
    
    renderIncomeChart() {
        // 収入専用グラフ
        const incomeTransactions = this.getIncomeTransactions();
        this.renderChart(incomeTransactions, 'income');
    }
    
    renderExpenseChart() {
        // 支出専用グラフ  
        const expenseTransactions = this.getExpenseTransactions();
        this.renderChart(expenseTransactions, 'expense');
    }
    
    createTabSystem() {
        // タブ切り替えUI作成
    }
}
```

### 5. データ更新管理コンポーネント

#### UIUpdateManager (拡張)
```javascript
class UIUpdateManager {
    refreshAfterAdd(dataType, newData) {
        // 追加操作後の自動更新
        switch(dataType) {
            case 'transaction':
                this.refreshTransactions();
                this.refreshFundSources(); // 残高更新
                break;
            case 'fundSource':
                this.refreshFundSources();
                break;
        }
    }
    
    refreshTransactions() {
        // 取引リストの再描画
        window.uiManager.renderer.renderTransactions();
    }
    
    refreshFundSources() {
        // 資金元リストの再描画
        window.uiManager.renderer.renderFundSources();
    }
}
```

## データモデル

### 招待トークン (修正)
```javascript
{
    id: string,
    token: string,
    fundSourceId: string,
    inviterUserId: string,
    inviterUsername: string,
    inviteeEmail: string,
    permissions: object,
    createdAt: Date,
    expiresAt: Date, // 現在時刻 + 10分
    status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'
}
```

### 資金元 (拡張)
```javascript
{
    id: string,
    name: string,
    type: 'bank' | 'cash' | 'credit' | 'digital', // 必須フィールド
    balance: number,
    ownerId: string,
    isShared: boolean,
    sharedWith: array,
    permissions: object,
    createdAt: Date,
    updatedAt: Date
}
```

### ローディング状態
```javascript
{
    isLoading: boolean,
    operation: string,
    message: string,
    startTime: Date
}
```

## エラーハンドリング

### 共有エラー処理
1. **null is not an object エラー**
   - 原因: 未初期化オブジェクトへのアクセス
   - 対策: オブジェクト存在チェック + 初期化処理

2. **招待再送信エラー**
   - 原因: 重複処理 + トークン生成失敗
   - 対策: 処理状態管理 + エラー回復

3. **UI重複表示エラー**
   - 原因: 非同期処理の競合
   - 対策: 処理ロック + 状態管理

### バグ修正戦略
```javascript
class BugInvestigation {
    investigateNullObjectError() {
        // "null is not an object" エラーの原因調査
        // 1. 招待送信時のコールスタック分析
        // 2. 未初期化オブジェクトの特定
        // 3. 適切な初期化タイミングの確認
    }
    
    fixRootCause(errorLocation, context) {
        // 根本原因の修正
        // エラー回復ではなく、バグそのものを修正
    }
}
```

## テスト戦略

### 単体テスト対象
1. **SharingBugFix**: バグ修正ロジック
2. **InvitationManager**: トークン生成・管理
3. **FundSourceTypeSelector**: タイプ選択ロジック
4. **ChartManager**: グラフ描画ロジック
5. **LoadingManager**: ローディング状態管理

### 統合テスト対象
1. **共有フロー**: 招待送信→受諾→データ表示
2. **資金元追加フロー**: タイプ選択→追加→UI更新
3. **グラフ表示フロー**: データ取得→タブ切り替え→描画

### テストシナリオ
```javascript
// 共有機能テスト
describe('共有機能修正', () => {
    test('招待送信時にnullエラーが発生しない', () => {
        // "null is not an object" バグの修正確認
    });
    
    test('招待再送信で新しいトークンが生成される', () => {
        // トークン再生成の確認
    });
    
    test('招待トークン情報が黒文字で表示される', () => {
        // UI表示色の確認
    });
});

// 資金元管理テスト
describe('資金元管理改善', () => {
    test('資金元タイプが選択できる', () => {
        // タイプ選択機能の確認
    });
    
    test('追加後にUIが更新される', () => {
        // 自動更新の確認
    });
});

// グラフ表示テスト
describe('グラフ表示改善', () => {
    test('収入と支出が別々のグラフで表示される', () => {
        // 分離表示の確認
    });
    
    test('タブで切り替えができる', () => {
        // タブ機能の確認
    });
});
```

## 実装優先順位

### Phase 1: 緊急修正 (高優先度)
1. 共有機能のnullエラー修正
2. 招待トークン表示色修正
3. トークン有効期限修正

### Phase 2: 機能改善 (中優先度)  
4. 招待再送信機能修正
5. 資金元タイプ選択追加
6. ローディング表示追加

### Phase 3: UX向上 (低優先度)
7. データ更新とUI同期改善
8. グラフ表示改善

## パフォーマンス考慮事項

### 最適化ポイント
1. **UI更新の最適化**: 必要な部分のみ再描画
2. **データ取得の最適化**: キャッシュ活用
3. **ローディング表示**: ユーザー体験向上
4. **エラー処理**: 高速な回復処理

### メモリ管理
- 不要なイベントリスナーの削除
- 大きなデータセットの分割処理
- キャッシュの適切な管理