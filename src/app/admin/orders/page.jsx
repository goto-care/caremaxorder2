'use client';
import { useState } from 'react';

export default function AdminOrders() {
    const [orders, setOrders] = useState([
        { id: 'ORD-2024-001', facility: 'サンプル病院A', distributor: '販売店X', date: '2024/01/15', items: 5, status: 'completed' },
        { id: 'ORD-2024-002', facility: '介護施設B', distributor: '販売店Y', date: '2024/01/14', items: 3, status: 'processing' },
        { id: 'ORD-2024-003', facility: 'クリニックC', distributor: '販売店X', date: '2024/01/13', items: 8, status: 'pending' },
    ]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <span className="badge badge-success">完了</span>;
            case 'processing': return <span className="badge badge-warning">処理中</span>;
            case 'pending': return <span className="badge badge-primary">確認中</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>発注一覧</h1>
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>発注番号</th>
                                <th>施設名</th>
                                <th>販売店</th>
                                <th>発注日</th>
                                <th>品目数</th>
                                <th>ステータス</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td><strong>{order.id}</strong></td>
                                    <td>{order.facility}</td>
                                    <td>{order.distributor}</td>
                                    <td>{order.date}</td>
                                    <td>{order.items}品目</td>
                                    <td>{getStatusBadge(order.status)}</td>
                                    <td><button className="btn btn-sm btn-secondary">詳細</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
