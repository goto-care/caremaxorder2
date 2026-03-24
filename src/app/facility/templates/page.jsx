'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    deleteFacilityOrderTemplate,
    loadFacilityOrderTemplates,
    ORDER_TEMPLATES_UPDATED_EVENT,
    readStoredFacilityOrderTemplates,
} from '@/lib/facilityOrderTemplates';

export default function FacilityTemplatesPage() {
    const [templates, setTemplates] = useState(() => readStoredFacilityOrderTemplates());

    useEffect(() => {
        let isActive = true;

        const syncTemplates = async () => {
            const nextTemplates = await loadFacilityOrderTemplates();
            if (isActive) {
                setTemplates(nextTemplates);
            }
        };

        syncTemplates();
        window.addEventListener(ORDER_TEMPLATES_UPDATED_EVENT, syncTemplates);
        window.addEventListener('focus', syncTemplates);

        return () => {
            isActive = false;
            window.removeEventListener(ORDER_TEMPLATES_UPDATED_EVENT, syncTemplates);
            window.removeEventListener('focus', syncTemplates);
        };
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('このいつもの注文を削除してもよろしいですか？')) return;

        const result = await deleteFacilityOrderTemplate(id);
        if (result.error) {
            alert('テンプレートの削除に失敗しました。Firebase の接続を確認してください。');
            return;
        }

        setTemplates(current => current.filter(template => template.id !== id));
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
                                                <Link href={`/facility/order/confirm?template=${template.id}`} className="btn btn-sm btn-primary">
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
