// メインJavaScript
class WeddingGiftCatalog {
    constructor() {
        this.products = [];
        this.selectedProduct = null;
        this.selectedVariant = null;
        this.storage = window.weddingGiftStorage;
        this.currentCategory = 'all';
        this.hasExistingApplication = false; // GASから取得した申し込み状況
        this.existingApplicationData = null; // 既存申し込みデータ

        this.init();
    }

    async init() {
        try {
            console.log('🚀 カタログ初期化開始');
            // フッターの初期表示を確保
            this.ensureFooterDisplay();

            // 設定を初期化
            await this.storage.init?.() || Promise.resolve();
            await window.weddingGiftConfig.init();

            // 申し込み状況を確認
            await this.checkApplicationStatus();

            console.log('📦 商品データ読み込み中...');
            await this.loadProducts();
            console.log('✅ 商品データ読み込み完了');

            this.setupEventListeners();
            this.restoreSelection();
            console.log('🎨 商品描画を呼び出し中...');
            this.renderProducts();
            console.log('✅ 商品描画呼び出し完了');
            this.updateFooter();
            this.adjustBodyPadding(); // フッターの高さに合わせてbodyのpadding-bottomを調整

            // 初期化完了後に再度フッター表示を確認
            setTimeout(() => this.ensureFooterDisplay(), 100);
            console.log('🎉 カタログ初期化完了');
            this.hideLoading(document.getElementById('loadingOverlay')); // 初期ロード完了後にローディングを非表示
        } catch (error) {
            console.error('初期化エラー:', error);
            this.showError('商品データの読み込みに失敗しました。');
            this.hideLoading(document.getElementById('loadingOverlay')); // エラー時もローディングを非表示
        }
    }

    // フッターの表示を確保
    ensureFooterDisplay() {
        const footer = document.getElementById('footerSelection');
        const decideButton = document.getElementById('decideButton');
        const summary = document.getElementById('selectionSummary');

        if (footer) {
            footer.style.display = 'flex';
            footer.style.position = 'fixed';
            footer.style.bottom = '0';
            footer.style.left = '0';
            footer.style.right = '0';
            footer.style.zIndex = '1000';
            footer.style.visibility = 'visible';
            footer.style.opacity = '1';
            footer.style.backgroundColor = '#ffffff';
            console.log('✅ Footer表示を強制実行');
        }

        if (decideButton) {
            decideButton.style.display = 'flex';
            decideButton.style.visibility = 'visible';
            console.log('✅ Decide Button表示を強制実行');
        }

        if (summary) {
            summary.style.display = 'block';
            summary.style.visibility = 'visible';
            console.log('✅ Summary表示を強制実行');
        }
    }

    // bodyのpadding-bottomをフッターの高さに合わせて調整
    adjustBodyPadding() {
        const footer = document.getElementById('footerSelection');
        if (footer) {
            const footerHeight = footer.offsetHeight;
            document.body.style.paddingBottom = `${footerHeight + 20}px`; // フッターの高さ + 少し余白
            console.log(`📐 bodyのpadding-bottomを${footerHeight + 20}pxに調整`);
        }
    }

