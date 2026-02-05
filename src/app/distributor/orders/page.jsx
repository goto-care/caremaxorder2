'use client';
import { useState } from 'react';
import Papa from 'papaparse';

export default function DistributorOrders() {
    const [orders, setOrders] = useState([
        {
            id: 'ORD-2024-001',
            facilityName: 'サンプル病院A',
            date: '2024/01/15 14:30',
            items: 5,
            total: 25,
            status: 'completed'
        },
        {
            id: 'ORD-2024-002',
            facilityName: '介護施設B',
            date: '2024/01/14 09:15',
            items: 3,
            total: 12,
            status: 'processing'
        },
        {
            id: 'ORD-2024-003',
            facilityName: 'クリニックC',
            date: '2024/01/13 16:45',
            items: 8,
            total: 45,
            status: 'pending'
        },
        {
            id: 'ORD-2024-004',
            facilityName: 'サンプル病院A',
            date: '2024/01/12 11:00',
            items: 4,
            total: 18,
            status: 'completed'
        },
    ]);

    const [selectedOrders, setSelectedOrders] = useState([]);
    const [filter, setFilter] = useState({
        facility: '',
        status: ''
    });
    const [showDetail, setShowDetail] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <span className="badge badge-success">完了</span>;
            case 'processing':
                return <span className="badge badge-warning">処理中</span>;
            case 'pending':
                return <span className="badge badge-primary">確認中</span>;
            default:
                return <span className="badge">{status}</span>;
        }
    };

    // フィルタリング
    const filteredOrders = orders.filter(order => {
        if (filter.facility && !order.facilityName.includes(filter.facility)) return false;
        if (filter.status && order.status !== filter.status) return false;
        return true;
    });

    // 選択切り替え
    const toggleSelect = (id) => {
        if (selectedOrders.includes(id)) {
            setSelectedOrders(selectedOrders.filter(o => o !== id));
        } else {
            setSelectedOrders([...selectedOrders, id]);
        }
    };

    // 全選択/解除
    const toggleSelectAll = () => {
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(o => o.id));
        }
    };

    // CSVエクスポート
    const handleExportCSV = () => {
        const exportOrders = selectedOrders.length > 0
            ? orders.filter(o => selectedOrders.includes(o.id))
            : filteredOrders;

        // 詳細データを取得（実際はFirestoreから取得）
        const exportData = exportOrders.map(order => ({
            発注番号: order.id,
            施設名: order.facilityName,
            発注日時: order.date,
            品目数: order.items,
            総数量: order.total,
            ステータス: order.status === 'completed' ? '完了' : order.status === 'processing' ? '処理中' : '確認中'
        }));

        const csv = Papa.unparse(exportData, { header: true });
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `発注一覧_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    // 詳細表示
    const viewOrderDetail = (order) => {
        setSelectedOrder({
            ...order,
            items: [
                { no: 1, janCode: '4901234567890', productName: 'サンプル商品A', specification: '100ml×10本', quantity: 5 },
                { no: 2, janCode: '4901234567891', productName: 'サンプル商品B', specification: '50g×20個', quantity: 3 },
                { no: 3, janCode: '4901234567892', productName: 'サンプル商品C', specification: '200ml×5本', quantity: 10 },
            ],
            deliveryAddresses: ['東京都千代田区1-1-1 ' + order.facilityName],
        });
        setShowDetail(true);
    };

    // PDF一括ダウンロード
    const handleBulkPDFDownload = () => {
        if (selectedOrders.length === 0) {
            alert('ダウンロードする発注を選択してください');
            return;
        }
        alert(`${selectedOrders.length}件の発注書PDFをダウンロードします`);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1>発注確認</h1>
                    <p className="text-muted">配下施設からの発注を確認・管理できます</p>
                </div>
                <div className="flex gap-sm">
                    <button onClick={handleExportCSV} className="btn btn-secondary">
                        📤 CSVエクスポート
                    </button>
                    <button onClick={handleBulkPDFDownload} className="btn btn-primary" disabled={selectedOrders.length === 0}>
                        📥 PDF一括DL ({selectedOrders.length})
                    </button>
                </div>
            </div>

            {/* フィルター */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label className="form-label">施設名で検索</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="施設名を入力..."
                            value={filter.facility}
                            onChange={(e) => setFilter({ ...filter, facility: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="form-label">ステータス</label>
                        <select
                            className="form-input"
                            value={filter.status}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        >
                            <option value="">すべて</option>
                            <option value="pending">確認中</option>
                            <option value="processing">処理中</option>
                            <option value="completed">完了</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 発注テーブル */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th>発注番号</th>
                                <th>施設名</th>
                                <th>発注日時</th>
                                <th>品目数</th>
                                <th>総数量</th>
                                <th>ステータス</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedOrders.includes(order.id)}
                                            onChange={() => toggleSelect(order.id)}
                                        />
                                    </td>
                                    <td><strong>{order.id}</strong></td>
                                    <td>{order.facilityName}</td>
                                    <td>{order.date}</td>
                                    <td>{order.items}品目</td>
                                    <td>{order.total}ケース</td>
                                    <td>{getStatusBadge(order.status)}</td>
                                    <td>
                                        <div className="flex gap-sm">
                                            <button onClick={() => viewOrderDetail(order)} className="btn btn-sm btn-secondary">
                                                詳細
                                            </button>
                                            <button className="btn btn-sm btn-primary">
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
                            <p><strong>施設名:</strong> {selectedOrder.facilityName}</p>
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

                        <div>
                            <p><strong>お届け先:</strong></p>
                            {selectedOrder.deliveryAddresses.map((addr, i) => (
                                <p key={i} style={{ marginLeft: 'var(--spacing-md)' }}>{i + 1}. {addr}</p>
                            ))}
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setShowDetail(false)} className="btn btn-secondary">閉じる</button>
                            <button className="btn btn-primary">📥 PDFダウンロード</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
