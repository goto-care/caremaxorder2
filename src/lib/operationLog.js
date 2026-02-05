// 操作ログ記録ユーティリティ
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * 操作ログを記録
 * @param {string} userId - 操作したユーザーID
 * @param {string} action - 操作内容（例: UPDATE_QUANTITY, CREATE_ORDER, DELETE_PRODUCT）
 * @param {object} details - 詳細情報
 */
export const logOperation = async (userId, action, details) => {
    try {
        await addDoc(collection(db, 'operationLogs'), {
            userId,
            action,
            details,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error('操作ログの記録に失敗:', error);
    }
};

// 操作アクションの定数
export const ACTIONS = {
    // 注文関連
    CREATE_ORDER: 'CREATE_ORDER',
    UPDATE_ORDER: 'UPDATE_ORDER',
    CONFIRM_ORDER: 'CONFIRM_ORDER',
    CANCEL_ORDER: 'CANCEL_ORDER',

    // 商品関連
    CREATE_PRODUCT: 'CREATE_PRODUCT',
    UPDATE_PRODUCT: 'UPDATE_PRODUCT',
    DELETE_PRODUCT: 'DELETE_PRODUCT',
    IMPORT_PRODUCTS: 'IMPORT_PRODUCTS',

    // 数量変更
    UPDATE_QUANTITY: 'UPDATE_QUANTITY',

    // ユーザー関連
    CREATE_USER: 'CREATE_USER',
    UPDATE_USER: 'UPDATE_USER',

    // テンプレート関連
    CREATE_TEMPLATE: 'CREATE_TEMPLATE',
    UPDATE_TEMPLATE: 'UPDATE_TEMPLATE',
    DELETE_TEMPLATE: 'DELETE_TEMPLATE',
};
