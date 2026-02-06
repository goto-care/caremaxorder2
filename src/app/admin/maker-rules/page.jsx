'use client';
import { useState, useMemo } from 'react';

export default function MakerRules() {
    // 商品マスタからメーカー一覧を取得（実際はFirestoreから取得）
    const [productMaster] = useState([
        { id: '1', makerId: 'M001', makerName: 'メーカーA' },
        { id: '2', makerId: 'M002', makerName: 'メーカーB' },
        { id: '3', makerId: 'M003', makerName: 'メーカーC' },
    ]);

    // 商品マスタから重複を除いたメーカー一覧
    const makerList = useMemo(() => {
        const uniqueMakers = new Map();
        productMaster.forEach(p => {
            if (p.makerId && !uniqueMakers.has(p.makerId)) {
                uniqueMakers.set(p.makerId, { makerId: p.makerId, makerName: p.makerName });
            }
        });
        return Array.from(uniqueMakers.values());
    }, [productMaster]);

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

    // メーカー選択時にメーカー名とアラートメッセージを自動設定
    const handleMakerSelect = (makerId) => {
        const maker = makerList.find(m => m.makerId === makerId);
        if (maker) {
            const newFormData = {
                ...formData,
                makerId: maker.makerId,
                makerName: maker.makerName
            };
            // アラートメッセージを自動生成
            if (formData.minimumCases) {
                newFormData.alertMessage = `${maker.makerName}の商品は${formData.minimumCases}ケース以上でないと発注できません`;
            }
            setFormData(newFormData);
        }
    };

    // 最低ケース数変更時にアラートメッセージを自動生成
    const handleMinimumCasesChange = (value) => {
        const newFormData = {
            ...formData,
            minimumCases: value
        };
        if (formData.makerName && value) {
            newFormData.alertMessage = `${formData.makerName}の商品は${value}ケース以上でないと発注できません`;
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
                            <label className="form-label">メーカー選択</label>
                            <select
                                className="form-input"
                                value={formData.makerId}
                                onChange={(e) => handleMakerSelect(e.target.value)}
                            >
                                <option value="">メーカーを選択してください</option>
                                {makerList.map(maker => (
                                    <option key={maker.makerId} value={maker.makerId}>
                                        {maker.makerId} - {maker.makerName}
                                    </option>
                                ))}
                            </select>
                            <small className="text-muted">商品マスタに登録されているメーカーから選択できます</small>
                        </div>

                        <div className="form-group">
                            <label className="form-label">最低発注ケース数</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="例: 5"
                                min="1"
                                value={formData.minimumCases}
                                onChange={(e) => handleMinimumCasesChange(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">アラートメッセージ</label>
                            <textarea
                                className="form-input"
                                rows="3"
                                placeholder="発注時に表示されるメッセージ"
                                value={formData.alertMessage}
                                onChange={(e) => setFormData({ ...formData, alertMessage: e.target.value })}
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
