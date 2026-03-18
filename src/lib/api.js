// API連携（モック実装）
// 本番環境では実際のAPIエンドポイントに置き換えてください

const MOCK_API_DELAY = 1000; // モックAPIの遅延（ミリ秒）

/**
 * 発注書をAPIに送信（モック）
 * @param {object} orderData - 発注データ
 * @returns {object} レスポンス
 */
export const submitOrderToAPI = async (orderData) => {
    // 本番環境では以下のようなコードになります:
    // const response = await fetch('https://api.example.com/orders', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${getAuthToken()}`
    //   },
    //   body: JSON.stringify(orderData)
    // });
    // return await response.json();

    // モック実装
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('API送信（モック）:', orderData);
            resolve({
                success: true,
                orderId: `API-${Date.now()}`,
                message: '発注が正常に送信されました',
                timestamp: new Date().toISOString(),
            });
        }, MOCK_API_DELAY);
    });
};

/**
 * 発注ステータスを確認（モック）
 * @param {string} orderId - 発注ID
 * @returns {object} ステータス情報
 */
export const checkOrderStatus = async (orderId) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                orderId,
                status: 'received',
                message: '発注を受け付けました',
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            });
        }, MOCK_API_DELAY);
    });
};

