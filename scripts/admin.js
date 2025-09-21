/**
 * 管理者用設定ツール
 * ブラウザのコンソールで実行してGAS URLを設定できます
 */

// 管理者用の設定ヘルパー
window.WeddingGiftAdmin = {
    // GAS URLを設定
    setGasUrl(url) {
        try {
            window.weddingGiftConfig.setGasUrl(url);
            alert('GAS URLを設定しました。ページをリロードしてください。');
        } catch (error) {
            alert('エラー: ' + error.message);
        }
    },

    // 現在の設定を表示
    showConfig() {
        window.weddingGiftConfig.debug();
    },

    // 設定をクリア
    clearConfig() {
        if (confirm('設定をクリアしますか？')) {
            window.weddingGiftConfig.clearConfig();
            alert('設定をクリアしました。ページをリロードしてください。');
        }
    },

    // GAS接続テスト（GET）
    async testGasConnectionGet() {
        try {
            console.log('🔍 GAS接続テスト (GET) 開始...');
            const gasUrl = window.weddingGiftConfig.gasUrl;

            if (!gasUrl || gasUrl === 'DEVELOPMENT_MOCK') {
                throw new Error('GAS URLが設定されていません');
            }

            const response = await fetch(gasUrl, {
                method: 'GET',
                mode: 'cors'
            });

            console.log('GET レスポンス:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ GAS GET接続テスト成功:', result);
                alert('GAS GET接続テスト成功！CORSは正しく設定されています。');
                return true;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ GAS GET接続テスト失敗:', error);
            alert('GAS GET接続テスト失敗: ' + error.message);
            return false;
        }
    },

    // GAS接続テスト（POST）
    async testGasConnection() {
        // まずGETテストを実行
        const getSuccess = await this.testGasConnectionGet();
        if (!getSuccess) {
            console.log('GET接続テストが失敗したため、POSTテストをスキップします');
            return;
        }

        try {
            console.log('🔍 GAS接続テスト (POST) 開始...');

            const testData = {
                selectedItem: {
                    id: 'test_product',
                    name: 'テスト商品',
                    brand: 'TEST',
                    category: 'test',
                    variant: {
                        id: 'test_variant',
                        name: 'テストバリエーション',
                        color: '#ff0000'
                    }
                },
                timestamp: new Date().toISOString(),
                isChange: false,
                isTest: true
            };

            const response = await fetch(window.weddingGiftConfig.gasUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testData),
                mode: 'cors'
            });

            console.log('POST レスポンス:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ GAS POST接続テスト成功:', result);
                alert('GAS POST接続テスト成功！データ送信が正常に動作します。');
            } else {
                const errorText = await response.text();
                console.error('POST エラー詳細:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }
        } catch (error) {
            console.error('❌ GAS POST接続テスト失敗:', error);
            alert('GAS POST接続テスト失敗: ' + error.message);
        }
    },

    // 詳細診断
    async diagnose() {
        console.log('🔍 === 詳細診断開始 ===');

        // 1. 環境変数確認
        console.log('1. 環境変数状況:');
        if (window.envLoader) {
            await window.envLoader.load();
            console.log('   envLoader:', window.envLoader.getAll());
        } else {
            console.error('   ❌ envLoader が見つかりません');
        }

        // 2. 設定確認
        console.log('2. Config状況:');
        if (window.weddingGiftConfig) {
            await window.weddingGiftConfig.init();
            window.weddingGiftConfig.debug();
        } else {
            console.error('   ❌ weddingGiftConfig が見つかりません');
        }

        // 3. DOM確認
        console.log('3. DOM要素確認:');
        console.log('   .env ファイル読み込み可能:', await this.checkEnvFile());

        // 4. ネットワーク確認
        console.log('4. ネットワーク確認:');
        await this.checkNetworkConnection();

        console.log('🔍 === 診断完了 ===');
    },

    // .envファイル確認
    async checkEnvFile() {
        try {
            const response = await fetch('./.env');
            if (response.ok) {
                const envText = await response.text();
                console.log('   .env ファイル内容:', envText);
                return true;
            } else {
                console.log('   .env ファイル見つからず (Status:', response.status, ')');
                return false;
            }
        } catch (error) {
            console.log('   .env ファイル読み込みエラー:', error.message);
            return false;
        }
    },

    // ネットワーク接続確認
    async checkNetworkConnection() {
        try {
            const response = await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
            console.log('   ✅ インターネット接続正常');
        } catch (error) {
            console.log('   ❌ インターネット接続に問題があります:', error.message);
        }
    },

    // 使い方を表示
    help() {
        console.log(`
🔧 Wedding Gift Admin Tools

基本的な使い方:
1. GAS URLを設定: WeddingGiftAdmin.setGasUrl('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec')
2. 設定確認: WeddingGiftAdmin.showConfig()
3. GET接続テスト: WeddingGiftAdmin.testGasConnectionGet()
4. POST接続テスト: WeddingGiftAdmin.testGasConnection()
5. 設定クリア: WeddingGiftAdmin.clearConfig()
6. 詳細診断: WeddingGiftAdmin.diagnose()

CORSエラーが発生した場合:
1. Google Apps Scriptを再デプロイしてください
2. GASの設定で「アクセスできるユーザー: 全員」になっているか確認
3. GET接続テストから順番に実行してください

このヘルプを再表示: WeddingGiftAdmin.help()
        `);
    }
};

// 管理者ツールの存在を通知
console.log('🔧 Wedding Gift Admin Tools が利用可能です。WeddingGiftAdmin.help() でヘルプを表示できます。');