    // 商品データを読み込み
    async loadProducts() {
        try {
            const response = await fetch('./data/products.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.products = data.products;
        } catch (error) {
            console.error('商品データ読み込みエラー:', error);
            throw error;
        }
    }

    // イベントリスナーを設定
    setupEventListeners() {
        // カテゴリーボタン
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByCategory(e.target.dataset.category);
            });
        });

        // 決定ボタン
        const decideButton = document.getElementById('decideButton');
        decideButton.addEventListener('click', () => {
            this.showConfirmModal();
        });

        // ウィンドウのリサイズイベント
        window.addEventListener('resize', () => {
            this.adjustBodyPadding();
        });

        // モーダル関連
        this.setupModalEventListeners();
    }

    // モーダルのイベントリスナー
    setupModalEventListeners() {
        const confirmModal = document.getElementById('confirmModal');
        const completionModal = document.getElementById('completionModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const submitBtn = document.getElementById('submitBtn');
        const closeCompletionBtn = document.getElementById('closeCompletionBtn');

        // 確認モーダルのキャンセル
        cancelBtn.addEventListener('click', () => {
            this.hideModal(confirmModal);
        });

        // 確認モーダルの送信
        submitBtn.addEventListener('click', () => {
            this.submitSelection();
        });

        // 完了モーダルを閉じる
        closeCompletionBtn.addEventListener('click', () => {
            this.hideModal(completionModal);
        });

        // モーダル背景クリックで閉じる
        [confirmModal, completionModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal);
                }
            });
        });

        // ESCキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal(confirmModal);
                this.hideModal(completionModal);
            }
        });
    }

    // カテゴリーでフィルタリング
    filterByCategory(category) {
        this.currentCategory = category;

        // カテゴリーボタンのアクティブ状態を更新
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        this.renderProducts();
    }

    // 商品を描画
    renderProducts() {
        console.log('🎨 商品描画開始');
        const grid = document.getElementById('productsGrid');

        if (!grid) {
            console.error('❌ productsGrid要素が見つかりません');
            return;
        }

        console.log('📦 商品数:', this.products.length);
        console.log('🔍 現在のカテゴリ:', this.currentCategory);

        grid.innerHTML = '';

        const filteredProducts = this.currentCategory === 'all'
            ? this.products
            : this.products.filter(p => p.category === this.currentCategory);

        console.log('📋 フィルター後商品数:', filteredProducts.length);

        filteredProducts.forEach((product, index) => {
            console.log(`🔧 商品カード作成中 ${index + 1}/${filteredProducts.length}:`, product.name);
            const card = this.createProductCard(product);
            grid.appendChild(card);

            // ボタンが正しく作成されているか確認
            const button = card.querySelector('.select-button');
            console.log(`🔘 選択ボタン確認 ${product.name}:`, {
                buttonExists: !!button,
                buttonText: button?.textContent?.trim(),
                buttonVisible: button ? getComputedStyle(button).display !== 'none' : false
            });
        });

        console.log('✅ 商品描画完了');

        // 選択状態を復元
        this.updateProductSelection();
    }

    // 商品カードを作成
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.productId = product.id;

        const defaultVariant = product.variants.find(v => v.id === product.defaultVariant) || product.variants[0];
        // imageSrcが空の場合でも、data-src属性は設定する
        const imageSrc = defaultVariant.images[0] || '';

        card.innerHTML = `
            <div class="product-image-container">
                <img
                    class="product-image loading"
                    data-src="${imageSrc}"
                    alt="${product.name}"
                    loading="lazy"
                />
                <div class="product-image-placeholder">🎁</div>
            </div>
            <div class="product-content">
                <div class="product-header">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-brand">${product.brand}</p>
                    ${product.productUrl ? `
                        <a href="${product.productUrl}" target="_blank" rel="noopener noreferrer" class="product-link">
                            <span class="material-icons">launch</span> 商品ページ
                        </a>
                    ` : ''}
                </div>
                <p class="product-specs">${product.specs}</p>
                <p class="product-description">${product.description}</p>

                ${this.createVariantSelection(product)}

                <button class="select-button" data-product-id="${product.id}">
                    <span class="material-icons">add_circle</span>
                    この商品を選ぶ
                </button>
            </div>
        `;

        // 画像の遅延読み込み
        this.setupLazyLoading(card);

        // 商品選択ボタンのイベント
        const selectButton = card.querySelector('.select-button');
        selectButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectProduct(product.id);
        });

        // バリエーション選択のイベント
        this.setupVariantEvents(card, product);

        return card;
    }

    // バリエーション選択UIを作成
    createVariantSelection(product) {
        const hasColors = product.variants.some(v => v.color);

        // バリエーションが1つでも、色情報があれば表示する
        if (!hasColors && product.variants.length <= 1) {
            return ''; // 色情報がなく、バリエーションも1つ以下なら表示しない
        }

        return `
            <div class="variant-selection">
                ${hasColors ? `
                    <label class="variant-label">色：</label>
                    <div class="color-options">
                        ${product.variants.map(variant => `
                            <div
                                class="color-option ${variant.id === product.defaultVariant ? 'selected' : ''}"
                                data-variant-id="${variant.id}"
                                style="background-color: ${variant.color}"
                                title="${variant.name}"
                            ></div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // バリエーション選択のイベントを設定
    setupVariantEvents(card, product) {
        const colorOptions = card.querySelectorAll('.color-option');
        const productImage = card.querySelector('.product-image');

        colorOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();

                // 選択状態を更新
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');

                // 画像を変更
                const variantId = option.dataset.variantId;
                const variant = product.variants.find(v => v.id === variantId);
                if (variant && variant.images[0]) {
                    productImage.src = variant.images[0];
                }

                // 現在選択中の商品の場合、選択状態を更新
                if (this.selectedProduct === product.id) {
                    this.selectedVariant = variantId;
                    this.storage.saveSelection(product.id, variantId, product);
                    this.updateFooter();
                }
            });
        });
    }

    // 遅延読み込みを設定
    setupLazyLoading(card) {
        const img = card.querySelector('.product-image');
        const placeholder = card.querySelector('.product-image-placeholder');

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(img, placeholder);
                        observer.unobserve(entry.target);
                    }
                });
            });
            observer.observe(img);
        } else {
            // フォールバック
            this.loadImage(img, placeholder);
        }
    }

    // 画像を読み込み
    loadImage(img, placeholder) {
        const src = img.dataset.src;
        // srcが空の場合、直接プレースホルダーを適用
        if (!src) {
            const card = img.closest('.product-card');
            const productId = card.dataset.productId;
            const product = this.products.find(p => p.id === productId);
            const defaultVariant = product.variants.find(v => v.id === product.defaultVariant) || product.variants[0];

            img.src = window.generatePlaceholderSvg(product.name, defaultVariant.name, defaultVariant.color);
            img.classList.add('placeholder-image');
            img.classList.remove('loading');
            placeholder.style.display = 'none';
            console.warn('画像URLが空のため、プレースホルダーを使用');
            return;
        }

        // 商品データを取得
        const card = img.closest('.product-card');
        const productId = card.dataset.productId;
        const product = this.products.find(p => p.id === productId);

        if (!product) {
            img.classList.remove('loading');
            return;
        }

        // 現在選択されているバリエーションを取得
        const selectedColorOption = card.querySelector('.color-option.selected');
        const variantId = selectedColorOption ? selectedColorOption.dataset.variantId : product.defaultVariant;
        const variant = product.variants.find(v => v.id === variantId);

        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = src;
            img.classList.remove('loading');
            placeholder.style.display = 'none';
        };
        tempImg.onerror = () => {
            // 画像エラー時のフォールバック処理
            if (window.handleImageError) {
                window.handleImageError(img, product, variant);
            } else {
                // フォールバック関数がない場合、プレースホルダーを表示
                img.src = window.generatePlaceholderSvg(product.name, variant.name, variant.color);
                img.classList.add('placeholder-image');
                placeholder.style.display = 'none';
                console.warn('画像の読み込みに失敗し、デフォルトのプレースホルダーを使用:', src);
            }
            img.classList.remove('loading'); // エラー時もローディング状態を解除
        };
        tempImg.src = src;
    }

    // 商品を選択
    selectProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // 選択中のバリエーションを取得
        const card = document.querySelector(`[data-product-id="${productId}"]`);
        const selectedColorOption = card.querySelector('.color-option.selected');
        const variantId = selectedColorOption ? selectedColorOption.dataset.variantId : product.defaultVariant;

        this.selectedProduct = productId;
        this.selectedVariant = variantId;

        // LocalStorageに保存
        this.storage.saveSelection(productId, variantId, product);

        // UIを更新
        this.updateProductSelection();
        this.updateFooter();
    }

    // 商品選択状態をUIに反映
    updateProductSelection() {
        console.log('🔄 商品選択状態を更新中...', {
            selectedProduct: this.selectedProduct,
            selectedVariant: this.selectedVariant
        });

        const cards = document.querySelectorAll('.product-card');
        console.log('📋 見つかった商品カード数:', cards.length);

        cards.forEach(card => {
            const productId = card.dataset.productId;
            const isSelected = productId === this.selectedProduct;

            console.log(`🎯 商品 ${productId}:`, {
                isSelected: isSelected,
                hasButton: !!card.querySelector('.select-button')
            });

            card.classList.toggle('selected', isSelected);
            card.classList.toggle('dimmed', this.selectedProduct && !isSelected);

            const button = card.querySelector('.select-button');
            if (!button) {
                console.error(`❌ 商品 ${productId} の選択ボタンが見つかりません`);
                return;
            }

            // 申し込み済みの場合の表示ロジックを追加
            const isSubmittedAndSelected = isSelected &&
                                         this.hasExistingApplication &&
                                         this.existingApplicationData &&
                                         this.selectedProduct === this.existingApplicationData.selectedItem.id &&
                                         this.selectedVariant === this.existingApplicationData.selectedItem.variant.id;

            if (isSubmittedAndSelected) {
                button.innerHTML = `
                    <span class="material-icons">check_circle</span>
                    申し込み済み
                `;
                button.classList.add('selected');
                button.disabled = true; // 申し込み済みの場合はボタンを無効化
                console.log(`✅ 商品 ${productId} を申し込み済み状態に更新`);
            } else if (isSelected) {
                button.innerHTML = `
                    <span class="material-icons">check_circle</span>
                    選択中
                `;
                button.classList.add('selected');
                button.disabled = false; // 選択中の場合は有効化
                console.log(`✅ 商品 ${productId} を選択状態に更新`);
            } else {
                button.innerHTML = `
                    <span class="material-icons">add_circle</span>
                    この商品を選ぶ
                `;
                button.classList.remove('selected');
                button.disabled = false; // 未選択の場合は有効化
                console.log(`📝 商品 ${productId} を未選択状態に更新`);
            }

            // ボタンの可視性を確認
            const buttonStyle = getComputedStyle(button);
            console.log(`👁️ 商品 ${productId} ボタン可視性:`, {
                display: buttonStyle.display,
                visibility: buttonStyle.visibility,
                opacity: buttonStyle.opacity
            });
        });

        console.log('✅ 商品選択状態更新完了');
    }

    // フッターの選択状態を更新
    updateFooter() {
        const summary = document.getElementById('selectionSummary');
        const decideButton = document.getElementById('decideButton');

        if (!this.selectedProduct) {
            summary.innerHTML = '<p class="no-selection">商品を選択してください</p>';
            decideButton.disabled = true;
            return;
        }

        const product = this.products.find(p => p.id === this.selectedProduct);
        const variant = product.variants.find(v => v.id === this.selectedVariant);

        // GASから取得した状況に基づいて判定
        const hasExistingApplication = this.hasExistingApplication;
        let isChanged = false;

        // 既存申し込みがある場合、現在選択と既存選択を比較
        if (hasExistingApplication && this.existingApplicationData) {
            const existingItem = this.existingApplicationData.selectedItem;
            isChanged = (
                existingItem.id !== this.selectedProduct ||
                existingItem.variant.id !== this.selectedVariant
            );
        }

        summary.innerHTML = `
            <div class="selected-item">
                <img class="selected-item-image" src="${variant.images[0]}" alt="${product.name}" />
                <div class="selected-item-info">
                    <h4>${product.name}</h4>
                    <p>${product.brand} / ${variant.name}</p>
                </div>
            </div>
        `;

        decideButton.disabled = false;

        if (hasExistingApplication && !isChanged) {
            // 既存申し込みと同じ選択
            decideButton.innerHTML = `
                <span class="material-icons">check_circle</span>
                申し込み済み
            `;
            decideButton.disabled = true;
        } else if (hasExistingApplication && isChanged) {
            // 既存申し込みから変更
            decideButton.innerHTML = `
                <span class="material-icons">update</span>
                変更して決定する
            `;
        } else {
            // 新規申し込み
            decideButton.innerHTML = `
                <span class="material-icons">check_circle</span>
                この商品に決定する
            `;
        }

        // ボタンの表示状態をログ出力（デバッグ用）
        if (window.weddingGiftConfig?.enableConsoleLog) {
            console.log('🔘 決定ボタン状態:', {
                disabled: decideButton.disabled,
                text: decideButton.textContent.trim(),
                selectedProduct: this.selectedProduct,
                selectedVariant: this.selectedVariant,
                hasExistingApplication: hasExistingApplication,
                isChanged: isChanged,
                existingProduct: this.existingApplicationData?.selectedItem?.id,
                existingVariant: this.existingApplicationData?.selectedItem?.variant?.id
            });
        }
    }

    // 選択状態を復元（GAS状況とローカルストレージの両方から）
    restoreSelection() {
        // まずGASから取得した既存申し込み情報を確認
        if (this.hasExistingApplication && this.existingApplicationData) {
            const existingItem = this.existingApplicationData.selectedItem;
            console.log('🔄 既存申し込みから選択を復元:', {
                productId: existingItem.id,
                variantId: existingItem.variant.id
            });

            // 既存申し込みの商品を初期選択として設定
            this.selectedProduct = existingItem.id;
            this.selectedVariant = existingItem.variant.id;
            return;
        }

        // GASに既存データがない場合、ローカルストレージから復元
        const savedData = this.storage.loadSelection();
        if (!savedData || !savedData.selectedProduct) {
            console.log('📝 復元する選択データがありません');
            return;
        }

        console.log('💾 ローカルストレージから選択を復元:', savedData.selectedProduct);
        this.selectedProduct = savedData.selectedProduct.id;
        this.selectedVariant = savedData.selectedProduct.variant.id;
    }

    // 確認モーダルを表示
    showConfirmModal() {
        if (!this.selectedProduct) return;

        const product = this.products.find(p => p.id === this.selectedProduct);
        const variant = product.variants.find(v => v.id === this.selectedVariant);

        const isSubmitted = this.storage.isSubmitted();
        const isChanged = this.storage.isSelectionChanged(this.selectedProduct, this.selectedVariant);

        const confirmModalBody = document.getElementById('confirmModalBody');
        confirmModalBody.innerHTML = `
            <div class="confirmation-details">
                <div class="confirmation-product">
                    <h4>${product.name}</h4>
                    <p>${product.brand}</p>
                </div>
                <ul class="confirmation-details-list">
                    <li><strong>商品名:</strong> <span>${product.name}</span></li>
                    <li><strong>ブランド:</strong> <span>${product.brand}</span></li>
                    <li><strong>色:</strong> <span>${variant.name}</span></li>
                    <li><strong>仕様:</strong> <span>${product.specs}</span></li>
                </ul>
                <p class="confirmation-question">
                    ${isSubmitted && isChanged ? '選択を変更してもよろしいですか？' : 'この商品でよろしいですか？'}
                </p>
            </div>
        `;

        this.showModal(document.getElementById('confirmModal'));
    }

    // 選択を送信
    async submitSelection() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        this.showLoading(loadingOverlay);

        try {
            const product = this.products.find(p => p.id === this.selectedProduct);
            const variant = product.variants.find(v => v.id === this.selectedVariant);

            // 申し込み種別を判定（GASから取得した状況に基づく）
            const isChange = this.hasExistingApplication;

            const submitData = {
                selectedItem: {
                    id: this.selectedProduct,
                    name: product.name,
                    brand: product.brand,
                    category: product.category,
                    variant: {
                        id: this.selectedVariant,
                        name: variant.name,
                        color: variant.color,
                        image: variant.images[0]
                    }
                },
                timestamp: new Date().toISOString(),
                isChange: isChange,
                previousSelection: isChange ? this.existingApplicationData : null
            };

            console.log('📋 送信データ確認:', {
                isChange: isChange,
                hasExistingApplication: this.hasExistingApplication,
                existingData: this.existingApplicationData ? {
                    productName: this.existingApplicationData.selectedItem.name,
                    variantName: this.existingApplicationData.selectedItem.variant.name
                } : null
            });

            // Google Apps Scriptにフォールバック対応で送信
            await this.sendToGASWithFallback(submitData);

            // 提出済みとしてマーク
            this.storage.markAsSubmitted(this.selectedProduct, this.selectedVariant, product);

            // 申し込み完了後、内部状態を更新してUIを再描画
            this.hasExistingApplication = true;
            this.existingApplicationData = submitData; // 送信したデータを既存申し込みデータとして設定

            this.hideLoading(loadingOverlay);
            this.hideModal(document.getElementById('confirmModal'));
            this.showCompletionModal(isChange);
            this.updateFooter();
            this.updateProductSelection(); // 各商品カードのボタン状態を更新

        } catch (error) {
            console.error('送信エラー:', error);
            this.hideLoading(loadingOverlay);
            this.showError('送信に失敗しました。もう一度お試しください。');
        }
    }

    // Google Apps Scriptに送信（フォールバック対応）
    async sendToGAS(data) {
        return await this.sendToGASWithFallback(data);
    }

    // フォールバック対応でGASに送信
    async sendToGASWithFallback(data) {
        console.log('=== GAS送信開始（フォールバック対応） ===');

        const config = window.weddingGiftConfig;

        if (!config) {
            console.error('❌ Config が初期化されていません');
            throw new Error('設定が初期化されていません');
        }

        const GAS_URL = config.gasUrl;
        console.log('📡 送信設定:', {
            gasUrl: GAS_URL,
            enableConsoleLog: config.enableConsoleLog,
            isDevelopment: config.isDevelopment()
        });

        console.log('📦 送信データ:', data);

        // 開発環境のモック処理
        if (GAS_URL === 'DEVELOPMENT_MOCK') {
            console.log('🧪 開発環境: モック送信を実行中...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('✅ モック送信完了');
            return { success: true, message: '開発環境での模擬送信が完了しました' };
        }

        // GAS URLの検証
        if (!GAS_URL || !GAS_URL.startsWith('https://script.google.com/')) {
            console.error('❌ 無効なGAS URL:', GAS_URL);
            throw new Error('GAS URLが正しく設定されていません');
        }

        // フォーム送信での送信処理
        try {
            console.log('🚀 フォーム送信でGASに送信中...', GAS_URL);
            const result = await this.sendToGASViaForm(GAS_URL, data);
            console.log('📨 フォーム送信完了:', result);
            return result;

        } catch (formError) {
            console.error('💥 フォーム送信エラー詳細:', {
                name: formError.name,
                message: formError.message,
                stack: formError.stack
            });

            throw new Error(`フォーム送信に失敗しました: ${formError.message}`);
        }
    }

    // フォーム送信でGASにデータを送信
    async sendToGASViaForm(gasUrl, data) {
        return new Promise((resolve, reject) => {
            // フォームとiframeを動的に作成
            const form = document.createElement('form');
            form.style.display = 'none';
            form.method = 'GET';
            form.target = 'gasSubmissionFrame';
            form.action = gasUrl;

            const actionInput = document.createElement('input');
            actionInput.type = 'hidden';
            actionInput.name = 'action';
            actionInput.value = 'submit';

            const dataInput = document.createElement('input');
            dataInput.type = 'hidden';
            dataInput.name = 'data';
            dataInput.value = JSON.stringify(data);

            form.appendChild(actionInput);
            form.appendChild(dataInput);

            const iframe = document.createElement('iframe');
            iframe.name = 'gasSubmissionFrame';
            iframe.style.display = 'none';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            iframe.src = 'about:blank';

            document.body.appendChild(form);
            document.body.appendChild(iframe);

            // iframeのエラーを完全に無視する設定
            iframe.onerror = (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('📝 iframe エラー無視');
                return false;
            };

            // コンソールエラーも抑制
            iframe.onload = () => {
                try {
                    // iframe内のエラーを抑制
                    iframe.contentWindow.onerror = () => false;
                    iframe.contentWindow.addEventListener('error', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    }, true);
                } catch (e) {
                    // クロスオリジンエラーも無視
                }
            };

            console.log('📡 フォーム送信URL:', gasUrl);
            console.log('📦 送信データ:', data);
            console.log('📋 GET送信に変更 - doGetで処理されます');

            // フォームを送信
            try {
                form.submit();
                console.log('✅ フォーム送信実行完了');

                // フォーム送信は成功として扱う
                setTimeout(() => {
                    // 使用後にフォームとiframeを削除
                    document.body.removeChild(form);
                    document.body.removeChild(iframe);
                    resolve({ success: true, message: 'フォーム送信が完了しました' });
                }, 500);
            } catch (error) {
                console.warn('⚠️ フォーム送信エラー（無視）:', error);
                // エラー時も要素を削除
                try {
                    document.body.removeChild(form);
                    document.body.removeChild(iframe);
                } catch (cleanupError) {
                    console.warn('📝 クリーンアップエラー（無視）:', cleanupError);
                }
                resolve({ success: true, message: 'フォーム送信が完了しました' });
            }
        });
    }


    // 完了モーダルを表示
    showCompletionModal(isChange) {
        const product = this.products.find(p => p.id === this.selectedProduct);
        const variant = product.variants.find(v => v.id === this.selectedVariant);

        const completionTitle = document.getElementById('completionTitle');
        const completionModalBody = document.getElementById('completionModalBody');

        if (isChange) {
            completionTitle.textContent = '🔄 選択変更完了！';
            completionModalBody.innerHTML = `
                <div style="text-align: center;">
                    <p><strong>${product.name}</strong> (${variant.name}) に変更いたしました</p>
                    <p style="margin-top: 1rem;">変更を承りました</p>
                    <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.8;">
                        後日お届け予定をご連絡いたします
                    </p>
                </div>
            `;
        } else {
            completionTitle.textContent = '✨ 選択完了！';
            completionModalBody.innerHTML = `
                <div style="text-align: center;">
                    <p><strong>${product.name}</strong> (${variant.name}) を承りました</p>
                    <p style="margin-top: 1rem;">後日お届け予定をご連絡いたします</p>
                    <p style="margin-top: 1.5rem; color: var(--accent-color);">
                        素敵な新生活をお過ごしください💕
                    </p>
                </div>
            `;
        }

        this.showModal(document.getElementById('completionModal'));
    }

    // モーダルを表示
    showModal(modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // モーダルを非表示
    hideModal(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    // ローディングを表示
    showLoading(overlay) {
        overlay.classList.add('show');
    }

    // ローディングを非表示
    hideLoading(overlay) {
        overlay.classList.remove('show');
    }

    // エラーメッセージを表示
    showError(message) {
        alert(message); // 簡易実装、後でより良いUIに置き換え可能
    }

    // 申し込み状況を確認
    async checkApplicationStatus() {
        try {
            console.log('🔍 申し込み状況を確認中...');

            const GAS_URL = window.weddingGiftConfig.getGasUrl();
            console.log('📡 使用するGAS_URL:', GAS_URL);

            if (!GAS_URL || GAS_URL === '{{GAS_URL}}' || GAS_URL === 'DEVELOPMENT_MOCK') {
                console.warn('⚠️ GAS_URLが本番用に設定されていません - 申し込み状況確認をスキップ');
                this.hasExistingApplication = false;
                this.existingApplicationData = null;
                return;
            }

            // 申し込み状況確認をGAS経由で実行
            console.log('📊 GAS経由で申し込み状況を確認中...');
            const statusResult = await this.checkStatusViaGAS(GAS_URL);

            if (statusResult) {
                console.log('✅ 申し込み状況確認完了:', statusResult);
                this.handleApplicationStatus(statusResult);
            } else {
                console.log('📝 申し込み履歴なし - 新規申し込みとして処理');
                this.hasExistingApplication = false;
                this.existingApplicationData = null;
            }

        } catch (error) {
            console.error('❌ 申し込み状況確認エラー:', error);
            // エラーの場合は通常の新規申し込みUIで進行
            this.hasExistingApplication = false;
            this.existingApplicationData = null;
        }
    }

    // GAS経由で申し込み状況を確認
    async checkStatusViaGAS(gasUrl) {
        try {
            console.log('📡 GETリクエストで申し込み状況確認中...');

            // 状況確認用のURLパラメータを追加
            const checkUrl = new URL(gasUrl);
            checkUrl.searchParams.append('action', 'status');

            console.log('🌐 リクエストURL:', checkUrl.toString());

            // シンプルなGETリクエストで状況確認
            const response = await fetch(checkUrl.toString(), {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Accept': 'application/json, text/plain, */*'
                }
            });

            console.log('📊 レスポンス状況:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            if (!response.ok) {
                console.warn(`⚠️ 申し込み状況確認レスポンスエラー: ${response.status} ${response.statusText}`);
                return null;
            }

            // レスポンスをJSONとして解析
            const statusResult = await response.json();
            console.log('✅ 申し込み状況確認成功:', statusResult);

            return statusResult;

        } catch (error) {
            console.warn('⚠️ 申し込み状況確認エラー:', error);
            // CORS等のエラーの場合は新規申し込みとして処理
            return null;
        }
    }

    // 申し込み状況に基づいてUIを調整
    handleApplicationStatus(statusResult) {
        console.log('🔧 申し込み状況を処理中...', statusResult);

        const welcomeSection = document.querySelector('.welcome-section .welcome-card');
        const decideButton = document.getElementById('decideButton');

        console.log('📊 状況チェック:', {
            hasApplication: statusResult.hasApplication,
            lastApplication: statusResult.lastApplication ? 'あり' : 'なし'
        });

        if (statusResult.hasApplication && statusResult.lastApplication) {
            const lastApp = statusResult.lastApplication;
            console.log('🔄 既存申し込みを検出:', {
                productName: lastApp.selectedItem.name,
                variantName: lastApp.selectedItem.variant.name,
                timestamp: lastApp.timestamp,
                rowNumber: lastApp.rowNumber
            });

            // 内部状態を更新
            this.hasExistingApplication = true;
            this.existingApplicationData = lastApp;
            console.log('💾 内部状態更新:', {
                hasExistingApplication: this.hasExistingApplication,
                existingApplicationData: this.existingApplicationData ? 'セット済み' : 'なし'
            });

            // 変更用UIに切り替え
            if (welcomeSection) {
                const welcomeTitle = welcomeSection.querySelector('.welcome-title');
                const welcomeText = welcomeSection.querySelector('.welcome-text');

                if (welcomeTitle) {
                    welcomeTitle.textContent = '選択変更';
                    console.log('🏷️ タイトルを変更: 選択変更');
                }

                if (welcomeText) {
                    welcomeText.innerHTML = `
                        <p>現在の選択: <strong>${lastApp.selectedItem.name}</strong> (${lastApp.selectedItem.variant.name})</p>
                        <p>変更したい商品を選択してください</p>
                    `;
                    console.log('📝 ウェルカムテキストを変更');
                }
            }

            if (decideButton) {
                const buttonText = decideButton.querySelector('span:last-child');
                if (buttonText) {
                    buttonText.textContent = 'この商品に変更する';
                    console.log('🔘 ボタンテキストを変更: この商品に変更する');
                }
            }

            // 既存選択をローカルストレージに保存（変更前の情報として）
            if (this.storage) {
                this.storage.savePreviousSelection({
                    productInfo: {
                        id: lastApp.selectedItem.id,
                        name: lastApp.selectedItem.name,
                        brand: lastApp.selectedItem.brand
                    },
                    variant: {
                        id: lastApp.selectedItem.variant.id,
                        name: lastApp.selectedItem.variant.name,
                        color: lastApp.selectedItem.variant.color
                    },
                    timestamp: lastApp.timestamp,
                    rowNumber: lastApp.rowNumber
                });
                console.log('💽 ローカルストレージに前回選択を保存');
            }

            console.log('✅ 変更用UIに切り替え完了');

        } else {
            console.log('📝 新規申し込み用UIを維持（申し込み履歴なし）');
            this.hasExistingApplication = false;
            this.existingApplicationData = null;
            console.log('💾 内部状態リセット:', {
                hasExistingApplication: this.hasExistingApplication,
                existingApplicationData: this.existingApplicationData
            });
        }
    }
}

// DOMContentLoaded後に初期化
document.addEventListener('DOMContentLoaded', () => {
    new WeddingGiftCatalog();
});
