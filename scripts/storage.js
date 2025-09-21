// LocalStorage管理
class WeddingGiftStorage {
    constructor() {
        this.storageKey = 'wedding_gift_selection';
        this.version = '1.0';
    }

    // 選択データを保存
    saveSelection(productId, variantId, productData) {
        const data = {
            selectedProduct: {
                id: productId,
                variant: {
                    id: variantId,
                    ...productData.variants.find(v => v.id === variantId)
                },
                productInfo: {
                    name: productData.name,
                    brand: productData.brand,
                    category: productData.category,
                    specs: productData.specs,
                    description: productData.description
                }
            },
            savedAt: new Date().toISOString(),
            version: this.version
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('LocalStorage保存エラー:', error);
            return false;
        }
    }

    // 選択データを読み込み
    loadSelection() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return null;

            const parsed = JSON.parse(data);

            // バージョンチェック
            if (parsed.version !== this.version) {
                console.warn('LocalStorageバージョンが異なります。データをクリアします。');
                this.clearSelection();
                return null;
            }

            return parsed;
        } catch (error) {
            console.error('LocalStorage読み込みエラー:', error);
            this.clearSelection();
            return null;
        }
    }

    // 選択データをクリア
    clearSelection() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('LocalStorageクリアエラー:', error);
            return false;
        }
    }

    // 提出済みフラグを保存
    markAsSubmitted(productId, variantId, productData) {
        const existingData = this.loadSelection();
        const data = {
            ...existingData,
            selectedProduct: {
                id: productId,
                variant: {
                    id: variantId,
                    ...productData.variants.find(v => v.id === variantId)
                },
                productInfo: {
                    name: productData.name,
                    brand: productData.brand,
                    category: productData.category,
                    specs: productData.specs,
                    description: productData.description
                }
            },
            submittedAt: new Date().toISOString(),
            isSubmitted: true,
            version: this.version
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('提出フラグ保存エラー:', error);
            return false;
        }
    }

    // 提出済みかどうかを確認
    isSubmitted() {
        const data = this.loadSelection();
        return data && data.isSubmitted === true;
    }

    // 前回の選択と比較して変更があるかチェック
    isSelectionChanged(productId, variantId) {
        const data = this.loadSelection();
        if (!data || !data.selectedProduct) return true;

        return (
            data.selectedProduct.id !== productId ||
            data.selectedProduct.variant.id !== variantId
        );
    }

    // デバッグ用：保存されているデータを表示
    debug() {
        const data = this.loadSelection();
        console.log('保存されている選択データ:', data);
        return data;
    }

    // 統計情報
    getStats() {
        const data = this.loadSelection();
        if (!data) return null;

        return {
            hasSelection: !!data.selectedProduct,
            isSubmitted: data.isSubmitted || false,
            savedAt: data.savedAt,
            submittedAt: data.submittedAt || null,
            version: data.version
        };
    }

    // 前回選択を保存（変更用）
    savePreviousSelection(selectionData) {
        const key = this.storageKey + '_previous';
        try {
            const data = {
                ...selectionData,
                savedAt: new Date().toISOString(),
                version: this.version
            };
            localStorage.setItem(key, JSON.stringify(data));
            console.log('前回選択を保存しました:', data);
            return true;
        } catch (error) {
            console.error('前回選択保存エラー:', error);
            return false;
        }
    }

    // 前回選択を読み込み
    loadPreviousSelection() {
        const key = this.storageKey + '_previous';
        try {
            const data = localStorage.getItem(key);
            if (!data) return null;

            const parsed = JSON.parse(data);
            return parsed;
        } catch (error) {
            console.error('前回選択読み込みエラー:', error);
            return null;
        }
    }
}

// グローバルインスタンス
window.weddingGiftStorage = new WeddingGiftStorage();