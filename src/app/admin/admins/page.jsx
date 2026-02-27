'use client';
import { useState, useEffect } from 'react';

export default function AdminManagement() {
    const [admins, setAdmins] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    useEffect(() => {
        // 初期管理者 + localStorage から読み込み
        const stored = JSON.parse(localStorage.getItem('adminAccounts') || '[]');
        const defaultAdmin = { id: 'default', name: '後藤', email: 'y.goto@g.caremax.co.jp', createdAt: '2024/01/01' };
        const all = [defaultAdmin, ...stored];
        setAdmins(all);
    }, []);

    const handleSave = () => {
        if (!formData.name || !formData.email || !formData.password) {
            alert('すべての項目を入力してください');
            return;
        }
        if (formData.password.length < 8) {
            alert('パスワードは8文字以上にしてください');
            return;
        }

        const newAdmin = {
            id: String(Date.now()),
            name: formData.name,
            email: formData.email,
            createdAt: new Date().toLocaleDateString('ja-JP')
        };

        const stored = JSON.parse(localStorage.getItem('adminAccounts') || '[]');
        stored.push({ ...newAdmin, password: formData.password });
        localStorage.setItem('adminAccounts', JSON.stringify(stored));

        setAdmins([...admins, newAdmin]);
        setFormData({ name: '', email: '', password: '' });
        setShowModal(false);
        alert('管理者アカウントが追加されました');
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1>管理者アカウント管理</h1>
                    <p className="text-muted">管理者アカウントの追加・管理を行います</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">➕ 管理者を追加</button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>名前</th>
                                <th>メールアドレス</th>
                                <th>ユーザータイプ</th>
                                <th>登録日</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map(admin => (
                                <tr key={admin.id}>
                                    <td><strong>{admin.name}</strong></td>
                                    <td>{admin.email}</td>
                                    <td><span className="badge badge-primary">管理者</span></td>
                                    <td>{admin.createdAt}</td>
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
                            <h2 className="modal-title">新規管理者追加</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div style={{
                            marginBottom: 'var(--spacing-md)',
                            padding: '10px',
                            background: 'rgba(37,99,235,0.08)',
                            borderRadius: '6px',
                            border: '1px solid rgba(37,99,235,0.2)'
                        }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                👑 ユーザータイプ: <strong style={{ color: 'var(--primary)' }}>管理者</strong>
                            </p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">名前</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="例: 山田太郎"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">メールアドレス</label>
                            <input
                                type="email"
                                className="form-input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="例: admin@example.com"
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
