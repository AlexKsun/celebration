/**
 * Footer表示デバッグ用スクリプト
 */

function debugFooter() {
    console.log('=== Footer Debug ===');

    const footer = document.getElementById('footerSelection');
    const decideButton = document.getElementById('decideButton');
    const summary = document.getElementById('selectionSummary');

    if (!footer) {
        console.error('❌ Footer要素が見つかりません');
        return;
    }

    console.log('✅ Footer要素:', footer);
    console.log('Footer computed styles:', {
        display: getComputedStyle(footer).display,
        position: getComputedStyle(footer).position,
        bottom: getComputedStyle(footer).bottom,
        zIndex: getComputedStyle(footer).zIndex,
        visibility: getComputedStyle(footer).visibility,
        opacity: getComputedStyle(footer).opacity,
        height: getComputedStyle(footer).height,
        backgroundColor: getComputedStyle(footer).backgroundColor
    });

    if (decideButton) {
        console.log('✅ Decide Button:', decideButton);
        console.log('Button styles:', {
            display: getComputedStyle(decideButton).display,
            visibility: getComputedStyle(decideButton).visibility,
            disabled: decideButton.disabled,
            textContent: decideButton.textContent.trim()
        });
    } else {
        console.error('❌ Decide Button が見つかりません');
    }

    if (summary) {
        console.log('✅ Summary:', summary);
        console.log('Summary content:', summary.innerHTML);
    } else {
        console.error('❌ Summary が見つかりません');
    }

    // 強制的にFooterを表示するテスト
    console.log('🔧 Footer を強制表示...');
    footer.style.display = 'flex';
    footer.style.position = 'fixed';
    footer.style.bottom = '0';
    footer.style.left = '0';
    footer.style.right = '0';
    footer.style.zIndex = '1000';
    footer.style.visibility = 'visible';
    footer.style.opacity = '1';
    footer.style.backgroundColor = '#ffffff';
    footer.style.padding = '1.5rem 2rem';
    footer.style.borderTop = '1px solid #e8d4d1';
    footer.style.boxShadow = '0 -4px 20px rgba(139, 90, 107, 0.1)';

    console.log('✅ Footer強制表示完了');
}

// ページ読み込み完了後にデバッグ実行
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(debugFooter, 1000);
});

// 手動実行用
window.debugFooter = debugFooter;