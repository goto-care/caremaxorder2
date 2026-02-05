'use client';
import { useState } from 'react';

export default function OrderSettings() {
    const [columns, setColumns] = useState([
        { id: 'no', name: 'No', required: true, enabled: true, width: 50 },
        { id: 'janCode', name: 'JANコード', required: true, enabled: true, width: 140 },
        { id: 'productName', name: '商品名', required: true, enabled: true, width: 200 },
        { id: 'specification', name: '規格', required: true, enabled: true, width: 120 },
        { id: 'caseQuantity', name: 'ケース入数', required: false, enabled: true, width: 80 },
        { id: 'quantity', name: '数量', required: true, enabled: true, width: 80 },
        { id: 'remarks', name: '備考', required: false, enabled: true, width: 150 },
    ]);

    const [customFields, setCustomFields] = useState([
        { id: '1', type: 'text', label: '施設名', value: 'サンプル病院', position: 'header' },
        { id: '2', type: 'text', label: '担当者', value: '', position: 'header' },
    ]);

    const [deliveryAddressCount, setDeliveryAddressCount] = useState(3);
    const [remarksCount, setRemarksCount] = useState(2);

    const [showAddFieldModal, setShowAddFieldModal] = useState(false);
    const [newField, setNewField] = useState({
        type: 'text',
        label: '',
        position: 'header'
    });

    // 列の表示切り替え
    const toggleColumn = (id) => {
        setColumns(columns.map(col =>
            col.id === id && !col.required
                ? { ...col, enabled: !col.enabled }
                : col
        ));
    };

    // 列の幅変更
    const updateColumnWidth = (id, width) => {
        setColumns(columns.map(col =>
            col.id === id ? { ...col, width: parseInt(width) || 50 } : col
        ));
    };

    // カスタムフィールド追加
    const addCustomField = () => {
        if (!newField.label) return;
        setCustomFields([
            ...customFields,
            { ...newField, id: String(Date.now()) }
        ]);
        setShowAddFieldModal(false);
        setNewField({ type: 'text', label: '', position: 'header' });
    };

    // カスタムフィールド削除
    const removeCustomField = (id) => {
        setCustomFields(customFields.filter(f => f.id !== id));
    };

    // 設定保存
    const handleSave = () => {
        const settings = {
            columns,
            customFields,
            deliveryAddressCount,
            remarksCount
        };
        localStorage.setItem('orderSettings', JSON.stringify(settings));
        alert('設定を保存しました');
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1>発注書設定</h1>
                    <p className="text-muted">発注書のレイアウトと項目をカスタマイズできます</p>
                </div>
                <button onClick={handleSave} className="btn btn-primary">
                    💾 設定を保存
                </button>
            </div>

            {/* 列設定 */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="card-header">
                    <h2 className="card-title">📋 表示列の設定</h2>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>列名</th>
                                <th>表示</th>
                                <th>幅（px）</th>
                                <th>必須</th>
                            </tr>
                        </thead>
                        <tbody>
                            {columns.map(col => (
                                <tr key={col.id}>
                                    <td><strong>{col.name}</strong></td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={col.enabled}
                                            onChange={() => toggleColumn(col.id)}
                                            disabled={col.required}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={col.width}
                                            onChange={(e) => updateColumnWidth(col.id, e.target.value)}
                                            style={{ width: '80px' }}
                                            min="30"
                                            max="500"
                                        />
                                    </td>
                                    <td>
                                        {col.required ? (
                                            <span className="badge badge-warning">必須</span>
                                        ) : (
                                            <span className="text-muted">任意</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* お届け先・備考設定 */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="card-header">
                    <h2 className="card-title">📍 お届け先・備考設定</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                    <div className="form-group">
                        <label className="form-label">お届け先の最大数</label>
                        <input
                            type="number"
                            className="form-input"
                            value={deliveryAddressCount}
                            onChange={(e) => setDeliveryAddressCount(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            max="10"
                        />
                        <small className="text-muted">発注書に追加できるお届け先の最大数</small>
                    </div>
                    <div className="form-group">
                        <label className="form-label">備考欄の最大数</label>
                        <input
                            type="number"
                            className="form-input"
                            value={remarksCount}
                            onChange={(e) => setRemarksCount(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            max="10"
                        />
                        <small className="text-muted">発注書に追加できる備考欄の最大数</small>
                    </div>
                </div>
            </div>

            {/* カスタムフィールド */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">✏️ カスタムフィールド</h2>
                    <button onClick={() => setShowAddFieldModal(true)} className="btn btn-secondary btn-sm">
                        ➕ フィールド追加
                    </button>
                </div>
                <p className="text-muted" style={{ marginBottom: 'var(--spacing-md)' }}>
                    発注書に自社名や担当者名などのテキストボックスを追加できます
                </p>

                {customFields.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', color: 'var(--text-muted)' }}>
                        カスタムフィールドはまだ追加されていません
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ラベル</th>
                                    <th>タイプ</th>
                                    <th>位置</th>
                                    <th>デフォルト値</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customFields.map(field => (
                                    <tr key={field.id}>
                                        <td><strong>{field.label}</strong></td>
                                        <td>
                                            <span className="badge badge-primary">
                                                {field.type === 'text' ? 'テキスト' : 'テキストエリア'}
                                            </span>
                                        </td>
                                        <td>{field.position === 'header' ? 'ヘッダー' : 'フッター'}</td>
                                        <td>{field.value || '-'}</td>
                                        <td>
                                            <button onClick={() => removeCustomField(field.id)} className="btn btn-sm btn-danger">
                                                削除
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* プレビュー */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div className="card-header">
                    <h2 className="card-title">👁️ プレビュー</h2>
                </div>
                <div className="order-form" style={{ transform: 'scale(0.8)', transformOrigin: 'top left', maxHeight: '400px', overflow: 'hidden' }}>
                    <div className="order-form-header">
                        <h2 className="order-form-title">発 注 書</h2>
                        {customFields.filter(f => f.position === 'header').map(field => (
                            <p key={field.id}><strong>{field.label}:</strong> {field.value || '____________'}</p>
                        ))}
                    </div>
                    <table className="order-table">
                        <thead>
                            <tr>
                                {columns.filter(c => c.enabled).map(col => (
                                    <th key={col.id} style={{ width: `${col.width}px` }}>{col.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {columns.filter(c => c.enabled).map(col => (
                                    <td key={col.id}>{col.id === 'no' ? '1' : '...'}</td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* フィールド追加モーダル */}
            {showAddFieldModal && (
                <div className="modal-overlay" onClick={() => setShowAddFieldModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">カスタムフィールド追加</h2>
                            <button className="modal-close" onClick={() => setShowAddFieldModal(false)}>×</button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">ラベル名</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newField.label}
                                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                                placeholder="例: 担当者名"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">タイプ</label>
                            <select
                                className="form-input"
                                value={newField.type}
                                onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                            >
                                <option value="text">テキスト（1行）</option>
                                <option value="textarea">テキストエリア（複数行）</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">表示位置</label>
                            <select
                                className="form-input"
                                value={newField.position}
                                onChange={(e) => setNewField({ ...newField, position: e.target.value })}
                            >
                                <option value="header">ヘッダー（上部）</option>
                                <option value="footer">フッター（下部）</option>
                            </select>
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setShowAddFieldModal(false)} className="btn btn-secondary">キャンセル</button>
                            <button onClick={addCustomField} className="btn btn-primary">追加</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
