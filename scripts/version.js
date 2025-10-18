// アプリケーションバージョン管理
// キャッシュ問題を解決するため、バージョンが変わったら古いデータをクリアする

class VersionManager {
    constructor() {
        // バージョン番号（更新時にこれを変更する）
        this.currentVersion = '1.0.4';
        this.versionKey = 'wedding_gift_app_version';
    }

    // バージョンチェックとキャッシュクリア
    checkAndClearOldCache() {
        try {
            const storedVersion = localStorage.getItem(this.versionKey);

            console.log('🔍 バージョンチェック:', {
                current: this.currentVersion,
                stored: storedVersion
            });

            // バージョンが異なる場合、または初回アクセスの場合
            if (!storedVersion || storedVersion !== this.currentVersion) {
                console.log('🧹 古いキャッシュを検出 - クリア開始');
                this.clearAllCache();

                // 新しいバージョンを保存
                localStorage.setItem(this.versionKey, this.currentVersion);

                console.log('✅ キャッシュクリア完了 - 新バージョン:', this.currentVersion);

                // ユーザーに通知（オプション）
                if (storedVersion) {
                    console.log(`📢 アプリが ${storedVersion} から ${this.currentVersion} に更新されました`);
                }

                return true; // キャッシュがクリアされた
            }

            console.log('✅ バージョン一致 - キャッシュクリア不要');
            return false; // キャッシュクリア不要
        } catch (error) {
            console.error('❌ バージョンチェックエラー:', error);
            return false;
        }
    }

    // すべてのアプリ関連キャッシュをクリア
    clearAllCache() {
        try {
            // LocalStorageから特定のキーを削除
            const keysToRemove = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                // バージョンキー以外のアプリ関連キーを収集
                if (key && key.startsWith('wedding_gift_') && key !== this.versionKey) {
                    keysToRemove.push(key);
                }
            }

            // 収集したキーを削除
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log('🗑️ 削除:', key);
            });

            console.log(`✅ ${keysToRemove.length}個のキャッシュエントリを削除しました`);

            // SessionStorageもクリア（オプション）
            sessionStorage.clear();

        } catch (error) {
            console.error('❌ キャッシュクリアエラー:', error);
        }
    }

    // 現在のバージョンを取得
    getCurrentVersion() {
        return this.currentVersion;
    }

    // 強制的にキャッシュをクリア（デバッグ用）
    forceClearCache() {
        console.log('🔧 強制キャッシュクリアを実行');
        this.clearAllCache();
        localStorage.removeItem(this.versionKey);
        console.log('✅ 強制キャッシュクリア完了');
    }
}

// グローバルに公開
window.versionManager = new VersionManager();

// ページ読み込み時に自動チェック
document.addEventListener('DOMContentLoaded', () => {
    const wasCleared = window.versionManager.checkAndClearOldCache();

    if (wasCleared) {
        // キャッシュがクリアされた場合、ページをリロード（オプション）
        // 注意: 無限ループを防ぐため、リロードは1回のみ
        const reloadFlag = sessionStorage.getItem('version_reload_done');
        if (!reloadFlag) {
            sessionStorage.setItem('version_reload_done', 'true');
            console.log('🔄 キャッシュクリア後、ページをリロードします...');
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
    }
});

// デバッグ用: コンソールから実行可能
console.log('💡 デバッグコマンド: window.versionManager.forceClearCache() でキャッシュを強制クリア');
