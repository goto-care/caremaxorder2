'use client';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getProducts, saveProducts } from '@/utils/storageUtils';

// カスタムフック：クリック外判定 (SearchCell削除に伴い不要だが、他で使うかもしれないので一応残すか削除する。今回は削除)

// ---- テーブル設定のデフォルトフォールバック ----
const DEFAULT_COLUMNS = [
    { id: 'jan', label: 'JAN/商品コード', type: 'text', locked: true, visible: true, width: 140, editLocked: true },
    { id: 'name', label: '商品名', type: 'text', locked: true, visible: true, width: 200, editLocked: true },
    { id: 'spec', label: '規格', type: 'text', locked: false, visible: true, width: 100, editLocked: true },
    { id: 'quantity', label: '数量', type: 'number', locked: true, visible: true, width: 80, editLocked: false },
    { id: 'unitPrice', label: '単価', type: 'number', locked: false, visible: true, width: 100, editLocked: true },
    { id: 'subtotal', label: '小計', type: 'computed', locked: false, visible: true, width: 100, editLocked: true },
    { id: 'remarks', label: '備考', type: 'text', locked: false, visible: true, width: 150, editLocked: false },
];
const DEFAULT_TABLE_CONFIG = {
    columns: DEFAULT_COLUMNS,
    showTotal: true,
    initialRows: 5,
    maxRows: null,
};

const createEmptyOrderItem = () => ({
    id: uuidv4(),
    janCode: '',
    productName: '',
    specification: '',
    price: 0,
    quantity: 0,
    remarks: '',
    customColumns: {}
});

const buildOrderItemsFromTemplate = (items = []) => items.map(item => ({
    id: uuidv4(),
    janCode: item.janCode || '',
    productName: item.productName || '',
    specification: item.specification || '',
    price: item.price || 0,
    quantity: Number(item.quantity) || 0,
    remarks: item.remarks || '',
    customColumns: item.customColumns || {}
}));

const getStoredOrderTemplates = () => {
    if (typeof window === 'undefined') return [];

    try {
        return JSON.parse(localStorage.getItem('orderTemplates') || '[]');
    } catch {
        return [];
    }
};

const saveStoredOrderTemplates = (templates) => {
    if (typeof window === 'undefined') return;

    localStorage.setItem('orderTemplates', JSON.stringify(templates));
};

const initialProducts = [
    { id: '1', originalCode: 'ORG-00001', janCode: '4901234567890', webCode: '123456', productName: 'シリンジ 10ml', specification: '100本/箱', caseQuantity: 10, supplierId: 'S001', supplierName: '仕入先A', makerId: 'M001', makerName: 'メーカーA', salesStatus: '', price: 1500 },
    { id: '2', originalCode: 'ORG-00002', janCode: '4901234567891', webCode: '234567', productName: 'アルコール綿', specification: '200枚/パック', caseQuantity: 20, supplierId: 'S002', supplierName: '仕入先B', makerId: 'M002', makerName: 'メーカーB', salesStatus: '', price: 800 },
    { id: '3', originalCode: 'ORG-00003', janCode: '4901234567892', webCode: '345678', productName: 'サージカルマスク', specification: '50枚/箱', caseQuantity: 5, supplierId: 'S001', supplierName: '仕入先A', makerId: 'M001', makerName: 'メーカーA', salesStatus: '', price: 1200 },
];

