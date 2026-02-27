'use client';
import { useState, useEffect } from 'react';
import { generateFacilityCode, getFacilities, saveFacilities } from '@/utils/storageUtils';

const initialFacilities = [
    { id: '1', facilityCode: 'FCD-00001', name: 'サンプル病院A', email: 'hospital-a@example.com', createdAt: '2024/01/01', status: 'active', lastOrder: '2024/01/15' },
    { id: '2', facilityCode: 'FCD-00002', name: '介護施設B', email: 'care-b@example.com', createdAt: '2024/01/05', status: 'active', lastOrder: '2024/01/14' },
    { id: '3', facilityCode: 'FCD-00003', name: 'クリニックC', email: 'clinic-c@example.com', createdAt: '2024/01/10', status: 'active', lastOrder: '2024/01/13' },
    { id: '4', facilityCode: 'FCD-00004', name: '診療所D', email: 'clinic-d@example.com', createdAt: '2024/01/12', status: 'inactive', lastOrder: null },
];

export default function FacilityManagement() {
    const [facilities, setFacilities] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingFacility, setEditingFacility] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [openMenuId, setOpenMenuId] = useState(null);

    // 初期ロード
    useEffect(() => {
        const saved = getFacilities();
        if (saved && saved.length > 0) {
            setFacilities(saved);
        } else {
            setFacilities(initialFacilities);
            saveFacilities(initialFacilities);
        }
        setIsLoaded(true);
    }, []);

    // 変更を保存
    useEffect(() => {
        if (isLoaded && facilities.length > 0) {
            saveFacilities(facilities);
        }
    }, [facilities, isLoaded]);

    const openModal = (facility = null) => {
        if (facility) {
            setEditingFacility(facility);
            setFormData({
                name: facility.name,
                email: facility.email,
                password: ''
            });
        } else {
            setEditingFacility(null);
            setFormData({
                name: '',
                email: '',
                password: ''
            });
        }
        setShowModal(true);
    };

    const handleSave = () => {
        if (!formData.name || !formData.email) {
            alert('施設名とメールアドレスは必須です');
            return;
        }
        if (editingFacility) {
            setFacilities(facilities.map(f =>
                f.id === editingFacility.id
                    ? { ...f, name: formData.name, email: formData.email }
                    : f
            ));
        } else {
            // 新規登録時に施設CDを自動発行
            const newFacilityCode = generateFacilityCode();
            const newFacility = {
                id: String(Date.now()),
                facilityCode: newFacilityCode,
                name: formData.name,
                email: formData.email,
                createdAt: new Date().toLocaleDateString('ja-JP'),
                status: 'active',
                lastOrder: null
            };
            setFacilities([...facilities, newFacility]);
            alert(`施設が登録されました。\n施設CD: ${newFacilityCode}`);
        }
        setShowModal(false);
    };

    const toggleStatus = (id) => {
        setFacilities(facilities.map(f =>
            f.id === id
                ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' }
                : f
        ));
    };

    const handleDelete = (id) => {
        if (confirm('この施設アカウントを削除してもよろしいですか？')) {
            setFacilities(facilities.filter(f => f.id !== id));
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1>施設管理</h1>
                    <p className="text-muted">配下施設のアカウントを管理できます</p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary">
                    ➕ 新規施設登録
                </button>
            </div>

            {/* 統計 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)'
            }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <p className="text-muted">総施設数</p>
                    <p style={{ fontSize: '2rem', fontWeight: '700' }}>{facilities.length}</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <p className="text-muted">アクティブ</p>
                    <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>
                        {facilities.filter(f => f.status === 'active').length}
                    </p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <p className="text-muted">停止中</p>
                    <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--warning)' }}>
                        {facilities.filter(f => f.status === 'inactive').length}
                    </p>
                </div>
            </div>

            {/* 施設テーブル */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>施設CD</th>
                                <th>施設名</th>
                                <th>メールアドレス</th>
                                <th>登録日</th>
                                <th>最終発注日</th>
                                <th>ステータス</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facilities.map(facility => (
                                <tr key={facility.id}>
                                    <td><code style={{ fontSize: '0.85rem', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>{facility.facilityCode}</code></td>
                                    <td><strong>{facility.name}</strong></td>
                                    <td>{facility.email}</td>
                                    <td>{facility.createdAt}</td>
                                    <td>{facility.lastOrder || '-'}</td>
                                    <td>
                                        {facility.status === 'active' ? (
                                            <span className="badge badge-success">アクティブ</span>
                                        ) : (
                                            <span className="badge badge-warning">停止中</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex gap-sm">
                                            <button onClick={() => openModal(facility)} className="btn btn-sm btn-secondary">
                                                編集
                                            </button>
                                            <button onClick={() => toggleStatus(facility.id)} className="btn btn-sm btn-warning">
                                                {facility.status === 'active' ? '停止' : '有効化'}
                                            </button>
                                            <div className="more-menu">
                                                <button className="more-menu-trigger" onClick={() => setOpenMenuId(openMenuId === facility.id ? null : facility.id)}>⋯</button>
                                                {openMenuId === facility.id && (
                                                    <div className="more-menu-dropdown">
                                                        <button onClick={() => { handleDelete(facility.id); setOpenMenuId(null); }}>🗑 削除</button>
                                                    </div>
                                                )}
                                            </div>
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
                            <h2 className="modal-title">{editingFacility ? '施設情報編集' : '新規施設登録'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        {/* ユーザータイプ表示 */}
                        <div style={{
                            marginBottom: 'var(--spacing-md)',
                            padding: '10px',
                            background: 'rgba(5,150,105,0.08)',
                            borderRadius: '6px',
                            border: '1px solid rgba(5,150,105,0.2)'
                        }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                📋 ユーザータイプ: <strong style={{ color: 'var(--success)' }}>病院・施設</strong>
                            </p>
                        </div>

                        {editingFacility && (
                            <div style={{ marginBottom: 'var(--spacing-md)', padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>施設CD: </span>
                                <strong style={{ fontFamily: 'monospace' }}>{editingFacility.facilityCode}</strong>
                            </div>
                        )}

                        {!editingFacility && (
                            <div style={{ marginBottom: 'var(--spacing-md)', padding: '10px', background: 'rgba(37,99,235,0.06)', borderRadius: '6px', border: '1px solid rgba(37,99,235,0.15)' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    💡 施設CDは登録時に自動発行されます
                                </p>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">施設名</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="例: サンプル病院"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">メールアドレス（ログインID）</label>
                            <input
                                type="email"
                                className="form-input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="例: facility@example.com"
                            />
                        </div>

                        {!editingFacility && (
                            <div className="form-group">
                                <label className="form-label">初期パスワード</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="8文字以上"
                                />
                            </div>
                        )}

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
