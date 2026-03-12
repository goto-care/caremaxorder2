'use client';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getProducts, saveProducts, getFacilities } from '@/utils/storageUtils';

// 初期サンプル商品（storageに何もない場合のフォールバック）
const initialProducts = [
    { id: '1', janCode: '4901234567890', productName: 'サンプル商品A', specification: '100ml×10本', caseQuantity: 10, makerId: 'M001', makerName: 'メーカーA', salesStatus: '' },
    { id: '2', janCode: '4901234567891', productName: 'サンプル商品B', specification: '50g×20個', caseQuantity: 20, makerId: 'M002', makerName: 'メーカーB', salesStatus: '' },
    { id: '3', janCode: '4901234567892', productName: 'サンプル商品C', specification: '200ml×5本', caseQuantity: 5, makerId: 'M001', makerName: 'メーカーA', salesStatus: '廃盤' },
    { id: '4', janCode: '4901234567893', productName: 'サンプル商品D', specification: '150g×12個', caseQuantity: 12, makerId: 'M003', makerName: 'メーカーC', salesStatus: '' },
    { id: '5', janCode: '4901234567894', productName: 'サンプル商品E', specification: '250ml×8本', caseQuantity: 8, makerId: 'M001', makerName: 'メーカーA', salesStatus: '' },
];

