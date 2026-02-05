'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }) {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>Admin Dashboard</p>
                </div>

                <nav className="sidebar-nav">
                    <Link href="/admin" className="nav-item">
                        📊 ダッシュボード
                    </Link>
                    <Link href="/admin/products" className="nav-item">
                        📦 商品マスタ
                    </Link>
                    <Link href="/admin/maker-rules" className="nav-item">
                        ⚙️ メーカールール
                    </Link>
                    <Link href="/admin/orders" className="nav-item">
                        📋 発注一覧
                    </Link>
                    <Link href="/admin/users" className="nav-item">
                        👥 ユーザー管理
                    </Link>
                    <Link href="/admin/announcements" className="nav-item">
                        📢 お知らせ管理
                    </Link>
                    <Link href="/admin/logs" className="nav-item">
                        📝 操作ログ
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
