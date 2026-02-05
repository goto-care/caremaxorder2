'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [demoMode, setDemoMode] = useState(false);
    const router = useRouter();
    const { signIn } = useAuth();

    // デモモード用のログイン処理
    const handleDemoLogin = (role) => {
        setDemoMode(true);
        // デモ用にローカルストレージにロール情報を保存
        localStorage.setItem('demoUser', JSON.stringify({
            uid: `demo-${role}`,
            email: `${role}@demo.com`,
            role: role,
            name: role === 'admin' ? '管理者' : role === 'distributor' ? 'サンプル販売店' : 'サンプル病院'
        }));

        if (role === 'admin') {
            router.push('/admin');
        } else if (role === 'distributor') {
            router.push('/distributor');
        } else {
            router.push('/facility');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn(email, password);
            if (result.success) {
                // ユーザーのロールに応じてリダイレクト
                // 実際の実装では userData からロールを取得
                router.push('/facility');
            } else {
                setError(result.error || 'ログインに失敗しました');
            }
        } catch (err) {
            setError('ログイン中にエラーが発生しました');
        }

        setLoading(false);
    };

    return (
        <div className="login-container">
            <div className="login-card card">
                <div className="login-logo">
                    <h1>消耗品発注システム</h1>
                    <p>Consumables Order System</p>
                </div>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">メールアドレス</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@email.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">パスワード</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={loading}
                    >
                        {loading ? 'ログイン中...' : 'ログイン'}
                    </button>
                </form>

                <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border-color)' }}>
                    <p className="text-center text-muted mb-md">デモモードでログイン</p>
                    <div className="flex flex-col gap-sm">
                        <button
                            onClick={() => handleDemoLogin('admin')}
                            className="btn btn-secondary w-full"
                        >
                            👑 管理者としてログイン
                        </button>
                        <button
                            onClick={() => handleDemoLogin('distributor')}
                            className="btn btn-secondary w-full"
                        >
                            🏢 販売店としてログイン
                        </button>
                        <button
                            onClick={() => handleDemoLogin('facility')}
                            className="btn btn-secondary w-full"
                        >
                            🏥 病院・施設としてログイン
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
