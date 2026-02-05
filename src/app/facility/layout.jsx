'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FacilityLayout({ children }) {
    const router = useRouter();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const demoUser = localStorage.getItem('demoUser');
        if (demoUser) {
            const parsed = JSON.parse(demoUser);
            if (parsed.role !== 'facility') {
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
                    <div className="sidebar-logo">施設画面</div>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>Facility Portal</p>
                </div>

                <nav className="sidebar-nav">
                    <Link href="/facility" className="nav-item">
                        📊 ダッシュボード
                    </Link>
                    <Link href="/facility/order" className="nav-item">
                        📝 発注書作成
                    </Link>
                    <Link href="/facility/templates" className="nav-item">
                        ⭐ いつもの注文
                    </Link>
                    <Link href="/facility/history" className="nav-item">
                        📋 発注履歴
                    </Link>
                    <Link href="/facility/settings" className="nav-item">
                        ⚙️ 発注書設定
                    </Link>
                    <Link href="/facility/announcements" className="nav-item">
                        📢 お知らせ
                    </Link>
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ログイン中</p>
                        <p style={{ fontWeight: '600' }}>{user.name}</p>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary w-full">
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
