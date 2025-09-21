/**
 * 結婚祝いカタログギフト - Google Apps Script
 * シンプルでCORS問題を回避したバージョン
 */

// 基本設定（最低限必要な設定のみ）
const BASE_CONFIG = {
  // メインスプレッドシートID（このGASプロジェクトにバインドされたスプレッドシート）
  // 'YOUR_SPREADSHEET_ID'の場合は現在のスプレッドシートを使用
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',

  // 設定シート名
  CONFIG_SHEET_NAME: '設定',

  // データシート名（デフォルト）
  DEFAULT_SHEET_NAME: '申し込み履歴',

  // タイムゾーン（デフォルト）
  DEFAULT_TIMEZONE: 'Asia/Tokyo'
};

/**
 * 実際のスプレッドシートIDを取得
 */
function getActualSpreadsheetId() {
  if (BASE_CONFIG.SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID') {
    // 現在のスプレッドシートのIDを取得
    const currentSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (currentSpreadsheet) {
      return currentSpreadsheet.getId();
    } else {
      throw new Error('スプレッドシートIDが設定されておらず、現在のスプレッドシートも取得できません');
    }
  }
  return BASE_CONFIG.SPREADSHEET_ID;
}

/**
 * スプレッドシートから設定を読み込み
 */
function loadConfig() {
  try {
    const spreadsheetId = getActualSpreadsheetId();
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let configSheet = spreadsheet.getSheetByName(BASE_CONFIG.CONFIG_SHEET_NAME);

    // 設定シートが存在しない場合は作成
    if (!configSheet) {
      configSheet = createConfigSheet(spreadsheet);
    }

    // 設定データを読み込み
    const data = configSheet.getDataRange().getValues();
    const config = {};

    // ヘッダー行をスキップして設定を読み込み
    for (let i = 1; i < data.length; i++) {
      const [key, value, description] = data[i];
      if (key && value) {
        config[key] = value;
      }
    }

    // デフォルト値を設定
    return {
      SPREADSHEET_ID: spreadsheetId,
      DISCORD_WEBHOOK_URL: config.DISCORD_WEBHOOK_URL || '',
      SHEET_NAME: config.SHEET_NAME || BASE_CONFIG.DEFAULT_SHEET_NAME,
      TIMEZONE: config.TIMEZONE || BASE_CONFIG.DEFAULT_TIMEZONE,
      ENABLE_DISCORD: config.ENABLE_DISCORD === 'true' || config.ENABLE_DISCORD === true,
      WEBHOOK_USERNAME: config.WEBHOOK_USERNAME || 'Wedding Gift Catalog',
      WEBHOOK_AVATAR_URL: config.WEBHOOK_AVATAR_URL || ''
    };

  } catch (error) {
    Logger.log('設定読み込みエラー: ' + error.toString());

    // エラー時はデフォルト設定を返す
    try {
      const fallbackSpreadsheetId = getActualSpreadsheetId();
      return {
        SPREADSHEET_ID: fallbackSpreadsheetId,
        DISCORD_WEBHOOK_URL: '',
        SHEET_NAME: BASE_CONFIG.DEFAULT_SHEET_NAME,
        TIMEZONE: BASE_CONFIG.DEFAULT_TIMEZONE,
        ENABLE_DISCORD: false,
        WEBHOOK_USERNAME: 'Wedding Gift Catalog',
        WEBHOOK_AVATAR_URL: ''
      };
    } catch (fallbackError) {
      Logger.log('フォールバック設定エラー: ' + fallbackError.toString());
      return {
        SPREADSHEET_ID: BASE_CONFIG.SPREADSHEET_ID,
        DISCORD_WEBHOOK_URL: '',
        SHEET_NAME: BASE_CONFIG.DEFAULT_SHEET_NAME,
        TIMEZONE: BASE_CONFIG.DEFAULT_TIMEZONE,
        ENABLE_DISCORD: false,
        WEBHOOK_USERNAME: 'Wedding Gift Catalog',
        WEBHOOK_AVATAR_URL: ''
      };
    }
  }
}

/**
 * 設定シートを作成
 */
function createConfigSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet(BASE_CONFIG.CONFIG_SHEET_NAME);

  // ヘッダー行
  const headers = ['設定キー', '設定値', '説明'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // デフォルト設定データ
  const defaultSettings = [
    ['DISCORD_WEBHOOK_URL', 'https://discord.com/api/webhooks/YOUR_WEBHOOK_URL', 'Discord WebhookのURL'],
    ['SHEET_NAME', '申し込み履歴', '申し込みデータを保存するシート名'],
    ['TIMEZONE', 'Asia/Tokyo', 'タイムゾーン設定'],
    ['ENABLE_DISCORD', 'true', 'Discord通知を有効にするか (true/false)'],
    ['WEBHOOK_USERNAME', 'Wedding Gift Catalog', 'Discord通知時の表示名'],
    ['WEBHOOK_AVATAR_URL', '', 'Discord通知時のアバター画像URL（オプション）']
  ];

  // 設定データを追加
  sheet.getRange(2, 1, defaultSettings.length, 3).setValues(defaultSettings);

  // ヘッダー行のスタイル設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f5e6e3');

  // 列幅を調整
  sheet.setColumnWidth(1, 200); // 設定キー
  sheet.setColumnWidth(2, 400); // 設定値
  sheet.setColumnWidth(3, 300); // 説明

  // セルの書式設定
  sheet.getRange(2, 1, defaultSettings.length, 3).setWrap(true);

  Logger.log('設定シートを作成しました: ' + BASE_CONFIG.CONFIG_SHEET_NAME);

  return sheet;
}

/**
 * GETリクエストの処理
 */
