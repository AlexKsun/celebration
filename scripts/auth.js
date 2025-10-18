// パスワード認証
class PasswordAuth {
    constructor() {
        this.storageKey = 'wedding_gift_auth';
        this.sessionKey = 'wedding_gift_session';
        this.defaultPassword = 'wedding2024'; // デフォルトパスワード
    }

    // 初期化
    async init() {
        // 環境変数からパスワードを取得
        await this.loadPassword();

        // 既に認証済みかチェック
        if (this.isAuthenticated()) {
            this.hidePasswordOverlay();
            return;
        }

        // bodyをロック
        document.body.classList.add('password-locked');

        // フォーム送信イベント
        const form = document.getElementById('passwordForm');
        const input = document.getElementById('passwordInput');

        if (form && input) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.checkPassword(input.value);
            });

            // 入力フィールドにフォーカス
            setTimeout(() => input.focus(), 500);
        }
    }

    // 環境変数からパスワードを読み込み
    async loadPassword() {
        try {
            // envLoaderが初期化されるまで待つ
            if (window.envLoader) {
                await window.envLoader.load();
                const envPassword = window.envLoader.get('AUTH_PASSWORD');
                if (envPassword) {
                    this.correctPassword = envPassword;
                    console.log('✅ パスワードを環境変数から読み込みました');
                    return;
                }
            }
        } catch (error) {
            console.warn('環境変数からのパスワード読み込みに失敗:', error);
        }

        // 環境変数がない場合はデフォルトを使用
        this.correctPassword = this.defaultPassword;
        console.log('⚠️ デフォルトパスワードを使用します');
    }

    // パスワードチェック
    checkPassword(inputPassword) {
        const errorDiv = document.getElementById('passwordError');
        const input = document.getElementById('passwordInput');

        if (inputPassword === this.correctPassword) {
            // 認証成功
            this.setAuthenticated();
            this.hidePasswordOverlay();

            // エラー表示をクリア
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        } else {
            // 認証失敗
            if (errorDiv) {
                errorDiv.style.display = 'flex';
            }

            // 入力フィールドを揺らすアニメーション
            if (input) {
                input.classList.add('error');
                setTimeout(() => input.classList.remove('error'), 500);
                input.value = '';
                input.focus();
            }
        }
    }

    // 認証済みとしてマーク
    setAuthenticated() {
        // セッションストレージに保存（タブを閉じたら消える）
        sessionStorage.setItem(this.sessionKey, 'true');

        // ローカルストレージにも保存（ブラウザキャッシュ）
        const now = new Date().getTime();
        const authData = {
            authenticated: true,
            timestamp: now
        };
        localStorage.setItem(this.storageKey, JSON.stringify(authData));

        console.log('✅ 認証成功');
    }

    // 認証済みかチェック
    isAuthenticated() {
        // セッションストレージをチェック（タブが開いている間は有効）
        const sessionAuth = sessionStorage.getItem(this.sessionKey);
        if (sessionAuth === 'true') {
            console.log('✅ セッション認証済み');
            return true;
        }

        // ローカルストレージをチェック（7日間有効）
        const authDataStr = localStorage.getItem(this.storageKey);
        if (authDataStr) {
            try {
                const authData = JSON.parse(authDataStr);
                const now = new Date().getTime();
                const sevenDays = 7 * 24 * 60 * 60 * 1000;

                if (authData.authenticated && (now - authData.timestamp) < sevenDays) {
                    // セッションストレージにも設定
                    sessionStorage.setItem(this.sessionKey, 'true');
                    console.log('✅ ローカルストレージから認証復元');
                    return true;
                } else {
                    // 期限切れ
                    localStorage.removeItem(this.storageKey);
                    console.log('⏰ 認証期限切れ');
                }
            } catch (error) {
                console.error('認証データの解析エラー:', error);
                localStorage.removeItem(this.storageKey);
            }
        }

        return false;
    }

    // パスワードオーバーレイを非表示
    hidePasswordOverlay() {
        const overlay = document.getElementById('passwordOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            setTimeout(() => {
                overlay.style.display = 'none';
                document.body.classList.remove('password-locked');
            }, 500);
        }
    }

    // 認証をクリア（デバッグ用）
    clearAuth() {
        sessionStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.storageKey);
        console.log('🔓 認証をクリアしました。ページをリロードしてください。');
    }
}

// グローバルインスタンス
window.passwordAuth = new PasswordAuth();

// ページ読み込み時に初期化（他のスクリプトより先に実行）
window.passwordAuth.init();

// デバッグ用
console.log('🔐 パスワード認証システム初期化完了');
console.log('💡 デバッグコマンド: window.passwordAuth.clearAuth() で認証をクリア');
