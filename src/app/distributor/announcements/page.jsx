'use client';
import { useState } from 'react';

export default function DistributorAnnouncements() {
    const [announcements, setAnnouncements] = useState([
        {
            id: '1',
            title: '年末年始の休業について',
            content: '12月29日〜1月3日まで休業いたします。',
            attachmentName: '休暇スケジュール.pdf',
            publishedAt: '2024/01/10',
            isRead: false
        },
        {
            id: '2',
            title: 'システムメンテナンスのお知らせ',
            content: '1月20日 深夜2:00〜4:00にメンテナンスを実施します。',
            attachmentName: null,
            publishedAt: '2024/01/05',
            isRead: true
        }
    ]);

    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

    const viewAnnouncement = (announcement) => {
        setSelectedAnnouncement(announcement);
        if (!announcement.isRead) {
            setAnnouncements(announcements.map(a =>
                a.id === announcement.id ? { ...a, isRead: true } : a
            ));
        }
    };

    const unreadCount = announcements.filter(a => !a.isRead).length;

    return (
        <div>
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h1>📢 お知らせ</h1>
                <p className="text-muted">
                    {unreadCount > 0 ? `未読: ${unreadCount}件` : 'すべて確認済み'}
                </p>
            </div>

            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                {announcements.map(a => (
                    <div
                        key={a.id}
                        className="card"
                        onClick={() => viewAnnouncement(a)}
                        style={{
                            cursor: 'pointer',
                            borderLeft: a.isRead ? 'none' : '4px solid var(--warning)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                {!a.isRead && <span className="badge badge-warning" style={{ marginRight: 'var(--spacing-sm)' }}>未読</span>}
                                <strong>{a.title}</strong>
                            </div>
                            <span className="text-muted">{a.publishedAt}</span>
                        </div>
                    </div>
                ))}
            </div>

            {selectedAnnouncement && (
                <div className="modal-overlay" onClick={() => setSelectedAnnouncement(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{selectedAnnouncement.title}</h2>
                            <button className="modal-close" onClick={() => setSelectedAnnouncement(null)}>×</button>
                        </div>
                        <p>{selectedAnnouncement.content}</p>
                        {selectedAnnouncement.attachmentName && (
                            <button className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
                                📎 {selectedAnnouncement.attachmentName}
                            </button>
                        )}
                        <div className="modal-footer">
                            <button onClick={() => setSelectedAnnouncement(null)} className="btn btn-secondary">閉じる</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
