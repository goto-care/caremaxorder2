'use client';
import { useState } from 'react';
import Link from 'next/link';

const getRecentOrderTemplates = () => {
    if (typeof window === 'undefined') return [];

    try {
        return JSON.parse(localStorage.getItem('orderTemplates') || '[]')
            .sort((a, b) => {
                const left = a?.savedAt ? new Date(a.savedAt).getTime() : 0;
                const right = b?.savedAt ? new Date(b.savedAt).getTime() : 0;
                return right - left;
            })
            .slice(0, 3);
    } catch {
        return [];
    }
};

export default function FacilityDashboard() {
    const recentOrders = [
        { id: 'ORD-001', date: '2024/01/15', items: 5, status: '送信済' },
        { id: 'ORD-002', date: '2024/01/10', items: 3, status: '送信済' },
        { id: 'ORD-003', date: '2024/01/05', items: 8, status: '送信済' },
    ];

    const [templates] = useState(() => getRecentOrderTemplates());

    return (
        <div>
            <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>施設ダッシュボード</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-xl)'
            }}>
                {/* 新規発注カード */}
                <div className="card" style={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    border: 'none'
                }}>
                    <h3 style={{ marginBottom: 'var(--spacing-md)' }}>新規発注を作成</h3>
                    <p style={{ marginBottom: 'var(--spacing-lg)', opacity: 0.9 }}>
                        発注書形式のUIで簡単に発注できます
                    </p>
                    <Link href="/facility/order" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary)' }}>
                        📝 発注書を作成
                    </Link>
                </div>

                {/* いつもの注文カード */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-md)' }}>⭐ いつもの注文</h3>
                    <p className="text-muted" style={{ marginBottom: 'var(--spacing-md)' }}>
                        登録済みのテンプレートから1クリックで発注
                    </p>
                    {templates.length === 0 ? (
                        <p className="text-muted" style={{ padding: 'var(--spacing-sm) 0' }}>いつもの注文はありません</p>
                    ) : (
                        templates.map((template, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: 'var(--spacing-sm) 0',
                                borderBottom: index < templates.length - 1 ? '1px solid var(--border-color)' : 'none'
                            }}>
                                <span>{template.name} ({template.items?.length || 0}品目)</span>
                                <Link href={`/facility/order?template=${template.id}`} className="btn btn-sm btn-primary">発注</Link>
                            </div>
                        ))
                    )}
                    <Link href="/facility/templates" className="btn btn-secondary w-full" style={{ marginTop: 'var(--spacing-md)' }}>
                        すべて表示
                    </Link>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">最近の発注履歴</h2>
                    <Link href="/facility/history" className="btn btn-secondary btn-sm">
                        すべて表示
                    </Link>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>発注番号</th>
                                <th>発注日</th>
                                <th>品目数</th>
                                <th>ステータス</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map((order, index) => (
                                <tr key={index}>
                                    <td>{order.id}</td>
                                    <td>{order.date}</td>
                                    <td>{order.items}品目</td>
                                    <td><span className="badge badge-success">{order.status}</span></td>
                                    <td>
                                        <button className="btn btn-sm btn-secondary">PDF</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
