'use client';
import { useState } from 'react';

export default function AdminAnnouncements() {
    const [announcements, setAnnouncements] = useState([
        {
            id: '1',
            title: '年末年始の休業について',
            content: '12月29日〜1月3日まで休業いたします。',
            target: 'all',
            attachmentName: '休暇スケジュール.pdf',
            publishedAt: '2024/01/10',
            isPublished: true
        },
        {
            id: '2',
            title: '新商品のお知らせ',
            content: '2月より新商品の取り扱いを開始します。詳細は添付PDFをご確認ください。',
            target: 'facility',
            attachmentName: '新商品カタログ.pdf',
            publishedAt: '2024/01/08',
            isPublished: true
        },
        {
            id: '3',
            title: 'システムメンテナンスのお知らせ',
            content: '1月20日 深夜2:00〜4:00にメンテナンスを実施します。',
            target: 'all',
            attachmentName: null,
            publishedAt: null,
            isPublished: false
        }
    ]);

    const [showModal, setShowModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        target: 'all',
        attachmentName: null
    });

    const targetLabels = {
        all: '全員',
        distributor: '販売店のみ',
        facility: '施設のみ'
    };

    const openModal = (announcement = null) => {
        if (announcement) {
            setEditingAnnouncement(announcement);
            setFormData({
                title: announcement.title,
                content: announcement.content,
                target: announcement.target,
                attachmentName: announcement.attachmentName
            });
        } else {
            setEditingAnnouncement(null);
            setFormData({
                title: '',
                content: '',
                target: 'all',
                attachmentName: null
            });
        }
        setShowModal(true);
    };

    const handleSave = () => {
        if (editingAnnouncement) {
            setAnnouncements(announcements.map(a =>
                a.id === editingAnnouncement.id
                    ? { ...a, ...formData }
                    : a
            ));
        } else {
            setAnnouncements([
                {
                    id: String(Date.now()),
                    ...formData,
                    publishedAt: null,
                    isPublished: false
                },
                ...announcements
            ]);
        }
        setShowModal(false);
    };

    const handlePublish = (id) => {
        setAnnouncements(announcements.map(a =>
            a.id === id
                ? { ...a, isPublished: true, publishedAt: new Date().toLocaleDateString('ja-JP') }
                : a
        ));
    };

    const handleUnpublish = (id) => {
        setAnnouncements(announcements.map(a =>
            a.id === id
                ? { ...a, isPublished: false }
                : a
        ));
    };

    const handleDelete = (id) => {
        if (confirm('このお知らせを削除してもよろしいですか？')) {
            setAnnouncements(announcements.filter(a => a.id !== id));
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, attachmentName: file.name });
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1>お知らせ管理</h1>
                    <p className="text-muted">休暇スケジュールや重要なお知らせを配信できます</p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary">
                    ➕ 新規作成
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>タイトル</th>
                                <th>対象</th>
                                <th>添付</th>
                                <th>公開日</th>
                                <th>ステータス</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {announcements.map(announcement => (
                                <tr key={announcement.id}>
                                    <td><strong>{announcement.title}</strong></td>
                                    <td>
                                        <span className="badge badge-primary">{targetLabels[announcement.target]}</span>
                                    </td>
                                    <td>
                                        {announcement.attachmentName ? (
                                            <span style={{ fontSize: '0.875rem' }}>📎 {announcement.attachmentName}</span>
                                        ) : '-'}
                                    </td>
                                    <td>{announcement.publishedAt || '-'}</td>
                                    <td>
                                        {announcement.isPublished ? (
                                            <span className="badge badge-success">公開中</span>
                                        ) : (
                                            <span className="badge badge-warning">下書き</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="flex gap-sm">
                                            <button onClick={() => openModal(announcement)} className="btn btn-sm btn-secondary">
                                                編集
                                            </button>
                                            {announcement.isPublished ? (
                                                <button onClick={() => handleUnpublish(announcement.id)} className="btn btn-sm btn-warning">
                                                    非公開
                                                </button>
                                            ) : (
                                                <button onClick={() => handlePublish(announcement.id)} className="btn btn-sm btn-success">
                                                    公開
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(announcement.id)} className="btn btn-sm btn-danger">
                                                削除
                                            </button>
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
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingAnnouncement ? 'お知らせ編集' : '新規お知らせ作成'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">タイトル</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="お知らせのタイトル"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">内容</label>
                            <textarea
                                className="form-input"
                                rows="5"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="お知らせの内容を入力..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">配信対象</label>
                            <select
                                className="form-input"
                                value={formData.target}
                                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                            >
                                <option value="all">全員</option>
                                <option value="distributor">販売店のみ</option>
                                <option value="facility">施設のみ</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">ファイル添付（PDF）</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                                    📎 ファイルを選択
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileUpload}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                                {formData.attachmentName && (
                                    <span style={{ fontSize: '0.875rem' }}>{formData.attachmentName}</span>
                                )}
                            </div>
                            <small className="text-muted">休暇スケジュールなどのPDFをアップロードできます</small>
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
