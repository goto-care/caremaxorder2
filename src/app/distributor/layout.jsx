'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DistributorLayout({ children }) {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [hasUnread, setHasUnread] = useState(true);

    useEffect(() => {
        const demoUser = localStorage.getItem('demoUser');
        if (demoUser) {
            const parsed = JSON.parse(demoUser);
            if (parsed.role !== 'distributor') {
                router.push('/');
            } else {
                setUser(parsed);
            }
        } else {
            router.push('/');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('demoUser');
        router.push('/');
    };

    if (!user) {
        return (
            <div className="loading-container" style={{ minHeight: '100vh' }}>
                <div className="loading-spinner"></div>
                <p>読み込み中...</p>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">販売店画面</div>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Distributor Portal</p>
                </div>

                <nav className="sidebar-nav">
                    <Link href="/distributor" className="nav-item">
                        📊 ダッシュボード
                    </Link>
                    <Link href="/distributor/orders" className="nav-item">
                        📋 発注確認
                    </Link>
                    <Link href="/distributor/facilities" className="nav-item">
                        🏥 施設管理
                    </Link>
                    <Link href="/distributor/order" className="nav-item">
                        📝 発注書作成
                    </Link>
                    <Link href="/distributor/announcements" className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📢 お知らせ
                        {hasUnread && <span className="badge-new">New</span>}
                    </Link>
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>ログイン中</p>
                        <p style={{ fontWeight: '600', color: '#fff' }}>{user.name}</p>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary w-full" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
                        ログアウト
                    </button>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
