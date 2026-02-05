'use client';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalProducts: 125,
        totalOrders: 48,
        pendingOrders: 12,
        totalUsers: 35
    });

    return (
        <div>
            <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>ダッシュボード</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-xl)'
            }}>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <div style={{
                            width: '50px', height: '50px',
                            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem'
                        }}>📦</div>
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.875rem' }}>登録商品数</p>
                            <p style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.totalProducts}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <div style={{
                            width: '50px', height: '50px',
                            background: 'linear-gradient(135deg, var(--success), #059669)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem'
                        }}>📋</div>
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.875rem' }}>総発注数</p>
                            <p style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.totalOrders}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <div style={{
                            width: '50px', height: '50px',
                            background: 'linear-gradient(135deg, var(--warning), #d97706)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem'
                        }}>⏳</div>
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.875rem' }}>未処理発注</p>
                            <p style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.pendingOrders}</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <div style={{
                            width: '50px', height: '50px',
                            background: 'linear-gradient(135deg, var(--info), #0891b2)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem'
                        }}>👥</div>
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.875rem' }}>ユーザー数</p>
                            <p style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.totalUsers}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">最近の発注</h2>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>発注番号</th>
                                <th>施設名</th>
                                <th>販売店</th>
                                <th>発注日</th>
                                <th>ステータス</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>ORD-2024-001</td>
                                <td>サンプル病院A</td>
                                <td>販売店X</td>
                                <td>2024/01/15</td>
                                <td><span className="badge badge-success">完了</span></td>
                            </tr>
                            <tr>
                                <td>ORD-2024-002</td>
                                <td>介護施設B</td>
                                <td>販売店Y</td>
                                <td>2024/01/15</td>
                                <td><span className="badge badge-warning">処理中</span></td>
                            </tr>
                            <tr>
                                <td>ORD-2024-003</td>
                                <td>クリニックC</td>
                                <td>販売店X</td>
                                <td>2024/01/14</td>
                                <td><span className="badge badge-primary">受付済</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
