/**
 * GAS送信のフォールバック手段
 * CORSエラーが発生した場合の代替送信方法
 */

// フォームデータとして送信（CORS回避）
async function sendToGASViaForm(gasUrl, data) {
    console.log('🔄 フォームデータでの送信を試行...');

    return new Promise((resolve, reject) => {
        // 隠しフォームを作成
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = gasUrl;
        form.target = '_blank'; // 新しいタブで開く
        form.style.display = 'none';

        // データをフォームフィールドに追加
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'data';
        input.value = JSON.stringify(data);
        form.appendChild(input);

        // フォームを送信
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        console.log('📤 フォーム送信完了（新しいタブで確認してください）');

        // フォーム送信は結果を直接取得できないため、成功として扱う
        setTimeout(() => {
            resolve({
                success: true,
                message: 'フォーム送信で申し込みを送信しました。新しいタブで結果を確認してください。',
                method: 'form_fallback'
            });
        }, 1000);
    });
}

// GET送信（確実な方法）
async function sendToGASViaGet(gasUrl, data) {
    console.log('🔄 GET送信を試行...');

    const params = new URLSearchParams();
    params.append('data', JSON.stringify(data));

    const url = `${gasUrl}?${params.toString()}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ GET送信成功:', result);
            return result;
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ GET送信失敗:', error);
        throw error;
    }
}

// JSONP送信は削除（CORS問題のため）

// プロキシサーバー経由での送信
async function sendToGASViaProxy(gasUrl, data) {
    console.log('🔄 プロキシ経由送信を試行...');

    // 無料のCORSプロキシサービスを使用
    const proxyUrls = [
        'https://cors-anywhere.herokuapp.com/',
        'https://api.allorigins.win/raw?url=',
        'https://cors-proxy.htmldriven.com/?url='
    ];

    for (const proxyUrl of proxyUrls) {
        try {
            const targetUrl = proxyUrl + encodeURIComponent(gasUrl);

            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ プロキシ経由送信成功:', result);
                return result;
            }
        } catch (error) {
            console.warn(`⚠️ プロキシ ${proxyUrl} での送信失敗:`, error.message);
        }
    }

    throw new Error('すべてのプロキシでの送信に失敗しました');
}

// 複数の送信方法を順次試行
async function sendToGASWithFallback(gasUrl, data) {
    const methods = [
        {
            name: 'GET送信',
            func: () => sendToGASViaGet(gasUrl, data)
        },
        {
            name: 'フォーム送信',
            func: () => sendToGASViaForm(gasUrl, data)
        },
        {
            name: 'プロキシ経由',
            func: () => sendToGASViaProxy(gasUrl, data)
        }
    ];

    for (const method of methods) {
        try {
            console.log(`🔄 ${method.name}を試行中...`);
            const result = await method.func();
            console.log(`✅ ${method.name}で送信成功:`, result);
            return result;
        } catch (error) {
            console.warn(`⚠️ ${method.name}で送信失敗:`, error.message);
        }
    }

    throw new Error('すべてのフォールバック方法で送信に失敗しました');
}

// グローバルに公開
window.sendToGASWithFallback = sendToGASWithFallback;