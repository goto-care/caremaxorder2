'use client';
import { useState } from 'react';

export default function AdminUsers() {
    const [distributors, setDistributors] = useState([
        {
            id: '1',
            name: '販売店X',
            email: 'x@example.com',
            status: 'active',
            userType: '販売店',
            facilities: [
                { id: 'f1', facilityCode: 'FCD-00001', name: 'サンプル病院A', email: 'a@example.com', status: 'active', userType: '病院・施設' },
                { id: 'f2', facilityCode: 'FCD-00002', name: '介護施設B', email: 'b@example.com', status: 'active', userType: '病院・施設' },
                { id: 'f3', facilityCode: 'FCD-00003', name: 'クリニックC', email: 'c@example.com', status: 'active', userType: '病院・施設' },
            ]
        },
        {
            id: '2',
            name: '販売店Y',
            email: 'y@example.com',
            status: 'active',
            userType: '販売店',
            facilities: [
                { id: 'f4', facilityCode: 'FCD-00004', name: '診療所D', email: 'd@example.com', status: 'active', userType: '病院・施設' },
                { id: 'f5', facilityCode: 'FCD-00005', name: '介護施設E', email: 'e@example.com', status: 'inactive', userType: '病院・施設' },
            ]
        },
        {
            id: '3',
            name: '販売店Z',
            email: 'z@example.com',
            status: 'active',
            userType: '販売店',
            facilities: []
        },
    ]);

    const [expandedIds, setExpandedIds] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('distributor');
    const [parentDistributorId, setParentDistributorId] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [openMenuId, setOpenMenuId] = useState(null);

    const toggleExpand = (id) => {
        if (expandedIds.includes(id)) {
            setExpandedIds(expandedIds.filter(d => d !== id));
        } else {
            setExpandedIds([...expandedIds, id]);
        }
    };

    const openDistributorModal = () => {
        setModalType('distributor');
        setParentDistributorId(null);
        setFormData({ name: '', email: '', password: '' });
        setShowModal(true);
    };

    const openFacilityModal = (distributorId) => {
        setModalType('facility');
        setParentDistributorId(distributorId);
        setFormData({ name: '', email: '', password: '' });
        setShowModal(true);
    };

    const handleSave = () => {
        if (!formData.name || !formData.email) {
            alert('名前とメールアドレスは必須です');
            return;
        }

        if (modalType === 'distributor') {
            setDistributors([...distributors, {
                id: String(Date.now()),
                name: formData.name,
                email: formData.email,
                status: 'active',
                userType: '販売店',
                facilities: []
            }]);
        } else {
            const facilityCodeNum = distributors.reduce((max, d) =>
                Math.max(max, ...d.facilities.map(f => parseInt(f.facilityCode?.replace('FCD-', '') || '0'))), 0
            ) + 1;

            setDistributors(distributors.map(d =>
                d.id === parentDistributorId
                    ? {
                        ...d,
                        facilities: [...d.facilities, {
                            id: String(Date.now()),
                            facilityCode: `FCD-${String(facilityCodeNum).padStart(5, '0')}`,
                            name: formData.name,
                            email: formData.email,
                            status: 'active',
                            userType: '病院・施設'
                        }]
                    }
                    : d
            ));

            if (!expandedIds.includes(parentDistributorId)) {
                setExpandedIds([...expandedIds, parentDistributorId]);
            }
        }

        setShowModal(false);
    };

    const deleteDistributor = (id) => {
        const dist = distributors.find(d => d.id === id);
        if (dist && dist.facilities.length > 0) {
            if (!confirm(`この販売店には${dist.facilities.length}件の施設が紐づいています。販売店と配下施設をすべて削除しますか？`)) return;
        } else {
            if (!confirm('この販売店を削除しますか？')) return;
        }
        setDistributors(distributors.filter(d => d.id !== id));
        setOpenMenuId(null);
    };

    const deleteFacility = (distributorId, facilityId) => {
        if (!confirm('この施設を削除しますか？')) return;
        setDistributors(distributors.map(d =>
            d.id === distributorId
                ? { ...d, facilities: d.facilities.filter(f => f.id !== facilityId) }
                : d
        ));
        setOpenMenuId(null);
    };

    const totalDistributors = distributors.length;
    const totalFacilities = distributors.reduce((sum, d) => sum + d.facilities.length, 0);

    return (
        <div onClick={() => setOpenMenuId(null)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1>ユーザー管理</h1>
                    <p className="text-muted">販売店→施設の2階層で管理します</p>
                </div>
                <button onClick={openDistributorModal} className="btn btn-primary">➕ 販売店を追加</button>
            </div>

            {/* 統計 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)'
            }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <p className="text-muted">販売店数</p>
                    <p style={{ fontSize: '2rem', fontWeight: '700' }}>{totalDistributors}</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <p className="text-muted">施設数（合計）</p>
                    <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>{totalFacilities}</p>
                </div>
            </div>

            {/* 販売店一覧 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {distributors.map(distributor => {
                    const isExpanded = expandedIds.includes(distributor.id);

                    return (
                        <div key={distributor.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div
                                onClick={() => toggleExpand(distributor.id)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--spacing-md) var(--spacing-lg)',
                                    cursor: 'pointer',
                                    borderBottom: isExpanded ? '1px solid var(--border-light)' : 'none',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                    <span style={{
                                        fontSize: '1.2rem',
                                        transition: 'transform 0.2s',
                                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                        display: 'inline-block'
                                    }}>
                                        ▶
                                    </span>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                            <strong style={{ fontSize: '1.1rem' }}>🏢 {distributor.name}</strong>
                                            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>販売店</span>
                                        </div>
                                        <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                                            {distributor.email} | 配下施設: {distributor.facilities.length}件
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-sm" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => openFacilityModal(distributor.id)} className="btn btn-sm btn-primary">
                                        ➕ 施設追加
                                    </button>
                                    <div className="more-menu">
                                        <button
                                            className="more-menu-trigger"
                                            onClick={() => setOpenMenuId(openMenuId === `dist-${distributor.id}` ? null : `dist-${distributor.id}`)}
                                        >
                                            ⋯
                                        </button>
                                        {openMenuId === `dist-${distributor.id}` && (
                                            <div className="more-menu-dropdown">
                                                <button onClick={() => deleteDistributor(distributor.id)}>🗑 削除</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div style={{ padding: distributor.facilities.length > 0 ? 'var(--spacing-md) var(--spacing-lg)' : 'var(--spacing-md) var(--spacing-lg)' }}>
                                    {distributor.facilities.length === 0 ? (
                                        <p className="text-muted" style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
                                            配下施設がありません。「➕ 施設追加」ボタンから登録してください。
                                        </p>
                                    ) : (
                                        <div className="table-container">
                                            <table className="table" style={{ fontSize: '0.85rem' }}>
                                                <thead>
                                                    <tr>
                                                        <th>施設CD</th>
                                                        <th>施設名</th>
                                                        <th>メール</th>
                                                        <th>ユーザータイプ</th>
                                                        <th>ステータス</th>
                                                        <th>操作</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {distributor.facilities.map(facility => (
                                                        <tr key={facility.id}>
                                                            <td>
                                                                <code style={{
                                                                    fontSize: '0.8rem',
                                                                    background: 'var(--bg-tertiary)',
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px'
                                                                }}>
                                                                    {facility.facilityCode}
                                                                </code>
                                                            </td>
                                                            <td><strong>🏥 {facility.name}</strong></td>
                                                            <td>{facility.email}</td>
                                                            <td><span className="badge badge-success">病院・施設</span></td>
                                                            <td>
                                                                {facility.status === 'active' ? (
                                                                    <span className="badge badge-success">アクティブ</span>
                                                                ) : (
                                                                    <span className="badge badge-warning">停止中</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div className="more-menu">
                                                                    <button
                                                                        className="more-menu-trigger"
                                                                        onClick={() => setOpenMenuId(openMenuId === `fac-${facility.id}` ? null : `fac-${facility.id}`)}
                                                                    >
                                                                        ⋯
                                                                    </button>
                                                                    {openMenuId === `fac-${facility.id}` && (
                                                                        <div className="more-menu-dropdown">
                                                                            <button onClick={() => deleteFacility(distributor.id, facility.id)}>🗑 削除</button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 登録モーダル */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {modalType === 'distributor' ? '新規販売店登録' : '新規施設登録'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        {/* ユーザータイプ表示 */}
                        <div style={{
                            marginBottom: 'var(--spacing-md)',
                            padding: '10px',
                            background: modalType === 'distributor' ? 'rgba(37,99,235,0.08)' : 'rgba(5,150,105,0.08)',
                            borderRadius: '6px',
                            border: `1px solid ${modalType === 'distributor' ? 'rgba(37,99,235,0.2)' : 'rgba(5,150,105,0.2)'}`
                        }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                📋 ユーザータイプ: <strong style={{ color: modalType === 'distributor' ? 'var(--primary)' : 'var(--success)' }}>
                                    {modalType === 'distributor' ? '販売店' : '病院・施設'}
                                </strong>
                            </p>
                        </div>

                        {modalType === 'facility' && (
                            <div style={{
                                marginBottom: 'var(--spacing-md)',
                                padding: '10px',
                                background: 'rgba(37,99,235,0.05)',
                                borderRadius: '6px',
                                border: '1px solid rgba(37,99,235,0.15)'
                            }}>
                                <p style={{ fontSize: '0.85rem' }}>
                                    📌 親販売店: <strong>{distributors.find(d => d.id === parentDistributorId)?.name}</strong>
                                </p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    施設CDは自動発行されます
                                </p>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">
                                {modalType === 'distributor' ? '販売店名' : '施設名'}
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={modalType === 'distributor' ? '例: 販売店ABC' : '例: サンプル病院'}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">メールアドレス</label>
                            <input
                                type="email"
                                className="form-input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="例: user@example.com"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">パスワード</label>
                            <input
                                type="password"
                                className="form-input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="8文字以上"
                            />
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
