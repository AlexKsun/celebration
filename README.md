# 結婚祝いカタログギフトサイト

友人の結婚祝い用のカタログギフトサイトです。シンプルで美しいデザインで、お好きな商品を1点選択できます。

## 🎯 主な機能

- **商品選択**: 全商品から1点のみ選択可能
- **バリエーション対応**: 色・サイズ等の選択
- **選択状態の永続化**: LocalStorageでユーザーの選択状態を保存し、再訪問時も復元
- **既存申し込みの管理**: Google Apps Scriptから既存の申し込み状況を取得し、UIに反映（新規申し込み/選択変更）
- **レスポンシブデザイン**: デスクトップ・タブレット・スマートフォン対応
- **Discord通知**: 選択内容をDiscordに自動通知（設定で有効/無効を切り替え可能）
- **Google Apps Script連携**: 選択データをスプレッドシートに保存し、申し込み状況を管理
- **画像遅延読み込み**: 商品画像の表示パフォーマンスを最適化
- **画像エラーフォールバック**: 画像読み込み失敗時にプレースホルダーを表示

## 🎨 デザインコンセプト

- **カラーパレット**: 優しいピンクベージュをベースとしたエレガントな配色
- **タイポグラフィ**: Noto Sans JP + Playfair Display + Dancing Script
- **スタイル**: モダンミニマル × エレガント × かわいい要素

## 📁 ファイル構成

```
wedding-gift-catalog/
├── index.html              # メインHTMLファイル
├── styles/
│   └── main.css           # アプリケーションのスタイルシート
├── scripts/
│   ├── main.js            # アプリケーションのコアロジック、UI操作、GAS連携
│   ├── env-loader.js      # 環境変数（.env, ビルド時置換, LocalStorage）の読み込み
│   ├── config.js          # アプリケーション設定の一元管理、GAS URLの取得ロジック
│   ├── storage.js         # LocalStorageによるユーザー選択、提出状況、前回選択の永続化
│   ├── image-fallback.js  # 画像読み込みエラー時のフォールバック処理
│   ├── gas-fallback.js    # GAS通信エラー時のフォールバック処理
│   ├── debug-footer.js    # 開発環境用デバッグフッター
│   └── admin.js           # 管理者用ツール（GAS URL手動設定など）
├── assets/
│   ├── images/
│   │   ├── products/      # 商品画像
│   │   └── placeholders/  # プレースホルダー画像
├── data/
│   └── products.json     # 商品データ（JSON形式）
├── gas/
│   └── Code.gs           # Google Apps Script（スプレッドシート連携、Discord通知）
└── README.md             # このファイル
```

## 🚀 セットアップ

### 1. GitHub Pages設定

#### 1.1 リポジトリ作成
1. GitHubにリポジトリを作成
2. ファイルをアップロード

#### 1.2 Environment Variables設定
1. リポジトリの Settings → Environments
2. 「New environment」で `github-pages` を作成
3. Environment variables で以下を設定：
   - `GAS_URL`: Google Apps Script WebアプリURL

#### 1.3 Pages設定
1. Settings → Pages → Source: GitHub Actions
2. 自動デプロイが開始されます
3. サイトURL: `https://[username].github.io/[repository-name]`

### 2. 商品画像の準備

`assets/images/products/` フォルダに以下の画像を配置：

```
pot_white_1.webp      # BALMUDA The Pot (ホワイト)
pot_black_1.webp      # BALMUDA The Pot (ブラック)
bruno_red.webp        # BRUNO Grill (レッド)
bruno_white.webp      # BRUNO Grill (ホワイト)
diffuser_white.webp   # MUJI Aroma Diffuser (ホワイト)
towel_blue.webp       # 今治タオルセット (ブルー)
towel_pink.webp       # 今治タオルセット (ピンク)
cups_gold.webp        # ペアマグカップ (ゴールド)
cups_silver.webp      # ペアマグカップ (シルバー)
dinner_experience.webp # 高級レストランディナー
```

**推奨仕様:**
- サイズ: 400×300px (4:3比率)
- フォーマット: WebP推奨、PNG/JPGも対応
- ファイルサイズ: 50KB以下推奨

### 3. Google Apps Script設定

#### 3.1 スプレッドシート作成

