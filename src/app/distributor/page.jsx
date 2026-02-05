'use client';

export default function DistributorDashboard() {
    const facilities = [
        { name: 'サンプル病院A', orders: 12, lastOrder: '2024/01/15' },
        { name: '介護施設B', orders: 8, lastOrder: '2024/01/14' },
        { name: 'クリニックC', orders: 5, lastOrder: '2024/01/13' },
    ];

    return (
        <div>
            <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>販売店ダッシュボード</h1>

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
                        }}>🏥</div>
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.875rem' }}>登録施設数</p>
                            <p style={{ fontSize: '2rem', fontWeight: '700' }}>15</p>
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
                        }}>📋</div>
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.875rem' }}>今月の発注</p>
                            <p style={{ fontSize: '2rem', fontWeight: '700' }}>25</p>
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
                        }}>✅</div>
                        <div>
                            <p className="text-muted" style={{ fontSize: '0.875rem' }}>処理済み</p>
                            <p style={{ fontSize: '2rem', fontWeight: '700' }}>20</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">登録施設一覧</h2>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>施設名</th>
                                <th>総発注数</th>
                                <th>最終発注日</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facilities.map((facility, index) => (
                                <tr key={index}>
                                    <td>{facility.name}</td>
                                    <td>{facility.orders}件</td>
                                    <td>{facility.lastOrder}</td>
                                    <td>
                                        <button className="btn btn-sm btn-secondary">詳細</button>
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
