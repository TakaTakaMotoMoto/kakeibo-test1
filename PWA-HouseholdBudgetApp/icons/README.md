# アイコンファイルについて

このフォルダには以下のサイズのアイコンファイルが必要です：

## 必要なアイコンファイル

- `icon-72x72.png` (72×72px)
- `icon-96x96.png` (96×96px)
- `icon-128x128.png` (128×128px)
- `icon-144x144.png` (144×144px)
- `icon-152x152.png` (152×152px)
- `icon-192x192.png` (192×192px)
- `icon-384x384.png` (384×384px)
- `icon-512x512.png` (512×512px)

## アイコンデザイン

家計簿アプリらしいデザインを推奨：
- 📊 グラフアイコン
- 💰 お金のアイコン
- 📱 アプリらしいデザイン
- 背景色: #007AFF (青)
- アイコン色: 白

## アイコン生成方法

### オンラインツール
1. [PWA Builder](https://www.pwabuilder.com/imageGenerator)
2. [Favicon Generator](https://realfavicongenerator.net/)
3. [App Icon Generator](https://appicon.co/)

### 手動作成
1. 512×512pxの基本アイコンを作成
2. 各サイズにリサイズ
3. PNG形式で保存

## 一時的な代替案

アイコンファイルがない場合、以下のSVGをPNGに変換して使用可能：

```svg
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="64" fill="#007AFF"/>
  <text x="256" y="320" font-family="Arial" font-size="200" text-anchor="middle" fill="white">📊</text>
</svg>
```

このSVGを各サイズのPNGに変換してください。