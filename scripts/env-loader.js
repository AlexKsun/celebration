/**
 * 環境変数ローダー
 * 開発環境では .env ファイルから、本番環境では GitHub Pages の Environment secrets から読み込み
 */
class EnvLoader {
    constructor() {
        this.env = {};
        this.isLoaded = false;
    }

    // 環境変数を読み込み
    async load() {
        if (this.isLoaded) return this.env;

        try {
            // 開発環境での .env ファイル読み込み
            if (this.isDevelopment()) {
                await this.loadFromEnvFile();
            }

            // ビルド時に置換された環境変数を読み込み
            this.loadFromBuildTime();

            // LocalStorage からの設定を読み込み
            this.loadFromLocalStorage();

            this.isLoaded = true;
            console.log('環境変数読み込み完了:', this.env);

        } catch (error) {
            console.warn('環境変数読み込みエラー:', error);
        }

        return this.env;
    }

    // 開発環境判定
    isDevelopment() {
        return (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '' ||
            window.location.protocol === 'file:'
        );
    }

    // .env ファイルから読み込み（開発環境のみ）
    async loadFromEnvFile() {
        try {
            const response = await fetch('./.env');
            if (response.ok) {
                const envText = await response.text();
                this.parseEnvFile(envText);
                console.log('.env ファイルから環境変数を読み込みました');
            }
        } catch (error) {
            console.log('.env ファイルが見つかりません（開発環境では正常）');
        }
    }

    // .env ファイルの内容をパース
    parseEnvFile(envText) {
        const lines = envText.split('\n');
        lines.forEach(line => {
            line = line.trim();

            // コメント行や空行をスキップ
            if (!line || line.startsWith('#')) return;

            // KEY=VALUE 形式をパース
            const equalIndex = line.indexOf('=');
            if (equalIndex > 0) {
                const key = line.substring(0, equalIndex).trim();
                const value = line.substring(equalIndex + 1).trim();

                // クォートを削除
                const cleanValue = value.replace(/^["']|["']$/g, '');
                this.env[key] = cleanValue;
            }
        });
    }

    // ビルド時に置換された環境変数を読み込み
    loadFromBuildTime() {
        // window.ENV はビルド時に設定される
        if (window.ENV) {
            Object.keys(window.ENV).forEach(key => {
                const value = window.ENV[key];

                // プレースホルダーでない場合のみ設定
                if (value && !value.startsWith('{{') && !value.endsWith('}}')) {
                    this.env[key] = value;
                }
            });
        }
    }

    // LocalStorage からの設定を読み込み
    loadFromLocalStorage() {
        // 管理者が手動設定した値を優先
        const gasUrl = localStorage.getItem('WEDDING_GIFT_GAS_URL');
        if (gasUrl) {
            this.env.GAS_URL = gasUrl;
        }
    }

    // 環境変数を取得
    get(key, defaultValue = null) {
        if (!this.isLoaded) {
            console.warn('環境変数がまだ読み込まれていません。EnvLoader.load() を呼び出してください。');
        }
        return this.env[key] || defaultValue;
    }

    // 全ての環境変数を取得
    getAll() {
        return { ...this.env };
    }

    // デバッグ用
    debug() {
        console.log('=== Environment Variables ===');
        console.log('isDevelopment:', this.isDevelopment());
        console.log('isLoaded:', this.isLoaded);
        console.log('env:', this.env);
    }
}

// グローバルインスタンス
window.envLoader = new EnvLoader();