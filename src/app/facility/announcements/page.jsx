'use client';
import { useState } from 'react';

export default function FacilityAnnouncements() {
    const [announcements, setAnnouncements] = useState([
        {
            id: '1',
            title: '年末年始の休業について',
            content: '12月29日〜1月3日まで休業いたします。この期間に発注いただいた分は、1月4日以降に順次処理いたします。',
            target: 'all',
            attachmentName: '休暇スケジュール.pdf',
            publishedAt: '2024/01/10',
            isRead: true
        },
        {
            id: '2',
            title: '新商品のお知らせ',
            content: '2月より新商品の取り扱いを開始します。詳細は添付PDFをご確認ください。発注書に商品が追加されております。',
            target: 'facility',
            attachmentName: '新商品カタログ.pdf',
            publishedAt: '2024/01/08',
            isRead: false
        },
        {
            id: '3',
            title: 'システムメンテナンスのお知らせ',
            content: '1月20日 深夜2:00〜4:00にシステムメンテナンスを実施します。この時間帯は発注システムをご利用いただけません。',
            target: 'all',
            attachmentName: null,
            publishedAt: '2024/01/05',
            isRead: true
        }
    ]);

    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

    const markAsRead = (id) => {
        setAnnouncements(announcements.map(a =>
            a.id === id ? { ...a, isRead: true } : a
        ));
    };

    const viewAnnouncement = (announcement) => {
        setSelectedAnnouncement(announcement);
        if (!announcement.isRead) {
            markAsRead(announcement.id);
        }
    };

    const unreadCount = announcements.filter(a => !a.isRead).length;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1>📢 お知らせ</h1>
                    <p className="text-muted">
                        {unreadCount > 0 ? (
                            <span style={{ color: 'var(--warning)' }}>未読のお知らせが{unreadCount}件あります</span>
                        ) : (
                            'すべてのお知らせを確認済みです'
                        )}
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                {announcements.map(announcement => (
                    <div
                        key={announcement.id}
                        className="card"
                        onClick={() => viewAnnouncement(announcement)}
                        style={{
                            cursor: 'pointer',
                            borderLeft: announcement.isRead ? 'none' : '4px solid var(--warning)',
                            transition: 'transform 0.2s ease'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                    {!announcement.isRead && (
                                        <span className="badge badge-warning">未読</span>
                                    )}
                                    <h3 style={{ margin: 0 }}>{announcement.title}</h3>
                                </div>
                                <p className="text-muted" style={{
                                    fontSize: '0.875rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '600px'
                                }}>
                                    {announcement.content}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 'var(--spacing-lg)' }}>
                                <p className="text-muted" style={{ fontSize: '0.875rem' }}>{announcement.publishedAt}</p>
                                {announcement.attachmentName && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>📎 添付あり</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 詳細モーダル */}
            {selectedAnnouncement && (
                <div className="modal-overlay" onClick={() => setSelectedAnnouncement(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{selectedAnnouncement.title}</h2>
                            <button className="modal-close" onClick={() => setSelectedAnnouncement(null)}>×</button>
                        </div>

                        <p className="text-muted" style={{ marginBottom: 'var(--spacing-md)' }}>
                            {selectedAnnouncement.publishedAt}
                        </p>

                        <div style={{
                            background: 'var(--bg-tertiary)',
                            padding: 'var(--spacing-lg)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-lg)',
                            lineHeight: '1.8'
                        }}>
                            {selectedAnnouncement.content}
                        </div>

                        {selectedAnnouncement.attachmentName && (
                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <p style={{ marginBottom: 'var(--spacing-sm)' }}><strong>添付ファイル:</strong></p>
                                <button className="btn btn-primary">
                                    📎 {selectedAnnouncement.attachmentName} をダウンロード
                                </button>
                            </div>
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
