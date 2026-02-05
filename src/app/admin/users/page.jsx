'use client';
import { useState } from 'react';

export default function AdminUsers() {
    const [users, setUsers] = useState([
        { id: '1', name: '販売店X', email: 'x@example.com', role: 'distributor', facilities: 5, status: 'active' },
        { id: '2', name: '販売店Y', email: 'y@example.com', role: 'distributor', facilities: 3, status: 'active' },
        { id: '3', name: 'サンプル病院A', email: 'a@example.com', role: 'facility', facilities: null, status: 'active' },
    ]);

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', role: 'distributor', password: '' });

    const handleSave = () => {
        setUsers([...users, { ...formData, id: String(Date.now()), facilities: formData.role === 'distributor' ? 0 : null, status: 'active' }]);
        setShowModal(false);
        setFormData({ name: '', email: '', role: 'distributor', password: '' });
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
                <h1>ユーザー管理</h1>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">➕ 新規登録</button>
            </div>
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>名前</th>
                                <th>メール</th>
                                <th>ロール</th>
                                <th>ステータス</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td><strong>{u.name}</strong></td>
                                    <td>{u.email}</td>
                                    <td><span className="badge badge-primary">{u.role === 'distributor' ? '販売店' : '施設'}</span></td>
                                    <td><span className="badge badge-success">アクティブ</span></td>
                                    <td><button className="btn btn-sm btn-secondary">編集</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">新規ユーザー登録</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="form-group">
                            <label className="form-label">名前</label>
                            <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">メール</label>
                            <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">ロール</label>
                            <select className="form-input" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                <option value="distributor">販売店</option>
                                <option value="facility">施設</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">パスワード</label>
                            <input type="password" className="form-input" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
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
