'use client';
import { useState } from 'react';

export default function OperationLogs() {
    const [logs, setLogs] = useState([
        { id: '1', userId: 'user-001', userName: 'サンプル病院A', action: 'CREATE_ORDER', details: '発注書作成 ORD-2024-001', timestamp: '2024/01/15 14:30:25' },
        { id: '2', userId: 'user-001', userName: 'サンプル病院A', action: 'UPDATE_QUANTITY', details: '商品A: 5ケース → 10ケース', timestamp: '2024/01/15 14:28:10' },
        { id: '3', userId: 'admin', userName: '管理者', action: 'CREATE_PRODUCT', details: '商品マスタ追加: サンプル商品D', timestamp: '2024/01/15 10:15:00' },
        { id: '4', userId: 'user-002', userName: '介護施設B', action: 'CONFIRM_ORDER', details: '発注確定 ORD-2024-002', timestamp: '2024/01/14 09:20:45' },
        { id: '5', userId: 'admin', userName: '管理者', action: 'IMPORT_PRODUCTS', details: 'CSVインポート: 15件', timestamp: '2024/01/14 08:30:00' },
        { id: '6', userId: 'user-003', userName: 'クリニックC', action: 'CREATE_TEMPLATE', details: 'テンプレート作成: 定期発注', timestamp: '2024/01/13 17:00:30' },
    ]);

    const [filter, setFilter] = useState({
        action: '',
        user: '',
        dateFrom: '',
        dateTo: ''
    });

    const actionLabels = {
        CREATE_ORDER: { label: '発注作成', color: 'badge-primary' },
        UPDATE_ORDER: { label: '発注更新', color: 'badge-primary' },
        CONFIRM_ORDER: { label: '発注確定', color: 'badge-success' },
        CANCEL_ORDER: { label: '発注取消', color: 'badge-danger' },
        CREATE_PRODUCT: { label: '商品追加', color: 'badge-primary' },
        UPDATE_PRODUCT: { label: '商品更新', color: 'badge-warning' },
        DELETE_PRODUCT: { label: '商品削除', color: 'badge-danger' },
        IMPORT_PRODUCTS: { label: 'CSVインポート', color: 'badge-primary' },
        UPDATE_QUANTITY: { label: '数量変更', color: 'badge-warning' },
        CREATE_USER: { label: 'ユーザー作成', color: 'badge-primary' },
        UPDATE_USER: { label: 'ユーザー更新', color: 'badge-warning' },
        CREATE_TEMPLATE: { label: 'テンプレート作成', color: 'badge-primary' },
        UPDATE_TEMPLATE: { label: 'テンプレート更新', color: 'badge-warning' },
        DELETE_TEMPLATE: { label: 'テンプレート削除', color: 'badge-danger' },
    };

    const getActionBadge = (action) => {
        const info = actionLabels[action] || { label: action, color: 'badge' };
        return <span className={`badge ${info.color}`}>{info.label}</span>;
    };

    // フィルタリング
    const filteredLogs = logs.filter(log => {
        if (filter.action && log.action !== filter.action) return false;
        if (filter.user && !log.userName.includes(filter.user)) return false;
        return true;
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1>操作ログ</h1>
                    <p className="text-muted">誰が・いつ・何を変更したかの履歴を確認できます</p>
                </div>
            </div>

            {/* フィルター */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label className="form-label">ユーザー名で検索</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="ユーザー名を入力..."
                            value={filter.user}
                            onChange={(e) => setFilter({ ...filter, user: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="form-label">操作種別</label>
                        <select
                            className="form-input"
                            value={filter.action}
                            onChange={(e) => setFilter({ ...filter, action: e.target.value })}
                        >
                            <option value="">すべて</option>
                            <optgroup label="発注関連">
                                <option value="CREATE_ORDER">発注作成</option>
                                <option value="UPDATE_ORDER">発注更新</option>
                                <option value="CONFIRM_ORDER">発注確定</option>
                                <option value="CANCEL_ORDER">発注取消</option>
                            </optgroup>
                            <optgroup label="商品関連">
                                <option value="CREATE_PRODUCT">商品追加</option>
                                <option value="UPDATE_PRODUCT">商品更新</option>
                                <option value="DELETE_PRODUCT">商品削除</option>
                                <option value="IMPORT_PRODUCTS">CSVインポート</option>
                            </optgroup>
                            <optgroup label="その他">
                                <option value="UPDATE_QUANTITY">数量変更</option>
                                <option value="CREATE_TEMPLATE">テンプレート作成</option>
                            </optgroup>
                        </select>
                    </div>
                </div>
            </div>

            {/* ログテーブル */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>日時</th>
                                <th>ユーザー</th>
                                <th>操作</th>
                                <th>詳細</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map(log => (
                                <tr key={log.id}>
                                    <td style={{ whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                                    <td><strong>{log.userName}</strong></td>
                                    <td>{getActionBadge(log.action)}</td>
                                    <td>{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredLogs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                        該当するログがありません
                    </div>
                )}
            </div>
        </div>
    );
}
