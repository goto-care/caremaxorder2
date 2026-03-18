'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }) {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(true);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        const demoUser = localStorage.getItem('demoUser');
        if (demoUser) {
            const parsed = JSON.parse(demoUser);
            if (parsed.role !== 'admin') {
                router.push('/');
            } else {
                setUser(parsed);
            }
        } else {
            router.push('/');
        }
    }, [router]);
    /* eslint-enable react-hooks/set-state-in-effect */

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
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">管理者画面</div>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Admin Dashboard</p>
                </div>

                <nav className="sidebar-nav">
                    <Link href="/admin" className="nav-item">
                        📊 ダッシュボード
                    </Link>
                    <Link href="/admin/maker-rules" className="nav-item">
                        ⚙️ メーカー管理
                    </Link>
                    <Link href="/admin/orders" className="nav-item">
                        📋 発注一覧
                    </Link>
                    <Link href="/admin/users" className="nav-item">
                        👥 ユーザー管理
                    </Link>
                    <Link href="/admin/admins" className="nav-item">
                        👑 管理者管理
                    </Link>
                    <Link href="/admin/announcements" className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📢 お知らせ管理
                        {hasUnreadAnnouncements && <span className="badge-new">New</span>}
                    </Link>
                    <Link href="/admin/logs" className="nav-item">
                        📝 操作ログ
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