export default function DistributorOrderPage() {
    const { user } = useAuth();

    // 施設一覧（販売店配下）
    const [facilityList, setFacilityList] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState(null);

    // 商品マスタ（共有ストレージから読み込み）
    const [productMaster, setProductMaster] = useState([]);

    useEffect(() => {
        // 商品マスタ読み込み
        const savedProducts = getProducts();
        if (savedProducts && savedProducts.length > 0) {
            setProductMaster(savedProducts);
        } else {
            setProductMaster(initialProducts);
            saveProducts(initialProducts);
        }
        // 施設一覧読み込み
        const savedFacilities = getFacilities();
        if (savedFacilities && savedFacilities.length > 0) {
            setFacilityList(savedFacilities.filter(f => f.status === 'active'));
        }
    }, []);

    // メーカールール
    const [makerRules, setMakerRules] = useState([
        { makerId: 'M001', makerName: 'メーカーA', minimumCases: 5, alertMessage: 'メーカーAの商品は5ケース以上でないと発注できません' },
        { makerId: 'M002', makerName: 'メーカーB', minimumCases: 3, alertMessage: 'メーカーBの商品は3ケース以上でないと発注できません' },
        { makerId: 'M003', makerName: 'メーカーC', minimumCases: 10, alertMessage: 'メーカーCの商品は10ケース以上でないと発注できません' },
    ]);

    // 発注書のデータ
    const [orderItems, setOrderItems] = useState([
        { id: uuidv4(), janCode: '', productName: '', specification: '', caseQuantity: 0, quantity: 0, remarks: '' }
    ]);

    // お届け先リスト
    const [deliveryAddresses, setDeliveryAddresses] = useState(['']);

    // カスタム列（動的追加）
    const [customColumns, setCustomColumns] = useState([]);

    // カスタム列追加
    const addCustomColumn = () => {
        const colName = prompt('列名を入力してください:', `カスタム${customColumns.length + 1}`);
        if (colName) {
            const colId = `col_${Date.now()}`;
            setCustomColumns([...customColumns, { id: colId, name: colName }]);
            setOrderItems(orderItems.map(item => ({
                ...item,
                customValues: { ...item.customValues, [colId]: '' }
            })));
        }
    };

    // カスタム列削除
    const removeCustomColumn = (colId) => {
        if (confirm('この列を削除してもよろしいですか？')) {
            setCustomColumns(customColumns.filter(col => col.id !== colId));
            setOrderItems(orderItems.map(item => {
                const newCustomValues = { ...item.customValues };
                delete newCustomValues[colId];
                return { ...item, customValues: newCustomValues };
            }));
        }
    };

    // カスタム列の値更新
    const updateCustomValue = (itemId, colId, value) => {
        setOrderItems(orderItems.map(item =>
            item.id === itemId
                ? { ...item, customValues: { ...item.customValues, [colId]: value } }
                : item
        ));
    };

    // 二重発注チェック用
    const [lastOrderTime, setLastOrderTime] = useState(null);
    const [lastOrderContent, setLastOrderContent] = useState(null);

    // モーダル制御
    const [showProductModal, setShowProductModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
    const [currentRowId, setCurrentRowId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [validationErrors, setValidationErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 行追加
    const addRow = () => {
        const customValues = {};
        customColumns.forEach(col => {
            customValues[col.id] = '';
        });
        setOrderItems([...orderItems, {
            id: uuidv4(),
            janCode: '',
            productName: '',
            specification: '',
            caseQuantity: 0,
            quantity: 0,
            remarks: '',
            customValues
        }]);
    };

    // 行削除
    const removeRow = (id) => {
        if (orderItems.length > 1) {
            setOrderItems(orderItems.filter(item => item.id !== id));
        }
    };

    // 商品選択モーダルを開く
    const openProductModal = (rowId) => {
        setCurrentRowId(rowId);
        setSearchTerm('');
        setShowProductModal(true);
    };

    // 商品を選択
    const selectProduct = (product) => {
        if (product.salesStatus === '廃盤') {
            alert('この商品は廃盤のため発注できません。');
            return;
        }
        setOrderItems(orderItems.map(item =>
            item.id === currentRowId
                ? {
                    ...item,
                    janCode: product.janCode,
                    productName: product.productName,
                    specification: product.specification,
                    caseQuantity: product.caseQuantity,
                    makerId: product.makerId,
                    salesStatus: product.salesStatus || ''
                }
                : item
        ));
        setShowProductModal(false);
    };

    // 数量変更
    const updateQuantity = (id, quantity) => {
        setOrderItems(orderItems.map(item =>
            item.id === id ? { ...item, quantity: Math.max(0, parseInt(quantity) || 0) } : item
        ));
    };

    // 備考変更
    const updateRemarks = (id, remarks) => {
        setOrderItems(orderItems.map(item =>
            item.id === id ? { ...item, remarks } : item
        ));
    };

    // お届け先追加
    const addDeliveryAddress = () => {
        setDeliveryAddresses([...deliveryAddresses, '']);
    };

    // お届け先削除
    const removeDeliveryAddress = (index) => {
        if (deliveryAddresses.length > 1) {
            setDeliveryAddresses(deliveryAddresses.filter((_, i) => i !== index));
        }
    };

    // お届け先更新
    const updateDeliveryAddress = (index, value) => {
        setDeliveryAddresses(deliveryAddresses.map((addr, i) => i === index ? value : addr));
    };

    // バリデーション
    const validateOrder = () => {
        const errors = [];

        // 施設選択チェック
        if (!selectedFacility) {
            errors.push('発注先の施設を選択してください');
            return errors;
        }

        const validItems = orderItems.filter(item => item.janCode && item.quantity > 0);

        if (validItems.length === 0) {
            errors.push('1品目以上の商品を入力してください');
            return errors;
        }

        // メーカーごとにケース数を集計
        const makerTotals = {};
        validItems.forEach(item => {
            if (!makerTotals[item.makerId]) {
                makerTotals[item.makerId] = 0;
            }
            makerTotals[item.makerId] += item.quantity;
        });

        // ルールチェック
        Object.entries(makerTotals).forEach(([makerId, total]) => {
            const rule = makerRules.find(r => r.makerId === makerId);
            if (rule && total < rule.minimumCases) {
                errors.push(rule.alertMessage);
            }
        });

        return errors;
    };

    // 二重発注チェック
    const checkDuplicateOrder = () => {
        if (!lastOrderTime || !lastOrderContent) return false;

        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (lastOrderTime < oneHourAgo) return false;

        const currentContent = JSON.stringify(orderItems.filter(item => item.janCode && item.quantity > 0));
        return currentContent === lastOrderContent;
    };

    // 発注確定処理
    const handleSubmit = async () => {
        const errors = validateOrder();
        if (errors.length > 0) {
            setValidationErrors(errors);
            return;
        }

        setValidationErrors([]);

        if (checkDuplicateOrder()) {
            setShowDuplicateWarning(true);
            return;
        }

        setShowConfirmModal(true);
    };

    // 発注実行
    const confirmOrder = async (force = false) => {
        setShowConfirmModal(false);
        setShowDuplicateWarning(false);
        setIsSubmitting(true);

        try {
            const validItems = orderItems.filter(item => item.janCode && item.quantity > 0);

            // Firestoreに注文を保存
            const orderData = {
                facilityName: selectedFacility.name,
                facilityCode: selectedFacility.facilityCode,
                orderDate: new Date().toISOString().slice(0, 10),
                items: validItems.map(item => ({
                    janCode: item.janCode,
                    productName: item.productName,
                    specification: item.specification,
                    caseQuantity: item.caseQuantity,
                    quantity: item.quantity,
                    remarks: item.remarks,
                    customValues: item.customValues || {}
                })),
                deliveryAddresses: deliveryAddresses.filter(addr => addr.trim() !== ''),
                totalQuantity: validItems.reduce((sum, i) => sum + (i.quantity || 0), 0),
                createdAt: serverTimestamp(),
                userId: user?.uid || 'anonymous',
                userEmail: user?.email || 'anonymous',
                orderedBy: 'distributor',
                status: 'pending'
            };

            await addDoc(collection(db, 'orders'), orderData);

            const currentContent = JSON.stringify(validItems);
            setLastOrderTime(Date.now());
            setLastOrderContent(currentContent);

            alert('発注書を保存しました！');

            setOrderItems([{ id: uuidv4(), janCode: '', productName: '', specification: '', caseQuantity: 0, quantity: 0, remarks: '' }]);
            setDeliveryAddresses(['']);

        } catch (error) {
            console.error("Order submission error: ", error);
            alert('発注に失敗しました: ' + error.message);
        }

        setIsSubmitting(false);
    };

    // いつもの注文として保存
    const saveAsTemplate = () => {
        const templateName = prompt('テンプレート名を入力してください:');
        if (templateName) {
            const template = {
                name: templateName,
                items: orderItems.filter(item => item.janCode),
                deliveryAddresses: deliveryAddresses.filter(addr => addr),
                savedAt: new Date().toISOString()
            };

            const templates = JSON.parse(localStorage.getItem('orderTemplates') || '[]');
            templates.push(template);
            localStorage.setItem('orderTemplates', JSON.stringify(templates));

            alert('テンプレートを保存しました');
        }
    };

    // 検索フィルタ（廃盤商品は除外）
    const filteredProducts = productMaster.filter(p =>
        p.salesStatus !== '廃盤' && (
            p.productName.includes(searchTerm) ||
            p.janCode.includes(searchTerm) ||
            (p.makerName && p.makerName.includes(searchTerm))
        )
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h1>発注書作成</h1>
                <div className="flex gap-sm">
                    <button onClick={saveAsTemplate} className="btn btn-secondary">
                        ⭐ テンプレート保存
                    </button>
                </div>
            </div>

            {/* 施設選択（販売店必須） */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-lg)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#374151' }}>🏥 発注先施設の選択 <span style={{ color: '#ef4444' }}>*必須</span></h3>
                {facilityList.length === 0 ? (
                    <div className="alert alert-warning">
                        <p>施設が登録されていません。先に「施設管理」画面から施設を登録してください。</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                            className="form-input"
                            style={{ maxWidth: '400px' }}
                            value={selectedFacility ? selectedFacility.id : ''}
                            onChange={(e) => {
                                const facility = facilityList.find(f => f.id === e.target.value);
                                setSelectedFacility(facility || null);
                            }}
                        >
                            <option value="">-- 施設を選択してください --</option>
                            {facilityList.map(f => (
                                <option key={f.id} value={f.id}>
                                    [{f.facilityCode}] {f.name}
                                </option>
                            ))}
                        </select>
                        {selectedFacility && (
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                                <span className="badge badge-primary" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                                    施設CD: {selectedFacility.facilityCode}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    {selectedFacility.email}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* バリデーションエラー表示 */}
            {validationErrors.length > 0 && (
                <div className="alert alert-danger" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div>
                        <strong>⚠️ 発注できません</strong>
                        <ul style={{ margin: 'var(--spacing-sm) 0 0 var(--spacing-lg)', padding: 0 }}>
                            {validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* 発注書本体 */}
            <div className="order-form">
                <div className="order-form-header">
                    <h2 className="order-form-title">発 注 書</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-lg)' }}>
                        <div>
                            <p style={{ marginBottom: 'var(--spacing-xs)' }}>
                                <strong>発注日:</strong> {new Date().toISOString().slice(0, 10)}
                            </p>
                            <p>
                                <strong>発注先施設:</strong> {selectedFacility ? `${selectedFacility.name} (${selectedFacility.facilityCode})` : '未選択'}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                                発注番号: ORD-{Date.now().toString().slice(-8)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 商品テーブル */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-sm)' }}>
                    <button onClick={addCustomColumn} className="btn btn-sm btn-secondary">
                        ➕ 列を追加
                    </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="order-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>No</th>
                                <th style={{ width: '140px' }}>JANコード</th>
                                <th>商品名</th>
                                <th style={{ width: '120px' }}>規格</th>
                                <th style={{ width: '80px' }}>入数</th>
                                <th style={{ width: '80px' }}>数量</th>
                                {customColumns.map(col => (
                                    <th key={col.id} style={{ width: '100px', position: 'relative' }}>
                                        {col.name}
                                        <button
                                            onClick={() => removeCustomColumn(col.id)}
                                            style={{
                                                position: 'absolute',
                                                top: '2px',
                                                right: '2px',
                                                background: 'none',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                fontSize: '0.7rem',
                                                padding: '0 4px'
                                            }}
                                            title="列を削除"
                                        >
                                            ✕
                                        </button>
                                    </th>
                                ))}
                                <th style={{ width: '150px' }}>備考</th>
                                <th style={{ width: '60px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orderItems.map((item, index) => {
                                const isDiscontinued = item.salesStatus === '廃盤';
                                const rowStyle = isDiscontinued ? {
                                    backgroundColor: '#f3f4f6',
                                    opacity: 0.6,
                                    position: 'relative'
                                } : {};

                                return (
                                    <tr key={item.id} style={rowStyle}>
                                        <td style={{ textAlign: 'center', background: '#f3f4f6' }}>
                                            {index + 1}
                                            {isDiscontinued && (
                                                <span style={{ display: 'block', fontSize: '0.65rem', color: '#ef4444' }}>廃盤</span>
                                            )}
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={item.janCode}
                                                readOnly
                                                placeholder="選択..."
                                                onClick={() => !isDiscontinued && openProductModal(item.id)}
                                                style={{
                                                    cursor: isDiscontinued ? 'not-allowed' : 'pointer',
                                                    background: item.janCode ? (isDiscontinued ? '#e5e7eb' : 'white') : '#fef3c7',
                                                    textDecoration: isDiscontinued ? 'line-through' : 'none'
                                                }}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={item.productName}
                                                readOnly
                                                placeholder="商品を選択してください"
                                                onClick={() => !isDiscontinued && openProductModal(item.id)}
                                                style={{
                                                    cursor: isDiscontinued ? 'not-allowed' : 'pointer',
                                                    textDecoration: isDiscontinued ? 'line-through' : 'none'
                                                }}
                                            />
                                        </td>
                                        <td><input type="text" value={item.specification} readOnly style={isDiscontinued ? { textDecoration: 'line-through' } : {}} /></td>
                                        <td style={{ textAlign: 'center' }}>{item.caseQuantity || '-'}</td>
                                        <td>
                                            <input
                                                type="number"
                                                value={item.quantity || ''}
                                                onChange={(e) => updateQuantity(item.id, e.target.value)}
                                                min="0"
                                                placeholder="0"
                                                style={{ textAlign: 'center', background: isDiscontinued ? '#e5e7eb' : 'white' }}
                                                disabled={isDiscontinued}
                                            />
                                        </td>
                                        {customColumns.map(col => (
                                            <td key={col.id}>
                                                <input
                                                    type="text"
                                                    value={item.customValues?.[col.id] || ''}
                                                    onChange={(e) => updateCustomValue(item.id, col.id, e.target.value)}
                                                    placeholder="-"
                                                    style={{ textAlign: 'center', background: isDiscontinued ? '#e5e7eb' : 'white' }}
                                                    disabled={isDiscontinued}
                                                />
                                            </td>
                                        ))}
                                        <td>
                                            <input
                                                type="text"
                                                value={item.remarks}
                                                onChange={(e) => updateRemarks(item.id, e.target.value)}
                                                placeholder="備考"
                                                disabled={isDiscontinued}
                                                style={{ background: isDiscontinued ? '#e5e7eb' : 'white' }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                onClick={() => removeRow(item.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    fontSize: '1.25rem'
                                                }}
                                                disabled={orderItems.length === 1}
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <button onClick={addRow} className="btn btn-secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                    ➕ 行を追加
                </button>

                {/* お届け先 */}
                <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)', borderTop: '2px solid #e5e7eb' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#374151' }}>お届け先</h3>
                    {deliveryAddresses.map((address, index) => (
                        <div key={index} style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                            <span style={{ minWidth: '30px', color: '#6b7280' }}>{index + 1}.</span>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => updateDeliveryAddress(index, e.target.value)}
                                placeholder="住所を入力..."
                                style={{
                                    flex: 1,
                                    padding: 'var(--spacing-sm)',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 'var(--radius-sm)'
                                }}
                            />
                            <button
                                onClick={() => removeDeliveryAddress(index)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer'
                                }}
                                disabled={deliveryAddresses.length === 1}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button onClick={addDeliveryAddress} className="btn btn-sm btn-secondary" style={{ marginTop: 'var(--spacing-sm)' }}>
                        ➕ お届け先を追加
                    </button>
                </div>
            </div>

            {/* 発注ボタン */}
            <div style={{
                marginTop: 'var(--spacing-xl)',
                display: 'flex',
                justifyContent: 'center',
                gap: 'var(--spacing-md)'
            }}>
                <button
                    onClick={handleSubmit}
                    className="btn btn-success btn-lg"
                    disabled={isSubmitting}
                    style={{ minWidth: '200px' }}
                >
                    {isSubmitting ? '保存中...' : '💾 発注書を保存する'}
                </button>
            </div>

            {/* 商品選択モーダル */}
            {showProductModal && (
                <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
                    <div className="modal product-picker-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">商品を選択</h2>
                            <button className="modal-close" onClick={() => setShowProductModal(false)}>×</button>
                        </div>

                        <div className="product-picker-filters product-picker-filters-single">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="商品名、JANコード、メーカー名で検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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

            {/* 確認モーダル */}
            {showConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">保存確認</h2>
                        </div>
                        <p>以下の内容で発注書を保存しますか？</p>
                        <div style={{
                            background: 'var(--bg-tertiary)',
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius-md)',
                            margin: 'var(--spacing-md) 0'
                        }}>
                            <p><strong>施設:</strong> {selectedFacility?.name} ({selectedFacility?.facilityCode})</p>
                            <p><strong>品目数:</strong> {orderItems.filter(i => i.janCode && i.quantity > 0).length}品目</p>
                            <p><strong>総数量:</strong> {orderItems.reduce((sum, i) => sum + (i.quantity || 0), 0)}ケース</p>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowConfirmModal(false)} className="btn btn-secondary">キャンセル</button>
                            <button onClick={() => confirmOrder()} className="btn btn-success">保存する</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 二重発注警告モーダル */}
            {showDuplicateWarning && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title" style={{ color: 'var(--warning)' }}>⚠️ 二重発注の確認</h2>
                        </div>
                        <div className="alert alert-warning" style={{ margin: 'var(--spacing-md) 0' }}>
                            同じ内容の注文が1時間以内に既に送信されています。
                        </div>
                        <p>それでも発注を続けますか？</p>
                        <div className="modal-footer">
                            <button onClick={() => setShowDuplicateWarning(false)} className="btn btn-secondary">キャンセル</button>
                            <button onClick={() => confirmOrder(true)} className="btn btn-warning">続行する</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
