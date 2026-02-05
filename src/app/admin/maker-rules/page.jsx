'use client';
import { useState } from 'react';

export default function MakerRules() {
    const [rules, setRules] = useState([
        { id: '1', makerId: 'M001', makerName: 'メーカーA', minimumCases: 5, alertMessage: 'メーカーAの商品は5ケース以上でないと発注できません' },
        { id: '2', makerId: 'M002', makerName: 'メーカーB', minimumCases: 3, alertMessage: 'メーカーBの商品は3ケース以上でないと発注できません' },
        { id: '3', makerId: 'M003', makerName: 'メーカーC', minimumCases: 10, alertMessage: 'メーカーCの商品は10ケース以上でないと発注できません' },
    ]);

    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [formData, setFormData] = useState({
        makerId: '',
        makerName: '',
        minimumCases: '',
        alertMessage: ''
    });

    const openModal = (rule = null) => {
        if (rule) {
            setEditingRule(rule);
            setFormData(rule);
        } else {
            setEditingRule(null);
            setFormData({
                makerId: '',
                makerName: '',
                minimumCases: '',
                alertMessage: ''
            });
        }
        setShowModal(true);
    };

    const handleSave = () => {
        if (editingRule) {
            setRules(rules.map(r => r.id === editingRule.id ? { ...formData, id: editingRule.id } : r));
        } else {
            setRules([...rules, { ...formData, id: String(Date.now()) }]);
        }
        setShowModal(false);
    };

    const handleDelete = (id) => {
        if (confirm('このルールを削除してもよろしいですか？')) {
            setRules(rules.filter(r => r.id !== id));
        }
    };

    // メーカーCDからアラートメッセージを自動生成
    const handleMakerChange = (field, value) => {
        const newFormData = { ...formData, [field]: value };

        if (field === 'minimumCases' || field === 'makerName') {
            const cases = field === 'minimumCases' ? value : formData.minimumCases;
            const name = field === 'makerName' ? value : formData.makerName;
            if (cases && name) {
                newFormData.alertMessage = `${name}の商品は${cases}ケース以上でないと発注できません`;
            }
        }

        setFormData(newFormData);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1>メーカールール設定</h1>
                    <p className="text-muted">メーカーごとの最低発注ケース数を設定します</p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary">
                    ➕ 新規ルール追加
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>メーカーCD</th>
                                <th>メーカー名</th>
                                <th>最低ケース数</th>
                                <th>アラートメッセージ</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rules.map((rule) => (
                                <tr key={rule.id}>
                                    <td><span className="badge badge-primary">{rule.makerId}</span></td>
                                    <td>{rule.makerName}</td>
                                    <td><strong>{rule.minimumCases}ケース</strong></td>
                                    <td style={{ maxWidth: '300px', fontSize: '0.875rem' }}>{rule.alertMessage}</td>
                                    <td>
                                        <div className="flex gap-sm">
                                            <button onClick={() => openModal(rule)} className="btn btn-sm btn-secondary">編集</button>
                                            <button onClick={() => handleDelete(rule.id)} className="btn btn-sm btn-danger">削除</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* モーダル */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingRule ? 'ルール編集' : '新規ルール追加'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">メーカーCD</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="例: M001"
                                value={formData.makerId}
                                onChange={(e) => handleMakerChange('makerId', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">メーカー名</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="例: メーカーA"
                                value={formData.makerName}
                                onChange={(e) => handleMakerChange('makerName', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">最低発注ケース数</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="例: 5"
                                min="1"
                                value={formData.minimumCases}
                                onChange={(e) => handleMakerChange('minimumCases', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">アラートメッセージ</label>
                            <textarea
                                className="form-input"
                                rows="3"
                                placeholder="発注時に表示されるメッセージ"
                                value={formData.alertMessage}
                                onChange={(e) => handleMakerChange('alertMessage', e.target.value)}
                            />
                            <small className="text-muted">最低ケース数を下回った場合に表示されます</small>
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">キャンセル</button>
                            <button onClick={handleSave} className="btn btn-primary">保存</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
