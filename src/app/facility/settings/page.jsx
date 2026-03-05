'use client';
import { useState } from 'react';
import OrderFormatBuilder from '@/components/orderFormatBuilder/OrderFormatBuilder';

export default function OrderSettings() {
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

    // 設定保存（カスタムフィールド・お届け先等）
    const handleSave = () => {
        const settings = {
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
                <button onClick={handleSave} className="btn btn-secondary">
                    💾 その他設定を保存
                </button>
            </div>

            {/* ===== kintone風フォーマットビルダー ===== */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <OrderFormatBuilder />
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



            {/* カスタムフィールド追加モーダル（ヘッダー・フッター用） */}
            {showAddFieldModal && (
                <div className="modal-overlay" onClick={() => setShowAddFieldModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">詳細項目（ヘッダー/フッター）追加</h2>
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