export default function OrderPage() {
    const { user } = useAuth();
    const [productMaster, setProductMaster] = useState([]);

    // フォーマット情報
    const [savedFormats, setSavedFormats] = useState([]);
    const [selectedFormat, setSelectedFormat] = useState(null);

    // フォーム入力値 (カスタムフィールド用)
    const [formValues, setFormValues] = useState({});

    // 商品明細テーブル用データ
    const [orderItems, setOrderItems] = useState([
        createEmptyOrderItem()
    ]);

    // モーダル制御
    const [showProductModal, setShowProductModal] = useState(false);
    const [currentRowId, setCurrentRowId] = useState(null);
    const [searchJan, setSearchJan] = useState('');
    const [searchName, setSearchName] = useState('');
    const [searchMaker, setSearchMaker] = useState('');

    // Validation
    const [errors, setErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 2. フォーマット適用
    function applyFormat(format, templateData = null) {
        setSelectedFormat(format);
        const newFormValues = {};
        let initialItemCount = 1;

        format.fields.forEach(f => {
            if (f.type !== 'product-table') {
                newFormValues[f.id] = templateData?.customValues?.[f.id] || '';
            } else {
                const tConf = f.tableConfig || DEFAULT_TABLE_CONFIG;
                initialItemCount = Math.max(1, tConf.initialRows || 5);
            }
        });

        setFormValues(newFormValues);

        const initialItems = templateData?.items?.length
            ? buildOrderItemsFromTemplate(templateData.items)
            : Array.from({ length: initialItemCount }, () => createEmptyOrderItem());

        setOrderItems(initialItems);
        setErrors([]);
    }

    // 1. 初期データロード
    useEffect(() => {
        const savedProds = getProducts();
        if (savedProds && savedProds.length > 0) {
            const prodsWithPrice = savedProds.map(p => ({ ...p, price: p.price || Math.floor(Math.random() * 5000) + 100 }));
            setProductMaster(prodsWithPrice);
        } else {
            setProductMaster(initialProducts);
            saveProducts(initialProducts);
        }

        const formatsStr = localStorage.getItem('orderFormats');
        if (!formatsStr) return;

        const formats = JSON.parse(formatsStr);
        setSavedFormats(formats);

        if (formats.length === 0) return;

        const templateId = new URLSearchParams(window.location.search).get('template');
        const selectedTemplate = templateId
            ? getStoredOrderTemplates().find(template => template.id === templateId)
            : null;
        const initialFormat = selectedTemplate
            ? formats.find(format => format.id === selectedTemplate.formatId) || formats[0]
            : formats[0];

        applyFormat(initialFormat, selectedTemplate);
    }, []);

    const handleFormatChange = (e) => {
        const formatId = e.target.value;
        const format = savedFormats.find(f => f.id === formatId);
        if (format) applyFormat(format);
    };

    // カスタムフィールド変更
    const handleFieldChange = (fieldId, value) => {
        setFormValues(prev => ({ ...prev, [fieldId]: value }));
    };

    // ------------------------------------
    // テーブル操作系
    // ------------------------------------
    const addRow = () => {
        if (!selectedFormat) return;
        const tableField = selectedFormat.fields.find(f => f.type === 'product-table');
        const tConf = tableField?.tableConfig || DEFAULT_TABLE_CONFIG;

        if (tConf.maxRows && orderItems.length >= tConf.maxRows) {
            alert(`これ以上行を追加できません（最大 ${tConf.maxRows} 行まで）`);
            return;
        }

        setOrderItems([...orderItems, createEmptyOrderItem()]);
    };

    const removeRow = (id) => {
        if (orderItems.length > 1) {
            setOrderItems(orderItems.filter(item => item.id !== id));
        }
    };

    const updateRow = (id, field, value) => {
        setOrderItems(orderItems.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    // 商品選択モーダルを開く
    const openProductModal = (rowId) => {
        setCurrentRowId(rowId);
        setSearchJan('');
        setSearchName('');
        setSearchMaker('');
        setShowProductModal(true);
    };

    const selectProduct = (product) => {
        if (product.salesStatus === '廃盤') {
            alert('この商品は廃盤のため発注できません。');
            return;
        }
        setOrderItems(orderItems.map(item => item.id === currentRowId ? {
            ...item,
            janCode: product.janCode,
            productName: product.productName,
            specification: product.specification,
            price: product.price || 0
        } : item));
        setShowProductModal(false);
    };

    // 検索フィルタ（廃盤商品は除外）
    const filteredProducts = productMaster.filter(p => {
        if (p.salesStatus === '廃盤') return false;

        const matchJan = searchJan === '' || (p.janCode && p.janCode.includes(searchJan));
        const matchName = searchName === '' || (p.productName && p.productName.toLowerCase().includes(searchName.toLowerCase()));
        const matchMaker = searchMaker === '' || (p.makerName && p.makerName.toLowerCase().includes(searchMaker.toLowerCase()));

        return matchJan && matchName && matchMaker;
    });

    // ------------------------------------
    // 計算ロジック
    // ------------------------------------
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * (parseInt(item.quantity) || 0)), 0);
    const tax = Math.floor(subtotal * 0.10); // 10%
    const totalAmount = subtotal + tax;

    // ------------------------------------
    // 発注確定
    // ------------------------------------
    const handleSubmit = async () => {
        if (!selectedFormat) return;

        const validationErrors = [];
        // 1. カスタムフィールドの必須チェック
        selectedFormat.fields.forEach(f => {
            if (f.required && f.type !== 'product-table' && !formValues[f.id]) {
                validationErrors.push(`「${f.label}」は必須入力です。`);
            }
        });

        // 2. テーブルの必須チェック
        const validItems = orderItems.filter(item => item.janCode && item.quantity > 0);
        if (validItems.length === 0) {
            validationErrors.push('商品を1つ以上正しく入力し、数量を指定してください。');
        }

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            window.scrollTo(0, 0);
            return;
        }

        setErrors([]);
        setIsSubmitting(true);

        try {
            // Firestore保存データ構築
            const orderData = {
                formatId: selectedFormat.id,
                formatName: selectedFormat.name,
                facilityName: user?.displayName || '病院ユーザー',
                customValues: formValues, // フォーマットによる自由入力項目
                items: validItems.map(item => ({
                    janCode: item.janCode,
                    productName: item.productName,
                    specification: item.specification,
                    price: item.price,
                    quantity: parseInt(item.quantity) || 0,
                    subtotal: item.price * (parseInt(item.quantity) || 0),
                    remarks: item.remarks || '',
                    customColumns: item.customColumns || {}
                })),
                amount: {
                    subtotal,
                    tax,
                    total: totalAmount
                },
                status: 'pending', // 承認待ち
                createdAt: serverTimestamp(),
                userId: user?.uid || 'anonymous'
            };

            await addDoc(collection(db, 'orders'), orderData);

            const now = new Date();
            const template = {
                id: `TPL-${uuidv4()}`,
                name: `${selectedFormat.name} (${now.toLocaleDateString('ja-JP')} 発注分)`,
                formatId: selectedFormat.id,
                formatName: selectedFormat.name,
                customValues: formValues,
                items: validItems.map(item => ({
                    janCode: item.janCode,
                    productName: item.productName,
                    specification: item.specification,
                    price: item.price,
                    quantity: parseInt(item.quantity) || 0,
                    remarks: item.remarks || '',
                    customColumns: item.customColumns || {}
                })),
                savedAt: now.toISOString()
            };
            saveStoredOrderTemplates([template, ...getStoredOrderTemplates()]);

            alert('発注を送信し、「いつもの注文」に保存しました。');

            applyFormat(selectedFormat);

        } catch (error) {
            console.error('Submit error:', error);
            if (error.code === 'permission-denied') {
                alert('Firebase権限エラー: Firestoreのセキュリティルールで書き込みが許可されていないか、プロジェクト設定が未反映です。Firebaseコンソールからルールの確認をお願いします。');
            } else {
                alert('発注エラー: ' + error.message);
            }
        }
        setIsSubmitting(false);
    };

    if (!selectedFormat) {
        return (
            <div className="card" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                <p className="text-muted mb-md">利用可能な発注フォーマットがありません。</p>
                <p>「設定 &gt; 発注書設定」からフォーマットを作成してください。</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h1>発注書作成</h1>
                <select className="form-input" value={selectedFormat?.id || ''} onChange={handleFormatChange} style={{ width: '250px' }}>
                    {savedFormats.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
            </div>

            {errors.length > 0 && (
                <div className="alert alert-danger" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <strong>⚠️ 以下のエラーがあります</strong>
                    <ul style={{ margin: '8px 0 0 20px' }}>
                        {errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                </div>
            )}

            <div className="card" style={{ padding: 'var(--spacing-xl)', background: '#fff' }}>
                <h2 style={{ textAlign: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: '10px', marginBottom: '30px' }}>
                    {selectedFormat.name}
                </h2>

                <div className="dynamic-form-grid">
                    {selectedFormat.fields.map(field => {
                        // ==== 商品明細テーブル ====
                        if (field.type === 'product-table') {
                            const tConf = field.tableConfig || DEFAULT_TABLE_CONFIG;
                            const visibleCols = tConf.columns.filter(c => c.visible);

                            const renderDynamicCell = (col, item, updateRowStr) => {
                                const isLocked = col.editLocked;

                                // 標準マッピング列
                                if (col.id === 'jan') {
                                    return (
                                        <input
                                            type="text"
                                            className="form-input"
                                            readOnly
                                            placeholder="選択..."
                                            value={item.janCode}
                                            onClick={() => openProductModal(item.id)}
                                            style={{
                                                cursor: 'pointer',
                                                padding: '6px',
                                                background: item.janCode ? 'transparent' : '#fef3c7',
                                                border: !item.janCode && item.quantity > 0 ? '1px solid var(--danger)' : ''
                                            }}
                                        />
                                    );
                                }
                                if (col.id === 'name') {
                                    return (
                                        <input
                                            type="text"
                                            className="form-input"
                                            readOnly
                                            placeholder="商品を選択してください"
                                            value={item.productName}
                                            onClick={() => openProductModal(item.id)}
                                            style={{
                                                cursor: 'pointer',
                                                padding: '6px',
                                                background: 'transparent'
                                            }}
                                        />
                                    );
                                }
                                if (col.id === 'spec') return <div style={{ color: '#64748b' }}>{item.specification}</div>;
                                if (col.id === 'quantity') {
                                    return (
                                        <input
                                            type="number"
                                            min="0"
                                            className="form-input"
                                            value={item.quantity === 0 ? '' : item.quantity}
                                            onChange={(e) => updateRow(item.id, 'quantity', e.target.value)}
                                            disabled={isLocked}
                                            style={{ padding: '6px', textAlign: 'right', border: item.janCode && !item.quantity && !isLocked ? '1px solid var(--danger)' : '' }}
                                        />
                                    );
                                }
                                if (col.id === 'unitPrice') {
                                    return <div style={{ textAlign: 'right', color: '#64748b' }}>{item.price > 0 ? item.price.toLocaleString() : ''}</div>;
                                }
                                if (col.id === 'subtotal' || col.type === 'computed') {
                                    return <div style={{ fontWeight: 'bold', textAlign: 'right' }}>{(item.price * (parseInt(item.quantity) || 0)).toLocaleString()}</div>;
                                }
                                if (col.id === 'remarks') {
                                    return (
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={item.remarks}
                                            onChange={(e) => updateRow(item.id, 'remarks', e.target.value)}
                                            disabled={isLocked}
                                            style={{ padding: '6px' }}
                                        />
                                    );
                                }

                                // カスタム列の処理
                                const customVal = (item.customColumns && item.customColumns[col.id]) || '';
                                const handleCustomChange = (val) => {
                                    updateRow(item.id, 'customColumns', { ...item.customColumns, [col.id]: val });
                                };

                                switch (col.type) {
                                    case 'select':
                                        return (
                                            <select className="form-input" value={customVal} onChange={(e) => handleCustomChange(e.target.value)} disabled={isLocked} style={{ padding: '6px' }}>
                                                <option value=""></option>
                                                <option value="Option A">Option A</option>
                                                <option value="Option B">Option B</option>
                                            </select>
                                        );
                                    case 'date':
                                        return <input type="date" className="form-input" value={customVal} onChange={(e) => handleCustomChange(e.target.value)} disabled={isLocked} style={{ padding: '6px' }} />;
                                    case 'number':
                                        return <input type="number" className="form-input" value={customVal} onChange={(e) => handleCustomChange(e.target.value)} disabled={isLocked} style={{ padding: '6px', textAlign: 'right' }} />;
                                    case 'textarea':
                                        return <textarea className="form-input" value={customVal} onChange={(e) => handleCustomChange(e.target.value)} disabled={isLocked} rows="1" style={{ padding: '6px', resize: 'vertical', minHeight: '34px' }} />;
                                    case 'text':
                                    default:
                                        return <input type="text" className="form-input" value={customVal} onChange={(e) => handleCustomChange(e.target.value)} disabled={isLocked} style={{ padding: '6px' }} />;
                                }
                            };

                            return (
                                <div key={field.id} className="form-section field-block-wrapper" style={{ gridRow: field.row || 'auto', gridColumn: field.col ? `${field.col} / span 4` : 'span 4' }}>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        📦 商品明細 <span className="req-badge">必須</span>
                                    </h3>
                                    <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                                        <table className="order-table" style={{ margin: 0, minWidth: '100%' }}>
                                            <thead style={{ background: '#f8fafc' }}>
                                                <tr>
                                                    <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                                                    {visibleCols.map(col => (
                                                        <th key={col.id} style={{ width: col.width ? `${col.width}px` : 'auto', minWidth: col.width ? `${col.width}px` : '100px' }}>
                                                            {col.label} {col.id === 'jan' || col.id === 'quantity' ? <span className="req">*</span> : ''}
                                                        </th>
                                                    ))}
                                                    <th style={{ width: '50px', textAlign: 'center' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderItems.map((item, index) => (
                                                    <tr key={item.id}>
                                                        <td style={{ textAlign: 'center', background: '#f8fafc', fontWeight: 'bold' }}>{index + 1}</td>
                                                        {visibleCols.map(col => (
                                                            <td key={col.id} style={{ background: col.editLocked && col.id !== 'jan' ? '#f1f5f9' : 'transparent', verticalAlign: 'top' }}>
                                                                {renderDynamicCell(col, item)}
                                                            </td>
                                                        ))}
                                                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                            <button
                                                                onClick={() => removeRow(item.id)}
                                                                style={{ padding: '4px', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
                                                                title="行を削除"
                                                            >✕</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div style={{ marginTop: '10px' }}>
                                        <button onClick={addRow} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>+ 行を追加</button>
                                        {tConf.maxRows && <span style={{ marginLeft: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>(最大 {tConf.maxRows} 行)</span>}
                                    </div>

                                    {/* 自動計算サマリー */}
                                    {tConf.showTotal !== false && (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                                            <div style={{ width: '300px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span className="text-muted">小計</span>
                                                    <span>¥{subtotal.toLocaleString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span className="text-muted">消費税 (10%)</span>
                                                    <span>¥{tax.toLocaleString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-dark)' }}>
                                                    <span>合計金額</span>
                                                    <span>¥{totalAmount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // ==== スペーサー ====
                        if (field.type === 'spacer') {
                            const sColSpan = field.colSpan || 1;
                            const sGridStyle = {
                                gridRow: field.row || 'auto',
                                gridColumn: field.col ? `${field.col} / span ${sColSpan}` : `span ${sColSpan}`,
                                minHeight: '1px'
                            };
                            return <div key={field.id} style={sGridStyle}></div>;
                        }

                        // ==== 標準フィールド群 ====
                        const isError = field.required && !formValues[field.id] && errors.length > 0;
                        const colSpan = field.colSpan || 4;
                        const gridStyle = {
                            gridRow: field.row || 'auto',
                            gridColumn: field.col ? `${field.col} / span ${colSpan}` : `span ${colSpan}`
                        };
                        const isTextInput = ['text', 'company', 'address', 'phone', 'fax'].includes(field.type);

                        return (
                            <div key={field.id} className="form-group" style={{ ...gridStyle, background: '#fafafa', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold', marginBottom: '8px' }}>
                                    {field.label}
                                    {field.required && <span className="req-badge">必須</span>}
                                </label>

                                {isTextInput && (
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={field.placeholder}
                                        value={formValues[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        style={isError ? { borderColor: 'var(--danger)', background: '#fef2f2' } : {}}
                                    />
                                )}
                                {field.type === 'textarea' && (
                                    <textarea
                                        className="form-input"
                                        placeholder={field.placeholder}
                                        rows="3"
                                        value={formValues[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        style={isError ? { borderColor: 'var(--danger)', background: '#fef2f2' } : {}}
                                    />
                                )}
                                {field.type === 'date' && (
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formValues[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        style={isError ? { borderColor: 'var(--danger)', background: '#fef2f2' } : {}}
                                    />
                                )}
                                {field.type === 'select' && (
                                    <select
                                        className="form-input"
                                        value={formValues[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        style={isError ? { borderColor: 'var(--danger)', background: '#fef2f2' } : {}}
                                    >
                                        <option value="">選択してください</option>
                                        {field.options?.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={{ padding: '12px 40px', fontSize: '1.1rem', boxShadow: '0 4px 6px rgba(13, 148, 136, 0.2)' }}
                    >
                        {isSubmitting ? '送信中...' : '発注書を保存'}
                    </button>
                    <p className="text-muted mt-sm" style={{ fontSize: '0.85rem' }}>※保存した発注内容は「いつもの注文」にも登録されます</p>
                </div>
            </div>

            {/* 商品選択モーダル */}
            {showProductModal && (
                <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
                    <div className="modal product-picker-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">商品を選択</h2>
                            <button className="modal-close" onClick={() => setShowProductModal(false)}>×</button>
                        </div>

                        <div className="product-picker-filters">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="JANコード"
                                value={searchJan}
                                onChange={(e) => setSearchJan(e.target.value)}
                            />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="商品名"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                            />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="メーカー名"
                                value={searchMaker}
                                onChange={(e) => setSearchMaker(e.target.value)}
                            />
                        </div>

                        <div className="product-picker-results">
                            <table className="table product-picker-table">
                                <thead>
                                    <tr>
                                        <th>JANコード</th>
                                        <th>商品名</th>
                                        <th>規格</th>
                                        <th>メーカー</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(product => (
                                        <tr key={product.id}>
                                            <td title={product.janCode}>
                                                <span className="product-picker-cell">{product.janCode}</span>
                                            </td>
                                            <td title={product.productName}>
                                                <span className="product-picker-cell">{product.productName}</span>
                                            </td>
                                            <td title={product.specification}>
                                                <span className="product-picker-cell">{product.specification}</span>
                                            </td>
                                            <td title={product.makerName}>
                                                <span className="product-picker-cell">{product.makerName}</span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => selectProduct(product)}
                                                    className="btn btn-sm btn-primary product-picker-action"
                                                >
                                                    選択
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
