'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    if (loading) return <div className="p-8 text-center">読み込み中...</div>;
    if (!user) return null;

    return (
        <div className="p-8">
            <header className="flex justify-between items-center mb-8 pb-4 border-b">
                <h1 className="text-2xl font-bold">ダッシュボード</h1>
                <div className="flex items-center gap-4">
                    <span>{user.email}</span>
                    <button
                        onClick={handleSignOut}
                        className="btn btn-secondary py-1 px-4"
                    >
                        ログアウト
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-2">ログイン情報</h2>
                    <p className="text-muted">UID: {user.uid}</p>
                    <p className="text-muted">Email: {user.email}</p>
                </div>

                <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-2">クイックリンク</h2>
                    <ul className="flex flex-col gap-2">
                        <li><a href="/facility" className="text-primary hover:underline">🏥 施設ページ</a></li>
                        <li><a href="/distributor" className="text-primary hover:underline">🏢 販売店ページ</a></li>
                        <li><a href="/admin" className="text-primary hover:underline">👑 管理者ページ</a></li>
                    </ul>
                </div>

                <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-2">お知らせ</h2>
                    <p className="text-muted">Firebase Authenticationが正常に実装されました。</p>
                </div>
            </main>
        </div>
    );
}
