// PDF生成ユーティリティ
import { jsPDF } from 'jspdf';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * 発注書PDFを生成
 * @param {object} orderData - 発注データ
 * @returns {jsPDF} PDFドキュメント
 */
export const generateOrderPDF = (orderData) => {
    const doc = new jsPDF();

    // フォント設定（日本語対応が必要な場合はフォントを追加）
    doc.setFontSize(20);
    doc.text('発注書', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`発注日: ${orderData.orderDate || new Date().toLocaleDateString('ja-JP')}`, 20, 40);
    doc.text(`発注番号: ${orderData.orderNumber || ''}`, 20, 50);
    doc.text(`発注元: ${orderData.facilityName || ''}`, 20, 60);

    // テーブルヘッダー
    let y = 80;
    const headers = ['No', 'JANコード', '商品名', '規格', '数量', '備考'];
    const colWidths = [15, 35, 50, 30, 20, 40];
    let x = 10;

    doc.setFillColor(240, 240, 240);
    doc.rect(10, y - 5, 190, 10, 'F');

    headers.forEach((header, i) => {
        doc.text(header, x, y);
        x += colWidths[i];
    });

    y += 15;

    // 商品行
    if (orderData.items && orderData.items.length > 0) {
        orderData.items.forEach((item, index) => {
            x = 10;
            const row = [
                String(index + 1),
                item.janCode || '',
                item.productName || '',
                item.specification || '',
                String(item.quantity || 0),
                item.remarks || ''
            ];

            row.forEach((cell, i) => {
                // テキストが長い場合は折り返し
                const text = cell.length > 15 ? cell.substring(0, 15) + '...' : cell;
                doc.text(text, x, y);
                x += colWidths[i];
            });

            y += 10;

            // ページ超え対応
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
        });
    }

    // お届け先情報
    if (orderData.deliveryAddresses && orderData.deliveryAddresses.length > 0) {
        y += 10;
        doc.text('【お届け先】', 10, y);
        y += 10;
        orderData.deliveryAddresses.forEach((address, i) => {
            doc.text(`${i + 1}. ${address}`, 15, y);
            y += 8;
        });
    }

    return doc;
};

/**
 * PDFをFirebase Storageに保存
 * @param {jsPDF} pdfDoc - PDFドキュメント
 * @param {string} orderId - 発注ID
 * @param {string} facilityId - 施設ID
 * @returns {string} ダウンロードURL
 */
export const savePDFToStorage = async (pdfDoc, orderId, facilityId) => {
    const pdfBlob = pdfDoc.output('blob');
    const fileName = `orders/${facilityId}/${orderId}_${Date.now()}.pdf`;
    const storageRef = ref(storage, fileName);

    await uploadBytes(storageRef, pdfBlob);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
};

/**
 * PDFをダウンロード
 * @param {jsPDF} pdfDoc - PDFドキュメント
 * @param {string} fileName - ファイル名
 */
export const downloadPDF = (pdfDoc, fileName = 'order.pdf') => {
    pdfDoc.save(fileName);
};