1. [Google Sheets](https://sheets.google.com) で新しいスプレッドシートを作成
2. スプレッドシートIDをコピー（URLの `/d/[SPREADSHEET_ID]/edit` 部分）

#### 3.2 Google Apps Script設定

1. [Google Apps Script](https://script.google.com) にアクセス
2. 「新しいプロジェクト」をクリック
3. `gas/Code.gs` の内容をコピー&ペースト
4. 設定部分を編集：

```javascript
const CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',  // 手順3.1のID
  DISCORD_WEBHOOK_URL: 'YOUR_DISCORD_WEBHOOK_URL',  // 手順4で取得
  SHEET_NAME: '申し込み履歴',
  TIMEZONE: 'Asia/Tokyo'
};
```

5. 「保存」をクリック
6. 「デプロイ」→「新しいデプロイ」
7. 種類: ウェブアプリ
8. 実行ユーザー: 自分
9. アクセスできるユーザー: 全員
10. 「デプロイ」をクリック
11. WebアプリURLをコピー

#### 3.3 フロントエンド設定

GAS URLを含むアプリケーションの設定は、以下の優先順位で読み込まれます。

1. **LocalStorage**: 管理者ツール (`WeddingGiftAdmin.setGasUrl()`) で手動設定された値が最優先されます。
2. **ビルド時置換**: GitHub Pagesなどの本番環境で、ビルド時に `window.ENV` オブジェクトに設定された値（例: GitHub Environment Variables）。
3. **`.env` ファイル**: 開発環境 (`localhost` など) の場合、プロジェクトルートの `.env` ファイルから読み込まれます。

**開発環境でのGAS URL:**
開発環境では、`GAS_URL` が設定されていない場合、自動的に `DEVELOPMENT_MOCK` が使用されます。これにより、実際のGASデプロイなしでフロントエンドの動作確認が可能です。

`.env` ファイルに設定：
```bash
# .env ファイル
GAS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
# その他の設定例
ENABLE_CONSOLE_LOG=true         # コンソールログを有効にする (デフォルト: 開発環境のみ有効)
ENABLE_DISCORD_NOTIFICATION=false # Discord通知を無効にする (デフォルト: true)
```

**本番環境（GitHub Pages）でのGAS URL:**
GitHub の Environment variables で `GAS_URL` を設定します（手順1.2で設定済み）。

**手動設定（緊急時・デバッグ用）:**
ブラウザの開発者コンソールで `WeddingGiftAdmin.setGasUrl()` を実行することで、一時的にGAS URLを設定できます。
```javascript
// ブラウザのコンソールで実行
WeddingGiftAdmin.setGasUrl('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec');
```

### 4. Discord Webhook設定

#### 4.1 Discord設定

1. Discordサーバーで通知用チャンネルを作成
2. チャンネル設定 → 連携サービス → ウェブフック
3. 「新しいウェブフック」をクリック
4. 名前: `カタログギフト通知`
5. Webhook URLをコピー

#### 4.2 GAS設定

Google Apps ScriptのCONFIGでWebhook URLを設定：

```javascript
DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/...'
```

### 5. テスト

#### 5.1 GAS動作確認

1. Google Apps Scriptで `testFunction` を実行
2. スプレッドシートにテストデータが追加されるか確認
3. Discordに通知が送信されるか確認

#### 5.2 フロントエンド確認

1. ローカルでHTTPサーバーを起動:
   ```bash
   # Python 3の場合
   python -m http.server 8000

   # Node.jsのlive-serverの場合
   npx live-server
   ```

2. ブラウザで `http://localhost:8000` にアクセス
3. 開発者コンソールで管理者ツールを使用:
   ```javascript
   // 設定確認
   WeddingGiftAdmin.showConfig()

   // GAS URL設定
   WeddingGiftAdmin.setGasUrl('YOUR_GAS_URL')

   // 接続テスト
   WeddingGiftAdmin.testGasConnection()
   ```
4. 商品選択・申し込み機能をテスト

## 🎯 使い方

### ユーザー操作

1. サイトにアクセス
2. カテゴリーで商品を絞り込み（オプション）
3. 商品を1点選択
4. 色・バリエーションを選択
5. 「この商品に決定する」をクリック
6. 確認モーダルで「決定する」をクリック
7. 完了！

### 管理者確認

- **Googleスプレッドシート**: 申し込み履歴スプレッドシートで、ユーザーの選択内容と申し込み日時を確認できます。
- **Discord**: 設定が有効な場合、Discordの指定チャンネルにリアルタイムで申し込み通知が送信されます。

## 🔄 バージョン管理とキャッシュクリア

アプリケーションには自動キャッシュクリア機能が実装されています。

### バージョン更新手順

コードを更新した場合、**たった1箇所**を変更するだけでOKです：

1. **`scripts/version.js`** のバージョン番号を更新：
   ```javascript
   this.currentVersion = '1.0.5'; // バージョンアップ
   ```

2. デプロイ時、GitHub Actionsが自動的に全てのリソースURL（CSS/JS）にバージョン番号を追加します
   - `index.html`の手動更新は不要
   - `version.js`から自動的にバージョン番号を抽出
   - 全てのリソースに`?v=1.0.5`が自動追加される

### 自動キャッシュクリア機能

- ユーザーがサイトにアクセスした際、保存されているバージョンと現在のバージョンを比較
- バージョンが異なる場合、自動的に古いLocalStorageデータをクリア
- 1回だけページをリロードして、最新のコードとデータで動作

### 手動キャッシュクリア（デバッグ用）

開発中にキャッシュを強制的にクリアしたい場合：

```javascript
// ブラウザのコンソールで実行
window.versionManager.forceClearCache()
```

## 🔧 カスタマイズ

### 環境変数による設定

`.env` ファイル（開発環境）または GitHub Environment Secrets（本番環境）で以下の設定を調整できます。

- `ENABLE_CONSOLE_LOG`: `true` に設定すると、詳細なコンソールログが出力されます。開発・デバッグ時に便利です。（デフォルト: 開発環境のみ `true`）
- `ENABLE_DISCORD_NOTIFICATION`: `false` に設定すると、Discordへの通知が無効になります。（デフォルト: `true`）

### 商品データ変更

`data/products.json` を編集して商品を追加・変更できます：

```json
{
  "products": [
    {
      "id": "new_product",
      "name": "新商品",
      "brand": "ブランド名",
      "category": "kitchen",
      "specs": "仕様",
      "description": "説明",
      "variants": [
        {
          "id": "variant1",
          "name": "バリエーション名",
          "color": "#ffffff",
          "images": ["/assets/images/products/new_product.webp"],
          "available": true
        }
      ],
      "defaultVariant": "variant1"
    }
  ]
}
```

### スタイル変更

`styles/main.css` のCSS変数を編集：

```css
:root {
  --primary-color: #f5e6e3;    /* メインカラー */
  --secondary-color: #e8d4d1;  /* サブカラー */
  --accent-color: #8b5a6b;     /* アクセントカラー */
  --text-color: #2c2c2c;       /* テキストカラー */
  --background-color: #fafafa; /* 背景色 */
}
```

## 🐛 トラブルシューティング

### よくある問題

**Q: 商品画像が表示されない**
A: 画像ファイルのパスとファイル名を確認してください。ブラウザの開発者ツールで404エラーがないかチェック。

**Q: 申し込みが送信されない**
A: ブラウザのコンソールでエラーを確認。GAS URLが正しく設定されているかチェック。

**Q: Discord通知が来ない**
A: Webhook URLが正しく設定されているか確認。GASのログでエラーをチェック。

**Q: LocalStorageがリセットされる**
A: プライベートブラウジングモードやクッキー削除でリセットされます。通常モードで使用してください。

### デバッグ方法

1. **ブラウザ開発者ツール**:
   - Console: エラーメッセージを確認
   - Network: API通信を確認
   - Application → Local Storage: 保存データを確認

2. **Google Apps Script**:
   - 実行履歴でエラーを確認
   - Logger.log()でデバッグ出力

3. **ファイル確認**:
   ```bash
   # ローカルHTTPサーバーでテスト
   python -m http.server 8000
   ```

## 📝 ライセンス

このプロジェクトは個人利用目的で作成されています。

## 🙋‍♀️ サポート

設定や使い方でご不明な点がございましたら、お気軽にお声がけください。

---

素敵な結婚祝いになりますように！ 🎉💕
