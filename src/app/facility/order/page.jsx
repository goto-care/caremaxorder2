'use client';
import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getProducts, saveProducts } from '@/utils/storageUtils';

// カスタムフック：クリック外判定
function useOutsideClick(ref, handler) {
    useEffect(() => {
        const listener = (event) => {
            if (!ref.current || ref.current.contains(event.target)) return;
            handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
}

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
        { id: uuidv4(), searchKey: '', janCode: '', productName: '', specification: '', price: 0, quantity: 0, remarks: '', isSearching: false }
    ]);

    // Validation
    const [errors, setErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. 初期データロード
    useEffect(() => {
        const savedProds = getProducts();
        if (savedProds && savedProds.length > 0) {
            // 単価がない場合は適当に付与
            const prodsWithPrice = savedProds.map(p => ({ ...p, price: p.price || Math.floor(Math.random() * 5000) + 100 }));
            setProductMaster(prodsWithPrice);
        } else {
            setProductMaster(initialProducts);
            saveProducts(initialProducts);
        }

        const formatsStr = localStorage.getItem('orderFormats');
        if (formatsStr) {
            const formats = JSON.parse(formatsStr);
            setSavedFormats(formats);
            if (formats.length > 0) {
                applyFormat(formats[0]);
            }
        }
    }, []);

    // 2. フォーマット適用
    const applyFormat = (format) => {
        setSelectedFormat(format);
        // カスタムフィールドの初期化
        const newFormValues = {};
        format.fields.forEach(f => {
            if (f.type !== 'product-table') {
                newFormValues[f.id] = '';
            }
        });
        setFormValues(newFormValues);
        setErrors([]);
    };

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
        setOrderItems([...orderItems, { id: uuidv4(), searchKey: '', janCode: '', productName: '', specification: '', price: 0, quantity: 0, remarks: '', isSearching: false }]);
    };

    const removeRow = (id) => {
        if (orderItems.length > 1) {
            setOrderItems(orderItems.filter(item => item.id !== id));
        }
    };

    const updateRow = (id, field, value) => {
        setOrderItems(orderItems.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    // インクリメンタルサーチ
    const handleSearchKeyChange = (id, value) => {
        updateRow(id, 'searchKey', value);
        updateRow(id, 'isSearching', true);
        // 入力変更時は一旦確定済みデータをクリア
        updateRow(id, 'janCode', '');
        updateRow(id, 'productName', '');
        updateRow(id, 'specification', '');
        updateRow(id, 'price', 0);
    };

    const selectProduct = (id, product) => {
        if (product.salesStatus === '廃盤') {
            alert('この商品は廃盤のため発注できません。');
            return;
        }
        setOrderItems(orderItems.map(item => item.id === id ? {
            ...item,
            searchKey: `${product.janCode} - ${product.productName}`,
            janCode: product.janCode,
            productName: product.productName,
            specification: product.specification,
            price: product.price || 0,
            isSearching: false
        } : item));
    };

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
                    remarks: item.remarks
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
            alert('発注を送信しました！');

            // リセット
            applyFormat(selectedFormat);
            setOrderItems([{ id: uuidv4(), searchKey: '', janCode: '', productName: '', specification: '', price: 0, quantity: 0, remarks: '', isSearching: false }]);

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
                <h1>発注入力</h1>
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
                            return (
                                <div key={field.id} className="form-section field-block-wrapper" style={{ gridRow: field.row || 'auto', gridColumn: field.col ? `${field.col} / span 4` : 'span 4' }}>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        📦 商品明細 <span className="req-badge">必須</span>
                                    </h3>
                                    <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                                        <table className="order-table" style={{ margin: 0 }}>
                                            <thead style={{ background: '#f8fafc' }}>
                                                <tr>
                                                    <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                                                    <th style={{ width: '300px' }}>JANコード / 商品名検索 <span className="req">*</span></th>
                                                    <th style={{ width: '120px' }}>規格</th>
                                                    <th style={{ width: '100px', textAlign: 'right' }}>単価(円)</th>
                                                    <th style={{ width: '80px' }}>数量 <span className="req">*</span></th>
                                                    <th style={{ width: '100px', textAlign: 'right' }}>小計(円)</th>
                                                    <th>備考</th>
                                                    <th style={{ width: '50px', textAlign: 'center' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderItems.map((item, index) => (
                                                    <tr key={item.id}>
                                                        <td style={{ textAlign: 'center', background: '#f8fafc', fontWeight: 'bold' }}>{index + 1}</td>
                                                        <td style={{ position: 'relative', overflow: 'visible' }}>
                                                            {/* インクリメンタルサーチセル */}
                                                            <SearchCell
                                                                item={item}
                                                                productMaster={productMaster}
                                                                onSearchChange={(val) => handleSearchKeyChange(item.id, val)}
                                                                onSelect={(prod) => selectProduct(item.id, prod)}
                                                                onBlur={() => updateRow(item.id, 'isSearching', false)}
                                                                onFocus={() => updateRow(item.id, 'isSearching', true)}
                                                            />
                                                        </td>
                                                        <td style={{ background: '#f1f5f9', color: '#64748b' }}>{item.specification}</td>
                                                        <td style={{ background: '#f1f5f9', color: '#64748b', textAlign: 'right' }}>
                                                            {item.price > 0 ? item.price.toLocaleString() : ''}
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="form-input"
                                                                value={item.quantity === 0 ? '' : item.quantity}
                                                                onChange={(e) => updateRow(item.id, 'quantity', e.target.value)}
                                                                style={{ padding: '6px', textAlign: 'right', border: item.janCode && !item.quantity ? '1px solid var(--danger)' : '' }}
                                                            />
                                                        </td>
                                                        <td style={{ background: '#f1f5f9', fontWeight: 'bold', textAlign: 'right' }}>
                                                            {(item.price * (parseInt(item.quantity) || 0)).toLocaleString()}
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                className="form-input"
                                                                value={item.remarks}
                                                                onChange={(e) => updateRow(item.id, 'remarks', e.target.value)}
                                                                style={{ padding: '6px' }}
                                                            />
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button
                                                                onClick={() => removeRow(item.id)}
                                                                className="btn btn-secondary"
                                                                style={{ padding: '4px 8px', color: 'var(--danger)', background: 'transparent', border: 'none' }}
                                                            >✕</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div style={{ marginTop: '10px' }}>
                                        <button onClick={addRow} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>+ 行を追加</button>
                                    </div>

                                    {/* 自動計算サマリー */}
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
                        {isSubmitting ? '送信中...' : '発注を確定する'}
                    </button>
                    <p className="text-muted mt-sm" style={{ fontSize: '0.85rem' }}>※発注データはシステムを通じて販売店へ共有されます</p>
                </div>
            </div>
        </div>
    );
}

// ==== インクリメンタルサーチ用カスタムセルコンポーネント ====
function SearchCell({ item, productMaster, onSearchChange, onSelect, onFocus, onBlur }) {
    const wrapperRef = useRef(null);
    const [localValue, setLocalValue] = useState(item.searchKey);

    useEffect(() => {
        setLocalValue(item.searchKey);
    }, [item.searchKey]);

    // クリック外判定でドロップダウンを閉じる
    useOutsideClick(wrapperRef, () => {
        if (item.isSearching) onBlur();
    });

    const filtered = item.isSearching && localValue.length > 0
        ? productMaster.filter(p =>
            p.salesStatus !== '廃盤' &&
            (p.janCode.includes(localValue) || p.productName.toLowerCase().includes(localValue.toLowerCase()))
        ).slice(0, 10) // 最大10件表示
        : [];

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <input
                type="text"
                className="form-input"
                placeholder="JANまたは商品名..."
                value={localValue}
                onChange={(e) => {
                    setLocalValue(e.target.value);
                    if (!item.isSearching) onFocus(); // 強制的に検索状態にする
                    onSearchChange(e.target.value);
                }}
                onFocus={onFocus}
                style={{
                    padding: '6px',
                    width: '100%',
                    background: item.janCode ? 'transparent' : '#fff',
                    border: !item.janCode && item.quantity > 0 ? '1px solid var(--danger)' : ''
                }}
            />

            {/* 検索ドロップダウン */}
            {item.isSearching && localValue.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid var(--primary)',
                    borderRadius: '4px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    maxHeight: '250px',
                    overflowY: 'auto',
                    marginTop: '2px'
                }}>
                    {filtered.length > 0 ? (
                        filtered.map(p => (
                            <div
                                key={p.id}
                                style={{
                                    padding: '8px 12px',
                                    borderBottom: '1px solid #f1f5f9',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}
                                onMouseDown={(e) => {
                                    // onClickより早く発火させるためにonMouseDownを使用（blurによる非表示対策）
                                    e.preventDefault();
                                    onSelect(p);
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdfa'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                <div>
                                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{p.janCode}</div>
                                    <div style={{ fontWeight: 'bold' }}>{p.productName}</div>
                                </div>
                                <div style={{ textAlign: 'right', color: '#64748b' }}>
                                    <div>{p.specification}</div>
                                    <div style={{ color: 'var(--primary)' }}>¥{p.price.toLocaleString()}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '10px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
                            該当する商品が見つかりません
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
