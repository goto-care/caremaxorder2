'use client';
import { useState } from 'react';
import Link from 'next/link';

const getStoredOrderTemplates = () => {
    if (typeof window === 'undefined') return [];

    try {
        return JSON.parse(localStorage.getItem('orderTemplates') || '[]');
    } catch {
        return [];
    }
};

const sortTemplatesBySavedAt = (templates) => [...templates].sort((a, b) => {
    const left = a?.savedAt ? new Date(a.savedAt).getTime() : 0;
    const right = b?.savedAt ? new Date(b.savedAt).getTime() : 0;
    return right - left;
});

export default function FacilityTemplatesPage() {
    const [templates, setTemplates] = useState(() => sortTemplatesBySavedAt(getStoredOrderTemplates()));

    const handleDelete = (id) => {
        if (!confirm('このいつもの注文を削除してもよろしいですか？')) return;

        const updated = templates.filter(template => template.id !== id);
        setTemplates(updated);
        localStorage.setItem('orderTemplates', JSON.stringify(updated));
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-lg)', gap: 'var(--spacing-md)' }}>
                <div>
                    <h1>いつもの注文</h1>
                    <p className="text-muted" style={{ marginTop: '8px' }}>
                        発注書作成ページで保存した内容を、ここから再利用できます。
                    </p>
                </div>
                <Link href="/facility/order" className="btn btn-primary">
                    📝 発注書作成へ
                </Link>
            </div>

            <div className="card">
                {templates.length === 0 ? (
                    <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
                        いつもの注文はありません。発注書作成ページから保存すると、ここに追加されます。
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>注文名</th>
                                    <th>発注フォーマット</th>
                                    <th>保存日時</th>
                                    <th>品目数</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map(template => (
                                    <tr key={template.id}>
                                        <td>{template.name || '(名称未設定)'}</td>
                                        <td>{template.formatName || '-'}</td>
                                        <td>{template.savedAt ? new Date(template.savedAt).toLocaleString('ja-JP') : '-'}</td>
                                        <td>{template.items?.length || 0}品目</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <Link href={`/facility/order?template=${template.id}`} className="btn btn-sm btn-primary">
                                                    発注する
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