function doGet(e) {
  Logger.log('=== GETリクエスト受信 ===');
  Logger.log('パラメータ詳細: ' + JSON.stringify(e.parameter));

  try {
    const data = e.parameter.data;
    const callback = e.parameter.callback;
    const action = e.parameter.action;

    Logger.log('処理分岐確認:', {
      data: data ? 'あり' : 'なし',
      callback: callback ? 'あり' : 'なし',
      action: action || 'なし'
    });

    let result;

    if (action === 'status') {
      Logger.log('📋 申し込み状況取得処理を開始');
      // 申し込み状況取得
      try {
        Logger.log('getApplicationStatus()を呼び出し中...');
        const status = getApplicationStatus();
        Logger.log('getApplicationStatus()結果: ' + JSON.stringify(status, null, 2));

        result = {
          success: true,
          ...status,
          timestamp: new Date().toISOString(),
          method: 'GET',
          action: 'status'
        };
        Logger.log('✅ 申し込み状況取得完了: ' + JSON.stringify(result, null, 2));
      } catch (error) {
        Logger.log('❌ 申し込み状況取得エラー: ' + error.toString());
        Logger.log('エラースタック: ' + error.stack);
        result = {
          success: false,
          error: error.toString(),
          timestamp: new Date().toISOString(),
          method: 'GET',
          action: 'status'
        };
      }
    } else if (data) {
      // データ処理
      try {
        const postData = JSON.parse(data);
        Logger.log('受信データ: ' + JSON.stringify(postData));

        // 設定を読み込み
        const config = loadConfig();

        // バリデーション
        if (!validateData(postData)) {
          throw new Error('無効なデータです');
        }

        // スプレッドシートに保存
        const rowData = saveToSpreadsheet(postData, config);

        // Discord通知を送信
        sendDiscordNotification(postData, rowData.rowNumber, config);

        result = {
          success: true,
          message: '申し込みを受け付けました',
          timestamp: new Date().toISOString(),
          rowNumber: rowData.rowNumber,
          method: 'GET'
        };

      } catch (error) {
        Logger.log('データ処理エラー: ' + error.toString());
        result = {
          success: false,
          error: error.toString(),
          timestamp: new Date().toISOString(),
          method: 'GET'
        };
      }
    } else {
      // テスト用レスポンス
      result = {
        success: true,
        message: 'Wedding Gift Catalog GAS is running',
        timestamp: new Date().toISOString(),
        method: 'GET'
      };
    }

    Logger.log('レスポンス: ' + JSON.stringify(result));

    // レスポンス生成
    let responseText = JSON.stringify(result);

    if (callback) {
      // JSONP対応
      responseText = callback + '(' + responseText + ');';
      return ContentService
        .createTextOutput(responseText)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      // 通常のJSON
      return ContentService
        .createTextOutput(responseText)
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    Logger.log('GETリクエスト処理エラー: ' + error.toString());

    const errorResult = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString(),
      method: 'GET'
    };

    return ContentService
      .createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POSTリクエストの処理
 */
function doPost(e) {
  Logger.log('POSTリクエスト受信');

  try {
    // POSTデータを解析
    const postData = JSON.parse(e.postData.contents);
    Logger.log('受信データ: ' + JSON.stringify(postData));

    // 設定を読み込み
    const config = loadConfig();

    // バリデーション
    if (!validateData(postData)) {
      throw new Error('無効なデータです');
    }

    // スプレッドシートに保存
    const rowData = saveToSpreadsheet(postData, config);

    // Discord通知を送信
    sendDiscordNotification(postData, rowData.rowNumber, config);

    // 成功レスポンス
    const result = {
      success: true,
      message: '申し込みを受け付けました',
      timestamp: new Date().toISOString(),
      rowNumber: rowData.rowNumber,
      method: 'POST'
    };

    Logger.log('レスポンス: ' + JSON.stringify(result));

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('POSTリクエスト処理エラー: ' + error.toString());

    const errorResult = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString(),
      method: 'POST'
    };

    return ContentService
      .createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * データのバリデーション
 */
function validateData(data) {
  if (!data || !data.selectedItem) {
    return false;
  }

  const item = data.selectedItem;
  if (!item.id || !item.name || !item.brand || !item.variant) {
    return false;
  }

  if (!item.variant.id || !item.variant.name) {
    return false;
  }

  return true;
}

/**
 * スプレッドシートに保存
 */
function saveToSpreadsheet(data, config) {
  try {
    const spreadsheet = SpreadsheetApp.openById(config.SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(config.SHEET_NAME);

    // シートが存在しない場合は作成
    if (!sheet) {
      sheet = createSheet(spreadsheet, config);
    }

    const timestamp = new Date();
    const item = data.selectedItem;

    // 行データを準備
    const rowData = [
      Utilities.formatDate(timestamp, config.TIMEZONE, 'yyyy/MM/dd HH:mm:ss'),
      item.id,
      item.name,
      item.brand,
      item.category || '',
      item.variant.id,
      item.variant.name,
      item.variant.color || '',
      data.isChange ? '変更' : '新規',
      data.timestamp || ''
    ];

    // データを追加
    sheet.appendRow(rowData);
    const rowNumber = sheet.getLastRow();

    Logger.log('スプレッドシートに保存完了: 行 ' + rowNumber);

    return {
      success: true,
      rowNumber: rowNumber,
      timestamp: timestamp
    };

  } catch (error) {
    Logger.log('スプレッドシート保存エラー: ' + error.toString());
    throw new Error('データの保存に失敗しました: ' + error.toString());
  }
}

/**
 * シートを作成（ヘッダー行付き）
 */
function createSheet(spreadsheet, config) {
  const sheet = spreadsheet.insertSheet(config.SHEET_NAME);

  // ヘッダー行を設定
  const headers = [
    '日時',
    '商品ID',
    '商品名',
    'ブランド',
    'カテゴリ',
    'バリエーションID',
    'バリエーション名',
    '色',
    '申し込み種別',
    'フロントエンド送信時刻'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#f5e6e3');

  // 列幅を調整
  sheet.setColumnWidths(1, headers.length, 120);

  Logger.log('シートを作成しました: ' + config.SHEET_NAME);

  return sheet;
}

/**
 * Discord通知を送信
 */
function sendDiscordNotification(data, rowNumber, config) {
  try {
    if (!config.ENABLE_DISCORD || !config.DISCORD_WEBHOOK_URL || config.DISCORD_WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL') {
      Logger.log('Discord通知が無効化されているか、Webhook URLが設定されていません');
      return;
    }

    const item = data.selectedItem;
    const isChange = data.isChange;
    const now = new Date();
    const timeString = Utilities.formatDate(now, config.TIMEZONE, 'yyyy年MM月dd日 HH:mm:ss');

    // シンプルなメッセージ形式
    let content = '';
    if (isChange) {
      content = `🔄 **カタログギフトの選択変更がありました！**

**商品**: ${item.name} (${item.brand})
**バリエーション**: ${item.variant.name}
**カテゴリ**: ${getCategoryDisplayName(item.category || '')}
**種別**: 選択変更
**データ行**: #${rowNumber}
**時刻**: ${timeString}`;

      if (data.previousSelection) {
        const prev = data.previousSelection;
        content += `

**前回選択**: ${prev.productInfo?.name || 'Unknown'} (${prev.variant?.name || 'Unknown'})
**今回選択**: ${item.name} (${item.variant.name})`;
      }
    } else {
      content = `🎁 **新しいカタログギフトの申し込みです！**

**商品**: ${item.name} (${item.brand})
**バリエーション**: ${item.variant.name}
**カテゴリ**: ${getCategoryDisplayName(item.category || '')}
**種別**: 新規申し込み
**データ行**: #${rowNumber}
**時刻**: ${timeString}

おめでとうございます！ 💕`;
    }

    // シンプルなembedも追加
    const embed = {
      title: `${item.name}`,
      description: `${item.brand} - ${item.variant.name}`,
      color: isChange ? 16753920 : 9132139,
      timestamp: new Date().toISOString(),
      footer: {
        text: config.WEBHOOK_USERNAME || 'Wedding Gift Catalog'
      }
    };

    const payload = {
      content: content,
      embeds: [embed],
      username: config.WEBHOOK_USERNAME,
      avatar_url: config.WEBHOOK_AVATAR_URL
    };

    Logger.log('Discord送信データ: ' + JSON.stringify(payload, null, 2));

    const response = UrlFetchApp.fetch(config.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload)
    });

    Logger.log('Discord応答: ' + response.getResponseCode());
    if (response.getContentText()) {
      Logger.log('Discord応答本文: ' + response.getContentText());
    }

    if (response.getResponseCode() === 204) {
      Logger.log('✅ Discord通知を正常に送信しました');
    } else if (response.getResponseCode() === 200) {
      Logger.log('✅ Discord通知を送信しました (200 OK)');
    } else {
      Logger.log('⚠️ Discord通知送信で予期しないステータス: ' + response.getResponseCode());
    }

  } catch (error) {
    Logger.log('❌ Discord通知エラー: ' + error.toString());
    Logger.log('エラー詳細: ' + error.stack);
  }
}

/**
 * カテゴリの表示名を取得
 */
function getCategoryDisplayName(category) {
  const categoryMap = {
    'kitchen': '🍳 キッチン用品',
    'living': '🏠 リビング用品',
    'bath': '🛁 バス・ビューティー',
    'pair': '💕 ペア用品',
    'experience': '✨ 体験ギフト'
  };

  return categoryMap[category] || category;
}

/**
 * Discord通知のテスト用関数
 */
function testDiscordNotification() {
  const testData = {
    selectedItem: {
      id: 'balmuda_pot',
      name: 'The Pot',
      brand: 'BALMUDA',
      category: 'kitchen',
      variant: {
        id: 'white',
        name: 'ホワイト',
        color: '#ffffff'
      }
    },
    timestamp: new Date().toISOString(),
    isChange: false,
    previousSelection: null
  };

  try {
    Logger.log('Discord通知テストを開始...');
    const config = loadConfig();
    sendDiscordNotification(testData, 999, config);
    Logger.log('Discord通知テスト完了');
  } catch (error) {
    Logger.log('Discord通知テストエラー: ' + error.toString());
  }
}

/**
 * テスト用関数
 */
function testFunction() {
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
    previousSelection: null
  };

  try {
    const config = loadConfig();
    const result = saveToSpreadsheet(testData, config);
    sendDiscordNotification(testData, result.rowNumber, config);
    Logger.log('テスト成功: ' + JSON.stringify(result));
  } catch (error) {
    Logger.log('テストエラー: ' + error.toString());
  }
}

/**
 * 変更テスト用関数
 */
function testChangeNotification() {
  const testData = {
    selectedItem: {
      id: 'bruno_grill',
      name: 'Grill sandwich maker',
      brand: 'BRUNO',
      category: 'kitchen',
      variant: {
        id: 'red',
        name: 'レッド',
        color: '#cc3333'
      }
    },
    timestamp: new Date().toISOString(),
    isChange: true,
    previousSelection: {
      productInfo: {
        name: 'The Pot'
      },
      variant: {
        name: 'ホワイト'
      }
    }
  };

  try {
    Logger.log('変更通知テストを開始...');
    const config = loadConfig();
    sendDiscordNotification(testData, 1000, config);
    Logger.log('変更通知テスト完了');
  } catch (error) {
    Logger.log('変更通知テストエラー: ' + error.toString());
  }
}

/**
 * 設定確認用関数
 */
function checkConfiguration() {
  try {
    const config = loadConfig();
    Logger.log('=== 設定確認 ===');
    Logger.log('SPREADSHEET_ID: ' + config.SPREADSHEET_ID);
    Logger.log('DISCORD_WEBHOOK_URL: ' + (config.DISCORD_WEBHOOK_URL && config.DISCORD_WEBHOOK_URL.startsWith('https://') ? '設定済み' : '未設定'));
    Logger.log('SHEET_NAME: ' + config.SHEET_NAME);
    Logger.log('TIMEZONE: ' + config.TIMEZONE);
    Logger.log('ENABLE_DISCORD: ' + config.ENABLE_DISCORD);
    Logger.log('WEBHOOK_USERNAME: ' + config.WEBHOOK_USERNAME);

    try {
      const spreadsheet = SpreadsheetApp.openById(config.SPREADSHEET_ID);
      Logger.log('スプレッドシートアクセス: OK');
      Logger.log('スプレッドシート名: ' + spreadsheet.getName());
    } catch (error) {
      Logger.log('スプレッドシートアクセス: NG - ' + error.toString());
    }
  } catch (error) {
    Logger.log('設定読み込みエラー: ' + error.toString());
  }
}

/**
 * 設定シートのひな型を作成するテスト関数
 */
function createConfigSheetTemplate() {
  try {
    Logger.log('設定シートひな型作成を開始...');

    const spreadsheetId = getActualSpreadsheetId();
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);

    // 既存の設定シートを削除（存在する場合）
    const existingSheet = spreadsheet.getSheetByName(BASE_CONFIG.CONFIG_SHEET_NAME);
    if (existingSheet) {
      Logger.log('既存の設定シートを削除します');
      spreadsheet.deleteSheet(existingSheet);
    }

    // 新しい設定シートを作成
    const configSheet = createConfigSheet(spreadsheet);

    Logger.log('✅ 設定シートひな型を作成しました');
    Logger.log('シート名: ' + configSheet.getName());
    Logger.log('作成された設定項目数: ' + (configSheet.getLastRow() - 1));

    // 作成された設定内容を確認
    const data = configSheet.getDataRange().getValues();
    Logger.log('=== 作成された設定項目 ===');
    for (let i = 1; i < data.length; i++) {
      const [key, value, description] = data[i];
      Logger.log(`${key}: ${value} (${description})`);
    }

  } catch (error) {
    Logger.log('❌ 設定シートひな型作成エラー: ' + error.toString());
  }
}

/**
 * 申し込み状況を取得
 */
function getApplicationStatus() {
  Logger.log('=== getApplicationStatus() 開始 ===');

  try {
    Logger.log('設定を読み込み中...');
    const config = loadConfig();
    Logger.log('設定読み込み完了:', {
      spreadsheetId: config.SPREADSHEET_ID,
      sheetName: config.SHEET_NAME
    });

    Logger.log('スプレッドシートを開いています...');
    const spreadsheet = SpreadsheetApp.openById(config.SPREADSHEET_ID);
    Logger.log('スプレッドシート名: ' + spreadsheet.getName());

    Logger.log('シートを取得中: ' + config.SHEET_NAME);
    const sheet = spreadsheet.getSheetByName(config.SHEET_NAME);

    if (!sheet) {
      Logger.log('⚠️ シートが見つかりません: ' + config.SHEET_NAME);
      const allSheets = spreadsheet.getSheets().map(s => s.getName());
      Logger.log('利用可能なシート: ' + JSON.stringify(allSheets));
      return {
        hasApplication: false,
        message: '申し込み履歴がありません（シートなし）'
      };
    }

    Logger.log('✅ シート取得成功: ' + sheet.getName());
    const lastRow = sheet.getLastRow();
    Logger.log('最終行番号: ' + lastRow);

    if (lastRow <= 1) { // ヘッダー行のみ
      Logger.log('⚠️ データ行なし（ヘッダー行のみ）');
      return {
        hasApplication: false,
        message: '申し込み履歴がありません（データなし）'
      };
    }

    Logger.log('最新データを取得中（行: ' + lastRow + '）...');
    // 最新の申し込みを取得
    const data = sheet.getRange(lastRow, 1, 1, 10).getValues()[0];
    Logger.log('取得した生データ: ' + JSON.stringify(data));

    const [timestamp, productId, productName, brand, category, variantId, variantName, color, type, frontendTimestamp] = data;

    Logger.log('データ解析中...');
    Logger.log('解析対象:', {
      timestamp: timestamp,
      productId: productId,
      productName: productName,
      brand: brand,
      category: category,
      variantId: variantId,
      variantName: variantName,
      color: color,
      type: type,
      frontendTimestamp: frontendTimestamp
    });

    const result = {
      hasApplication: true,
      lastApplication: {
        timestamp: timestamp,
        rowNumber: lastRow,
        selectedItem: {
          id: productId,
          name: productName,
          brand: brand,
          category: category,
          variant: {
            id: variantId,
            name: variantName,
            color: color
          }
        },
        type: type,
        frontendTimestamp: frontendTimestamp
      },
      message: '申し込み履歴があります'
    };

    Logger.log('✅ 申し込み状況取得完了: ' + JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    Logger.log('❌ 申し込み状況取得エラー: ' + error.toString());
    Logger.log('エラースタック: ' + error.stack);
    return {
      hasApplication: false,
      error: error.toString(),
      message: 'エラーが発生しました'
    };
  }
}