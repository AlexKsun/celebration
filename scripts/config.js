// 設定ファイル - 本番環境では環境変数やビルド時に置き換え
class Config {
    constructor() {
        this.envLoader = window.envLoader;
        this.isInitialized = false;
        this.gasUrl = null;
        this.enableConsoleLog = false;
        this.enableDiscordNotification = true;
    }

    // 非同期初期化
    async init() {
        if (this.isInitialized) return;

        // 環境変数を読み込み
        await this.envLoader.load();

        // 設定を初期化
        this.gasUrl = this.getGasUrl();
        this.enableConsoleLog = this.isDevelopment() || this.envLoader.get('ENABLE_CONSOLE_LOG') === 'true';
        this.enableDiscordNotification = this.envLoader.get('ENABLE_DISCORD_NOTIFICATION', 'true') === 'true';

        this.isInitialized = true;
        console.log('Config初期化完了');
    }

    isDevelopment() {
        return this.envLoader.isDevelopment();
    }

    getGasUrl() {
        // 1. 環境変数から取得
        const envGasUrl = this.envLoader.get('GAS_URL');
        if (envGasUrl && envGasUrl !== 'YOUR_SCRIPT_ID') {
            return envGasUrl;
        }

        // 2. 開発環境ではモックを返す
        if (this.isDevelopment()) {
            console.warn('開発環境: GAS URLが設定されていません。モックを使用します。');
            return 'DEVELOPMENT_MOCK';
        }

        // 3. 本番環境で設定されていない場合はエラー
        throw new Error('GAS URLが設定されていません。GitHub Pages の Environment secrets で GAS_URL を設定してください。');
    }

    // 管理者用: GAS URLを手動設定
    setGasUrl(url) {
        if (!url || !url.startsWith('https://script.google.com/')) {
            throw new Error('無効なGAS URLです');
        }
        localStorage.setItem('WEDDING_GIFT_GAS_URL', url);
        this.gasUrl = url;
        console.log('GAS URLを設定しました:', url);
    }

    // 管理者用: 設定をクリア
    clearConfig() {
        localStorage.removeItem('WEDDING_GIFT_GAS_URL');
        console.log('設定をクリアしました');
    }

    // デバッグ用: 現在の設定を表示
    debug() {
        console.log('=== Wedding Gift Config ===');
        console.log('isDevelopment:', this.isDevelopment);
        console.log('gasUrl:', this.gasUrl);
        console.log('enableConsoleLog:', this.enableConsoleLog);
        console.log('enableDiscordNotification:', this.enableDiscordNotification);
    }
}

// グローバル設定インスタンス
window.weddingGiftConfig = new Config();