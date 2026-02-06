'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FacilityTemplatesPage() {
    const [templates, setTemplates] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('formLayouts');
        if (saved) {
            setTemplates(JSON.parse(saved));
        }
    }, []);

    const handleDelete = (id) => {
        if (confirm('このテンプレートを削除してもよろしいですか？')) {
            const updated = templates.filter(t => t.id !== id);
            setTemplates(updated);
            localStorage.setItem('formLayouts', JSON.stringify(updated));
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h1>発注書テンプレート</h1>
                <Link href="/facility/templates/builder" className="btn btn-primary">
                    ➕ 新規作成
                </Link>
            </div>

            <div className="card">
                {templates.length === 0 ? (
                    <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
                        テンプレートがありません。「新規作成」ボタンから作成してください。
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>テンプレート名</th>
                                    <th>タイプ</th>
                                    <th>最終更新</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map(template => (
                                    <tr key={template.id}>
                                        <td>{template.name || '(未設定)'}</td>
                                        <td>
                                            <span className="badge badge-primary">
                                                {template.canvasType === 'a4' ? 'A4自由配置' : 'リスト形式'}
                                            </span>
                                        </td>
                                        <td>{template.updatedAt ? new Date(template.updatedAt).toLocaleString('ja-JP') : '-'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <Link href={`/facility/templates/builder?id=${template.id}`} className="btn btn-sm btn-secondary">
                                                    編集
                                                </Link>
                                                <button onClick={() => handleDelete(template.id)} className="btn btn-sm btn-danger">
                                                    削除
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
