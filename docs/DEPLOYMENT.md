# デプロイメントガイド

## 🚀 GitHub Pages自動デプロイ

### セットアップ手順

#### 1. 環境変数設定

1. GitHubリポジトリの **Settings** → **Environments** に移動
2. **New environment** で `github-pages` を作成
3. **Environment variables** で以下を設定：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `GAS_URL` | `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec` | Google Apps Script WebアプリURL |

#### 2. Pages設定

1. **Settings** → **Pages** に移動
2. **Source**: `GitHub Actions` を選択
3. 既存の `.github/workflows/deploy.yml` が自動的に認識されます

### デプロイフロー

```mermaid
graph LR
    A[コードプッシュ] --> B[GitHub Actions実行]
    B --> C[環境変数置換]
    C --> D[開発ファイル削除]
    D --> E[設定検証]
    E --> F[GitHub Pagesデプロイ]
    F --> G[サイト公開]
```

### 自動処理内容

1. **環境変数置換**: `{{GAS_URL}}` → 実際のGAS URL
2. **開発ファイル削除**: `.env`, 管理者ツール等を除去
3. **設定検証**: GAS URLの形式チェック
4. **デプロイ**: GitHub Pagesに公開

## 🔧 ローカル開発

### 開発環境セットアップ

1. `.env` ファイル作成：
   ```bash
   cp .env.example .env
   ```

2. GAS URLを設定：
   ```bash
   # .env
   GAS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

3. ローカルサーバー起動：
   ```bash
   python -m http.server 8000
   ```

### 開発時の動作

- `.env` ファイルから環境変数を自動読み込み
- GAS URLが未設定の場合はモック送信
- 管理者ツールが利用可能

## 🐛 トラブルシューティング

### よくある問題

**Q: デプロイが失敗する**
```
❌ エラー: GAS_URL が設定されていません
```

**A: GitHub Pages の Environment variables を確認**
1. Settings → Environments → github-pages
2. GAS_URL が正しく設定されているか確認

**Q: GAS URLの形式エラー**
```
❌ エラー: GAS_URL の形式が正しくありません
```

**A: 正しい形式で設定**
```
正: https://script.google.com/macros/s/SCRIPT_ID/exec
誤: https://script.google.com/... (不完全なURL)
```

**Q: 本番サイトでGAS通信ができない**

**A: CORSとGAS設定を確認**
1. GASで「アクセスできるユーザー: 全員」に設定
2. GASが正常にデプロイされているか確認

### デバッグ方法

**GitHub Actions ログ確認**
1. リポジトリの Actions タブ
2. 失敗したワークフローをクリック
3. 各ステップのログを確認

**ブラウザでの確認**
```javascript
// 開発者コンソールで実行
window.envLoader.debug()
window.weddingGiftConfig.debug()
```

## 📊 監視とメンテナンス

### デプロイ状況確認

- **GitHub Actions**: 自動デプロイの成功/失敗
- **GitHub Pages**: サイトの公開状況
- **Discord**: 申し込み通知の動作確認

### 定期メンテナンス

1. **月次**:
   - デプロイログの確認
   - 依存関係の更新確認

2. **申し込み期間中**:
   - Discord通知の動作確認
   - Googleスプレッドシートの確認

3. **終了後**:
   - Environment variables のクリーンアップ
   - リポジトリのアーカイブ

## 🔐 セキュリティ

### 環境変数管理

- **GitHub Secrets**: 機密情報（使用していない）
- **Environment Variables**: 公開可能な設定値
- **LocalStorage**: ユーザー選択状態のみ

### 本番環境での配慮

- 開発用ファイル（`.env`, `admin.js`）は自動削除
- GAS URLは検証済みのもののみ使用
- CORS設定でセキュリティ確保

## 📈 パフォーマンス最適化

### 自動最適化

- 開発ファイルの除去
- 不要なスクリプトの削除
- 環境変数の事前検証

### 手動最適化（オプション）

- 画像最適化：WebP形式への変換
- CSS/JS圧縮：ビルドステップに追加
- CDN利用：GitHub Pages標準機能を活用