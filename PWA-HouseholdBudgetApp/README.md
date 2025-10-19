# 家計簿PWAアプリ

シンプルで使いやすいプログレッシブウェブアプリ（PWA）版の家計簿アプリです。

## 🌟 特徴

### 📱 PWA機能
- **オフライン対応**: インターネット接続なしでも使用可能
- **アプリライクな体験**: ネイティブアプリのような操作感
- **ホーム画面に追加**: スマートフォンのホーム画面にアイコンを追加
- **プッシュ通知**: 重要な更新をお知らせ（将来実装予定）

### 💰 家計簿機能
- **取引管理**: 収入・支出の記録、編集、削除
- **カテゴリ分類**: 食費、交通費、娯楽費など8つのデフォルトカテゴリ
- **資金元管理**: 現金、銀行口座、クレジットカードなど複数の資金源
- **カレンダービュー**: 月間カレンダーで取引を視覚的に確認
- **グラフ表示**: カテゴリ別円グラフと月次推移グラフ
- **フィルター機能**: 期間、カテゴリ、資金元での絞り込み

### 🎨 ユーザビリティ
- **レスポンシブデザイン**: スマートフォン、タブレット対応
- **ダークモード**: システム設定に自動対応
- **直感的なUI**: タップ、スワイプによる簡単操作
- **高速動作**: ローカルストレージによる瞬時のデータアクセス

## 🚀 使用方法

### インストール方法

#### 1. ウェブブラウザで使用
```
https://your-domain.com/PWA-HouseholdBudgetApp/
```
にアクセスしてすぐに使用開始

#### 2. PWAとしてインストール

**iPhone/iPad (Safari):**
1. Safariでアプリを開く
2. 共有ボタン（□↑）をタップ
3. 「ホーム画面に追加」を選択
4. 「追加」をタップ

**Android (Chrome):**
1. Chromeでアプリを開く
2. メニュー（⋮）をタップ
3. 「ホーム画面に追加」を選択
4. 「追加」をタップ

**PC (Chrome/Edge):**
1. ブラウザでアプリを開く
2. アドレスバーの「インストール」アイコンをクリック
3. 「インストール」をクリック

### 基本的な使い方

#### 取引の追加
1. 右上の「+」ボタンをタップ
2. 金額、カテゴリ、資金元、日付を入力
3. 「保存」をタップ

#### カレンダーで確認
1. 取引画面で「📅 カレンダー」をタップ
2. 日付をタップして詳細を確認
3. 取引をタップして編集

#### グラフで分析
1. 「📊 グラフ」タブをタップ
2. 「カテゴリ別」「月次推移」を切り替え
3. 支出パターンを分析

#### データ管理
1. 「⚙️ 設定」タブをタップ
2. 「データエクスポート」でバックアップ
3. 「データインポート」で復元

## 🛠️ 技術仕様

### フロントエンド
- **HTML5**: セマンティックマークアップ
- **CSS3**: Flexbox、Grid、CSS Variables
- **JavaScript (ES6+)**: モジュール化されたクラス設計
- **Chart.js**: グラフ描画ライブラリ

### PWA技術
- **Service Worker**: オフライン対応、キャッシュ管理
- **Web App Manifest**: アプリメタデータ
- **Local Storage**: データ永続化
- **Responsive Design**: 全デバイス対応

### データ構造
```javascript
// 取引データ
{
  id: "unique-id",
  amount: -1500,
  categoryId: "food",
  fundSourceId: "cash",
  date: "2024-01-15",
  note: "ランチ",
  createdAt: "2024-01-15T12:00:00Z",
  updatedAt: "2024-01-15T12:00:00Z"
}

// カテゴリデータ
{
  id: "food",
  name: "食費",
  icon: "🍽️",
  color: "#FF6B6B"
}

// 資金元データ
{
  id: "cash",
  name: "現金",
  initialBalance: 50000,
  currentBalance: 48500,
  type: "cash"
}
```

## 📁 ファイル構成

```
PWA-HouseholdBudgetApp/
├── index.html              # メインHTML
├── manifest.json           # PWAマニフェスト
├── sw.js                   # Service Worker
├── styles/
│   └── main.css           # メインスタイル
├── js/
│   ├── app.js             # アプリケーション制御
│   ├── storage.js         # データストレージ
│   ├── data.js            # データ処理
│   ├── ui.js              # UI管理
│   ├── charts.js          # グラフ機能
│   └── calendar.js        # カレンダー機能
├── icons/                 # アプリアイコン
│   ├── icon-72x72.png
│   ├── icon-192x192.png
│   └── icon-512x512.png
└── README.md              # このファイル
```

## 🌐 公開方法

### 1. 静的ホスティング（推奨）

#### GitHub Pages
1. GitHubリポジトリを作成
2. PWA-HouseholdBudgetAppフォルダをアップロード
3. Settings → Pages → Source: Deploy from a branch
4. Branch: main, Folder: / (root)
5. `https://username.github.io/repository-name/` でアクセス

#### Netlify
1. [Netlify](https://netlify.com)にサインアップ
2. 「New site from Git」を選択
3. GitHubリポジトリを連携
4. Build settings: 
   - Build command: (空白)
   - Publish directory: PWA-HouseholdBudgetApp
5. 自動デプロイ完了

#### Vercel
1. [Vercel](https://vercel.com)にサインアップ
2. 「New Project」を選択
3. GitHubリポジトリをインポート
4. Root Directory: PWA-HouseholdBudgetApp
5. 自動デプロイ完了

### 2. 無料ホスティングサービス

#### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

#### Surge.sh
```bash
npm install -g surge
cd PWA-HouseholdBudgetApp
surge
```

### 3. 独自ドメイン設定
1. ドメインを取得（お名前.com、ムームードメインなど）
2. ホスティングサービスでカスタムドメイン設定
3. DNS設定でCNAMEレコードを追加
4. SSL証明書の自動設定を確認

## 🔧 カスタマイズ

### カテゴリの追加
`js/storage.js`の`getDefaultCategories()`を編集:
```javascript
{ id: 'new-category', name: '新カテゴリ', icon: '🎯', color: '#FF0000' }
```

### テーマカラーの変更
`styles/main.css`のCSS変数を編集:
```css
:root {
    --primary-color: #007AFF; /* メインカラー */
    --success-color: #34C759; /* 成功カラー */
}
```

### 通貨の変更
`js/data.js`の`formatCurrency()`を編集:
```javascript
return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
}).format(amount);
```

## 🐛 トラブルシューティング

### データが表示されない
1. ブラウザのローカルストレージを確認
2. 開発者ツールのConsoleでエラーを確認
3. ページを再読み込み

### PWAがインストールできない
1. HTTPSでアクセスしているか確認
2. manifest.jsonが正しく読み込まれているか確認
3. Service Workerが登録されているか確認

### オフラインで動作しない
1. Service Workerが有効か確認
2. 必要なファイルがキャッシュされているか確認
3. ネットワークタブでキャッシュ状況を確認

## 📄 ライセンス

MIT License - 自由に使用、修正、配布可能

## 🤝 貢献

バグ報告や機能要望は Issues でお知らせください。
プルリクエストも歓迎します！

## 📞 サポート

質問や問題がある場合は、以下の方法でお問い合わせください：
- GitHub Issues
- メール: support@example.com

---

**家計簿PWAアプリ** - シンプル、高速、どこでも使える家計管理ツール