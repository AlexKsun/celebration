/**
 * 画像フォールバック処理
 * 商品画像が見つからない場合の代替処理
 */

// SVGプレースホルダー生成
function generatePlaceholderSvg(productName, variantName, color = '#8b5a6b') {
    const svg = `
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#f5e6e3;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#e8d4d1;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad)"/>
            <circle cx="200" cy="100" r="40" fill="${color}" opacity="0.3"/>
            <text x="200" y="160" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#8b5a6b">${productName}</text>
            <text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="14" fill="#8b5a6b">${variantName}</text>
            <text x="200" y="220" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">🎁 Image Coming Soon</text>
        </svg>
    `;

    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// 画像の読み込みを試行
function tryLoadImage(imageSrc, productData, variantData) {
    return new Promise((resolve, reject) => {
        const testImg = new Image();
        testImg.crossOrigin = 'anonymous'; // CORS対応

        testImg.onload = () => {
            console.log(`✅ 画像読み込み成功: ${imageSrc}`);
            resolve(imageSrc);
        };

        testImg.onerror = () => {
            console.warn(`❌ 画像読み込み失敗: ${imageSrc}`);
            reject(new Error(`Failed to load image: ${imageSrc}`));
        };

        testImg.src = imageSrc;
    });
}

// 複数の画像を順次試行
async function tryLoadImages(imageUrls, productData, variantData) {
    for (const url of imageUrls) {
        try {
            const successUrl = await tryLoadImage(url, productData, variantData);
            return successUrl;
        } catch (error) {
            console.warn(`画像読み込み失敗、次を試行: ${error.message}`);
        }
    }

    // すべて失敗した場合はプレースホルダー
    console.warn('すべての画像読み込みに失敗、プレースホルダーを使用');
    return null;
}

// 画像エラーハンドリング（既存関数は互換性のため維持）
function handleImageError(img, productData, variantData) {
    console.warn(`画像が見つかりません: ${img.src}`);

    // 他の画像URLがある場合は試行
    if (variantData.images && variantData.images.length > 1) {
        const currentIndex = variantData.images.indexOf(img.src) ||
                            variantData.images.findIndex(url => img.src.includes(url.split('/').pop()));

        if (currentIndex !== -1 && currentIndex < variantData.images.length - 1) {
            const nextImageUrl = variantData.images[currentIndex + 1];
            console.log(`🔄 次の画像を試行: ${nextImageUrl}`);
            img.src = nextImageUrl;
            return;
        }
    }

    // すべて失敗した場合はSVGプレースホルダーを生成
    const placeholderSvg = generatePlaceholderSvg(
        productData.name,
        variantData.name,
        variantData.color
    );

    // プレースホルダーを設定
    img.src = placeholderSvg;
    img.classList.add('placeholder-image');
    img.classList.remove('loading'); // ローディング状態を解除

    // プレースホルダーアイコンを非表示
    const placeholder = img.parentElement.querySelector('.product-image-placeholder');
    if (placeholder) {
        placeholder.style.display = 'none';
    }
}

// 最適な画像を取得（新機能）
async function getBestImage(variantData, productData) {
    if (!variantData.images || variantData.images.length === 0) {
        console.warn('画像URLが設定されていません');
        return generatePlaceholderSvg(productData.name, variantData.name, variantData.color);
    }

    try {
        const bestImageUrl = await tryLoadImages(variantData.images, productData, variantData);
        if (bestImageUrl) {
            return bestImageUrl;
        }
    } catch (error) {
        console.error('画像読み込みエラー:', error);
    }

    // フォールバック: プレースホルダー
    return generatePlaceholderSvg(productData.name, variantData.name, variantData.color);
}

// グローバル関数として公開
window.handleImageError = handleImageError;
window.generatePlaceholderSvg = generatePlaceholderSvg;
window.tryLoadImages = tryLoadImages;
window.getBestImage = getBestImage;
