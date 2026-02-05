'use client';
import { useState } from 'react';

export default function OrderHistory() {
    const [orders, setOrders] = useState([
        {
            id: 'ORD-2024-001',
            date: '2024/01/15 14:30',
            items: 5,
            total: 25,
            status: 'completed',
            pdfUrl: '#'
        },
        {
            id: 'ORD-2024-002',
            date: '2024/01/10 09:15',
            items: 3,
            total: 12,
            status: 'completed',
            pdfUrl: '#'
        },
        {
            id: 'ORD-2024-003',
            date: '2024/01/05 16:45',
            items: 8,
            total: 45,
            status: 'completed',
            pdfUrl: '#'
        },
        {
            id: 'ORD-2023-098',
            date: '2023/12/28 11:00',
            items: 4,
            total: 18,
            status: 'completed',
            pdfUrl: '#'
        },
        {
            id: 'ORD-2023-097',
            date: '2023/12/20 10:30',
            items: 6,
            total: 30,
            status: 'completed',
            pdfUrl: '#'
        },
    ]);

    const [filter, setFilter] = useState({
        year: '',
        month: ''
    });

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetail, setShowDetail] = useState(false);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <span className="badge badge-success">送信済</span>;
            case 'processing':
                return <span className="badge badge-warning">処理中</span>;
            case 'pending':
                return <span className="badge badge-primary">確認中</span>;
            default:
                return <span className="badge">{status}</span>;
        }
    };

    const handleDownloadPDF = (order) => {
        // 実際はFirebase Storageからダウンロード
        alert(`発注書 ${order.id} のPDFをダウンロードします`);
    };

    const viewOrderDetail = (order) => {
        setSelectedOrder({
            ...order,
            items: [
                { no: 1, janCode: '4901234567890', productName: 'サンプル商品A', specification: '100ml×10本', quantity: 5 },
                { no: 2, janCode: '4901234567891', productName: 'サンプル商品B', specification: '50g×20個', quantity: 3 },
                { no: 3, janCode: '4901234567892', productName: 'サンプル商品C', specification: '200ml×5本', quantity: 10 },
            ],
            deliveryAddresses: ['東京都千代田区1-1-1 サンプル病院'],
            remarks: '午前中配送希望'
        });
        setShowDetail(true);
    };

    return (
        <div>
            <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>発注履歴</h1>

            {/* フィルター */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                    <div>
                        <label className="form-label">年</label>
                        <select
                            className="form-input"
                            value={filter.year}
                            onChange={(e) => setFilter({ ...filter, year: e.target.value })}
                        >
                            <option value="">すべて</option>
                            <option value="2024">2024年</option>
                            <option value="2023">2023年</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label">月</label>
                        <select
                            className="form-input"
                            value={filter.month}
                            onChange={(e) => setFilter({ ...filter, month: e.target.value })}
                        >
                            <option value="">すべて</option>
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={String(i + 1)}>{i + 1}月</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 履歴テーブル */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>発注番号</th>
                                <th>発注日時</th>
                                <th>品目数</th>
                                <th>総数量</th>
                                <th>ステータス</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td><strong>{order.id}</strong></td>
                                    <td>{order.date}</td>
                                    <td>{order.items}品目</td>
                                    <td>{order.total}ケース</td>
                                    <td>{getStatusBadge(order.status)}</td>
                                    <td>
                                        <div className="flex gap-sm">
                                            <button
                                                onClick={() => viewOrderDetail(order)}
                                                className="btn btn-sm btn-secondary"
                                            >
                                                詳細
                                            </button>
                                            <button
                                                onClick={() => handleDownloadPDF(order)}
                                                className="btn btn-sm btn-primary"
                                            >
                                                📥 PDF
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 詳細モーダル */}
            {showDetail && selectedOrder && (
                <div className="modal-overlay" onClick={() => setShowDetail(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">発注詳細 - {selectedOrder.id}</h2>
                            <button className="modal-close" onClick={() => setShowDetail(false)}>×</button>
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <p><strong>発注日時:</strong> {selectedOrder.date}</p>
                            <p><strong>ステータス:</strong> {getStatusBadge(selectedOrder.status)}</p>
                        </div>

                        <div className="table-container" style={{ marginBottom: 'var(--spacing-md)' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>JANコード</th>
                                        <th>商品名</th>
                                        <th>規格</th>
                                        <th>数量</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.items.map((item) => (
                                        <tr key={item.no}>
                                            <td>{item.no}</td>
                                            <td>{item.janCode}</td>
                                            <td>{item.productName}</td>
                                            <td>{item.specification}</td>
                                            <td><strong>{item.quantity}ケース</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <p><strong>お届け先:</strong></p>
                            {selectedOrder.deliveryAddresses.map((addr, i) => (
                                <p key={i} style={{ marginLeft: 'var(--spacing-md)' }}>{i + 1}. {addr}</p>
                            ))}
                        </div>

                        {selectedOrder.remarks && (
                            <div>
                                <p><strong>備考:</strong> {selectedOrder.remarks}</p>
                            </div>
                        )}

                        <div className="modal-footer">
                            <button onClick={() => setShowDetail(false)} className="btn btn-secondary">閉じる</button>
                            <button onClick={() => handleDownloadPDF(selectedOrder)} className="btn btn-primary">📥 PDFダウンロード</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
