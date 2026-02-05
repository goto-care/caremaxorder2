'use client';
import { useState } from 'react';

export default function DistributorTemplates() {
    const [templates, setTemplates] = useState([
        { id: '1', name: '標準発注書', description: '基本的な発注書テンプレート', facilities: 10, isDefault: true },
        { id: '2', name: '簡易発注書', description: '必須項目のみのシンプルな形式', facilities: 5, isDefault: false },
    ]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1>発注書テンプレート</h1>
                    <p className="text-muted">配下施設に適用する発注書のテンプレートを管理します</p>
                </div>
                <button className="btn btn-primary">➕ 新規作成</button>
            </div>

            <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
                {templates.map(t => (
                    <div key={t.id} className="card">
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">{t.name}</h3>
                                <p className="text-muted">{t.description}</p>
                            </div>
                            <div className="flex gap-sm">
                                {t.isDefault && <span className="badge badge-success">デフォルト</span>}
                                <button className="btn btn-secondary btn-sm">編集</button>
                            </div>
                        </div>
                        <p>適用施設: {t.facilities}件</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
