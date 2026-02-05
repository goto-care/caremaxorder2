'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function FavoriteOrders() {
    const router = useRouter();
    const [templates, setTemplates] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    useEffect(() => {
        // ローカルストレージからテンプレートを読み込み
        const saved = localStorage.getItem('orderTemplates');
        if (saved) {
            setTemplates(JSON.parse(saved));
        } else {
            // デモ用サンプルデータ
            const demoTemplates = [
                {
                    id: '1',
                    name: '定期発注A',
                    items: [
                        { janCode: '4901234567890', productName: 'サンプル商品A', specification: '100ml×10本', quantity: 5 },
                        { janCode: '4901234567891', productName: 'サンプル商品B', specification: '50g×20個', quantity: 3 },
                    ],
                    deliveryAddresses: ['東京都千代田区1-1-1'],
                    savedAt: '2024-01-10T10:00:00Z'
                },
                {
                    id: '2',
                    name: '月末発注',
                    items: [
                        { janCode: '4901234567892', productName: 'サンプル商品C', specification: '200ml×5本', quantity: 10 },
                        { janCode: '4901234567893', productName: 'サンプル商品D', specification: '150g×12個', quantity: 8 },
                        { janCode: '4901234567894', productName: 'サンプル商品E', specification: '250ml×8本', quantity: 6 },
                    ],
                    deliveryAddresses: ['大阪府大阪市北区2-2-2', '兵庫県神戸市中央区3-3-3'],
                    savedAt: '2024-01-05T14:30:00Z'
                }
            ];
            setTemplates(demoTemplates);
        }
    }, []);

    // テンプレートから発注書を作成
    const createOrderFromTemplate = (template) => {
        // テンプレート内容をセッションストレージに保存して発注画面に遷移
        sessionStorage.setItem('templateOrder', JSON.stringify(template));
        router.push('/facility/order?fromTemplate=true');
    };

    // 1クリック発注（確認モーダル表示）
    const handleQuickOrder = (template) => {
        setSelectedTemplate(template);
        setShowModal(true);
    };

    // 発注実行
    const confirmQuickOrder = async () => {
        setShowModal(false);

        // モックAPI呼び出し
        await new Promise(resolve => setTimeout(resolve, 1000));

        alert(`「${selectedTemplate.name}」の発注が完了しました！`);
        setSelectedTemplate(null);
    };

    // テンプレート削除
    const deleteTemplate = (id) => {
        if (confirm('このテンプレートを削除してもよろしいですか？')) {
            const updated = templates.filter(t => t.id !== id);
            setTemplates(updated);
            localStorage.setItem('orderTemplates', JSON.stringify(updated));
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1>⭐ いつもの注文</h1>
                    <p className="text-muted">登録済みのテンプレートから1クリックで発注できます</p>
                </div>
            </div>

            {templates.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                    <p className="text-muted" style={{ marginBottom: 'var(--spacing-lg)' }}>
                        まだテンプレートが登録されていません
                    </p>
                    <button onClick={() => router.push('/facility/order')} className="btn btn-primary">
                        発注書を作成してテンプレートを保存
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
                    {templates.map(template => (
                        <div key={template.id} className="card">
                            <div className="card-header">
                                <div>
                                    <h3 className="card-title">{template.name}</h3>
                                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                                        {template.items.length}品目 | 最終更新: {new Date(template.savedAt).toLocaleDateString('ja-JP')}
                                    </p>
                                </div>
                                <div className="flex gap-sm">
                                    <button
                                        onClick={() => handleQuickOrder(template)}
                                        className="btn btn-success"
                                    >
                                        🚀 1クリック発注
                                    </button>
                                    <button
                                        onClick={() => createOrderFromTemplate(template)}
                                        className="btn btn-secondary"
                                    >
                                        ✏️ 編集して発注
                                    </button>
                                    <button
                                        onClick={() => deleteTemplate(template.id)}
                                        className="btn btn-danger"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>JANコード</th>
                                            <th>商品名</th>
                                            <th>規格</th>
                                            <th>数量</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {template.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.janCode}</td>
                                                <td>{item.productName}</td>
                                                <td>{item.specification}</td>
                                                <td><strong>{item.quantity}ケース</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {template.deliveryAddresses && template.deliveryAddresses.length > 0 && (
                                <div style={{ marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--border-color)' }}>
                                    <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-xs)' }}>お届け先:</p>
                                    {template.deliveryAddresses.map((addr, i) => (
                                        <p key={i} style={{ fontSize: '0.875rem' }}>{i + 1}. {addr}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 確認モーダル */}
            {showModal && selectedTemplate && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">発注確認</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <p>「<strong>{selectedTemplate.name}</strong>」の内容で発注しますか？</p>

                        <div style={{
                            background: 'var(--bg-tertiary)',
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius-md)',
                            margin: 'var(--spacing-md) 0'
                        }}>
                            <p><strong>品目数:</strong> {selectedTemplate.items.length}品目</p>
                            <p><strong>総数量:</strong> {selectedTemplate.items.reduce((sum, i) => sum + i.quantity, 0)}ケース</p>
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">キャンセル</button>
                            <button onClick={confirmQuickOrder} className="btn btn-success">発注する</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
