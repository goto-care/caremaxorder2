'use client';
import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { matchesSearch } from '@/utils/kanaUtils';
import { generateOriginalCode, getProducts, saveProducts } from '@/utils/storageUtils';

// 初期サンプルデータ
const initialProducts = [
    { id: '1', originalCode: 'ORG-00001', janCode: '4901234567890', webCode: '123456', productName: 'サンプル商品A', specification: '100ml×10本', caseQuantity: 10, supplierId: 'S001', supplierName: '仕入先A', makerId: 'M001', makerName: 'メーカーA', salesStatus: '' },
    { id: '2', originalCode: 'ORG-00002', janCode: '4901234567891', webCode: '234567', productName: 'サンプル商品B', specification: '50g×20個', caseQuantity: 20, supplierId: 'S002', supplierName: '仕入先B', makerId: 'M002', makerName: 'メーカーB', salesStatus: '' },
    { id: '3', originalCode: 'ORG-00003', janCode: '4901234567892', webCode: '345678', productName: 'サンプル商品C', specification: '200ml×5本', caseQuantity: 5, supplierId: 'S001', supplierName: '仕入先A', makerId: 'M001', makerName: 'メーカーA', salesStatus: '廃盤' },
];

export default function ProductMaster() {
    const [products, setProducts] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // 項目別検索フィルター
    const [searchFilters, setSearchFilters] = useState({
        originalCode: '',
        janCode: '',
        webCode: '',
        productName: '',
        supplierId: '',
        makerId: '',
        makerName: '',
        salesStatus: ''
    });

    const [formData, setFormData] = useState({
        janCode: '',
        webCode: '',
        productName: '',
        specification: '',
        caseQuantity: '',
        supplierId: '',
        supplierName: '',
        makerId: '',
        makerName: '',
        salesStatus: ''
    });

    // 初回ロード時にlocalStorageからデータを取得
    useEffect(() => {
        const savedProducts = getProducts();
        if (savedProducts && savedProducts.length > 0) {
            setProducts(savedProducts);
        } else {
            setProducts(initialProducts);
            saveProducts(initialProducts);
        }
        setIsLoaded(true);
    }, []);

    // products が変更されたら保存
    useEffect(() => {
        if (isLoaded && products.length > 0) {
            saveProducts(products);
        }
    }, [products, isLoaded]);

    // フィルタリング（カナ正規化対応）
    const filteredProducts = products.filter(p => {
        if (searchFilters.originalCode && !p.originalCode?.includes(searchFilters.originalCode)) return false;
        if (searchFilters.janCode && !p.janCode.includes(searchFilters.janCode)) return false;
        if (searchFilters.webCode && !p.webCode?.includes(searchFilters.webCode)) return false;
        if (searchFilters.productName && !matchesSearch(p.productName, searchFilters.productName)) return false;
        if (searchFilters.supplierId && !p.supplierId?.includes(searchFilters.supplierId)) return false;
        if (searchFilters.makerId && !p.makerId?.includes(searchFilters.makerId)) return false;
        if (searchFilters.makerName && !matchesSearch(p.makerName, searchFilters.makerName)) return false;
        if (searchFilters.salesStatus === '廃盤' && p.salesStatus !== '廃盤') return false;
        if (searchFilters.salesStatus === '販売中' && p.salesStatus === '廃盤') return false;
        return true;
    });

    // JANコード重複チェック
    const checkJanCodeDuplicate = (janCode, currentId = null) => {
        return products.some(p => p.janCode === janCode && p.id !== currentId);
    };

    // 新規/編集モーダル表示
    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData({
                janCode: '',
                webCode: '',
                productName: '',
                specification: '',
                caseQuantity: '',
                supplierId: '',
                supplierName: '',
                makerId: '',
                makerName: '',
                salesStatus: ''
            });
        }
        setShowModal(true);
    };

    // 保存処理
    const handleSave = () => {
        // JANコード重複チェック
        if (checkJanCodeDuplicate(formData.janCode, editingProduct?.id)) {
            alert('このJANコードは既に登録されています。');
            return;
        }

        // WEBコードバリデーション（6桁の数字）
        if (formData.webCode && !/^\d{6}$/.test(formData.webCode)) {
            alert('WEBコードは6桁の数字で入力してください。');
            return;
        }

        if (editingProduct) {
            setProducts(products.map(p => p.id === editingProduct.id ? { ...formData, id: editingProduct.id, originalCode: editingProduct.originalCode } : p));
        } else {
            // 新規登録時にオリジナルコードを自動生成
            const newProduct = {
                ...formData,
                id: String(Date.now()),
                originalCode: generateOriginalCode()
            };
            setProducts([...products, newProduct]);
        }
        setShowModal(false);
    };

    // 削除処理
    const handleDelete = (id) => {
        if (confirm('この商品を削除してもよろしいですか？')) {
            setProducts(products.filter(p => p.id !== id));
        }
    };

    // CSVエクスポート（絞り込み状態の商品のみ）
    const handleExport = () => {
        const exportData = filteredProducts.map(p => ({
            オリジナルコード: p.originalCode || '',
            JANコード: p.janCode,
            WEBコード: p.webCode || '',
            商品名: p.productName,
            規格: p.specification,
            ケース入数: p.caseQuantity,
            仕入先CD: p.supplierId,
            仕入先名: p.supplierName,
            メーカーCD: p.makerId,
            メーカー名: p.makerName,
            販売状況: p.salesStatus || ''
        }));

        const csv = Papa.unparse(exportData, { header: true });
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `商品マスタ_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    // フォーマットダウンロード
    const handleDownloadFormat = () => {
        const formatData = [{
            オリジナルコード: 'ORG-00001',
            JANコード: '4901234567890',
            WEBコード: '123456',
            商品名: 'サンプル商品',
            規格: '100ml×10本',
            ケース入数: 10,
            仕入先CD: 'S001',
            仕入先名: '仕入先名',
            メーカーCD: 'M001',
            メーカー名: 'メーカー名',
            販売状況: ''
        }];

        const csv = Papa.unparse(formatData, { header: true });
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = '商品マスタフォーマット.csv';
        link.click();
    };

    // CSVインポート（新規追加）
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const importedProducts = [];
                const duplicateJanCodes = [];

                results.data.forEach((row, index) => {
                    const janCode = row['JANコード'] || row.janCode || '';

                    // JANコード重複チェック
                    if (checkJanCodeDuplicate(janCode)) {
                        duplicateJanCodes.push(janCode);
                        return;
                    }

                    importedProducts.push({
                        id: String(Date.now() + index),
                        originalCode: generateOriginalCode(),
                        janCode: janCode,
                        webCode: row['WEBコード'] || row.webCode || '',
                        productName: row['商品名'] || row.productName || '',
                        specification: row['規格'] || row.specification || '',
                        caseQuantity: Number(row['ケース入数'] || row.caseQuantity) || 0,
                        supplierId: row['仕入先CD'] || row.supplierId || '',
                        supplierName: row['仕入先名'] || row.supplierName || '',
                        makerId: row['メーカーCD'] || row.makerId || '',
                        makerName: row['メーカー名'] || row.makerName || '',
                        salesStatus: row['販売状況'] || row.salesStatus || ''
                    });
                });

                setProducts([...products, ...importedProducts]);

                let message = `${importedProducts.length}件の商品をインポートしました`;
                if (duplicateJanCodes.length > 0) {
                    message += `\n\n以下のJANコードは既に登録済みのためスキップしました:\n${duplicateJanCodes.join('\n')}`;
                }
                alert(message);
            },
            error: (error) => {
                alert('CSVの読み込みに失敗しました: ' + error.message);
            }
        });

        e.target.value = '';
    };

    // CSV更新（オリジナルコードをキーに更新）
    const handleUpdate = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                let updatedCount = 0;
                let addedCount = 0;
                const updatedProducts = [...products];

                results.data.forEach((row, index) => {
                    const originalCode = row['オリジナルコード'] || row.originalCode || '';
                    const existingIndex = updatedProducts.findIndex(p => p.originalCode === originalCode);

                    const productData = {
                        janCode: row['JANコード'] || row.janCode || '',
                        webCode: row['WEBコード'] || row.webCode || '',
                        productName: row['商品名'] || row.productName || '',
                        specification: row['規格'] || row.specification || '',
                        caseQuantity: Number(row['ケース入数'] || row.caseQuantity) || 0,
                        supplierId: row['仕入先CD'] || row.supplierId || '',
                        supplierName: row['仕入先名'] || row.supplierName || '',
                        makerId: row['メーカーCD'] || row.makerId || '',
                        makerName: row['メーカー名'] || row.makerName || '',
                        salesStatus: row['販売状況'] || row.salesStatus || ''
                    };

                    if (existingIndex >= 0) {
                        // 既存データを更新
                        updatedProducts[existingIndex] = {
                            ...updatedProducts[existingIndex],
                            ...productData
                        };
                        updatedCount++;
                    } else if (originalCode) {
                        // オリジナルコードがあるが見つからない場合は新規追加
                        updatedProducts.push({
                            id: String(Date.now() + index),
                            originalCode: originalCode,
                            ...productData
                        });
                        addedCount++;
                    } else {
                        // オリジナルコードがない場合は新規生成して追加
                        updatedProducts.push({
                            id: String(Date.now() + index),
                            originalCode: generateOriginalCode(),
                            ...productData
                        });
                        addedCount++;
                    }
                });

                setProducts(updatedProducts);
                alert(`更新: ${updatedCount}件\n新規追加: ${addedCount}件`);
            },
            error: (error) => {
                alert('CSVの読み込みに失敗しました: ' + error.message);
            }
        });

        e.target.value = '';
    };

    // 検索フィルターをクリア
    const clearFilters = () => {
        setSearchFilters({
            originalCode: '',
            janCode: '',
            webCode: '',
            productName: '',
            supplierId: '',
            makerId: '',
            makerName: '',
            salesStatus: ''
        });
    };

    const labelStyle = {
        fontSize: '0.8rem',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '4px',
        display: 'block'
    };

    const inputStyle = {
        fontSize: '0.85rem',
        padding: '6px 10px'
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: '10px' }}>
                <h1 style={{ fontSize: '1.5rem' }}>商品マスタ</h1>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={handleDownloadFormat} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                        📥 フォーマット
                    </button>
                    <button onClick={handleExport} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                        📤 エクスポート ({filteredProducts.length}件)
                    </button>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '0.85rem', padding: '6px 12px' }}>
                        📥 新規追加
                        <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
                    </label>
                    <label className="btn btn-warning" style={{ cursor: 'pointer', fontSize: '0.85rem', padding: '6px 12px', background: '#f59e0b', color: 'white' }}>
                        🔄 更新CSV
                        <input type="file" accept=".csv" onChange={handleUpdate} style={{ display: 'none' }} />
                    </label>
                    <button onClick={() => openModal()} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                        ➕ 新規登録
                    </button>
                </div>
            </div>

            {/* 項目別検索欄 */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>🔍 検索フィルター</span>
                    <button onClick={clearFilters} className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                        クリア
                    </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                    <div>
                        <label style={labelStyle}>オリジナルコード</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="ORG-..."
                            style={inputStyle}
                            value={searchFilters.originalCode}
                            onChange={(e) => setSearchFilters({ ...searchFilters, originalCode: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>JANコード</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="JAN検索"
                            style={inputStyle}
                            value={searchFilters.janCode}
                            onChange={(e) => setSearchFilters({ ...searchFilters, janCode: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>WEBコード</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="WEB検索"
                            style={inputStyle}
                            value={searchFilters.webCode}
                            onChange={(e) => setSearchFilters({ ...searchFilters, webCode: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>商品名</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="カナ対応"
                            style={inputStyle}
                            value={searchFilters.productName}
                            onChange={(e) => setSearchFilters({ ...searchFilters, productName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>仕入先CD</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="S001..."
                            style={inputStyle}
                            value={searchFilters.supplierId}
                            onChange={(e) => setSearchFilters({ ...searchFilters, supplierId: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>メーカーCD</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="M001..."
                            style={inputStyle}
                            value={searchFilters.makerId}
                            onChange={(e) => setSearchFilters({ ...searchFilters, makerId: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>メーカー名</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="カナ対応"
                            style={inputStyle}
                            value={searchFilters.makerName}
                            onChange={(e) => setSearchFilters({ ...searchFilters, makerName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>販売状況</label>
                        <select
                            className="form-input"
                            style={inputStyle}
                            value={searchFilters.salesStatus}
                            onChange={(e) => setSearchFilters({ ...searchFilters, salesStatus: e.target.value })}
                        >
                            <option value="">すべて</option>
                            <option value="販売中">販売中</option>
                            <option value="廃盤">廃盤</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="table-container" style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ fontSize: '0.8rem', minWidth: '1200px' }}>
                        <thead>
                            <tr>
                                <th style={{ whiteSpace: 'nowrap' }}>オリジナルCD</th>
                                <th style={{ whiteSpace: 'nowrap' }}>JANコード</th>
                                <th style={{ whiteSpace: 'nowrap' }}>WEBコード</th>
                                <th>商品名</th>
                                <th>規格</th>
                                <th style={{ whiteSpace: 'nowrap' }}>入数</th>
                                <th style={{ whiteSpace: 'nowrap' }}>仕入先CD</th>
                                <th>仕入先名</th>
                                <th style={{ whiteSpace: 'nowrap' }}>メーカーCD</th>
                                <th>メーカー名</th>
                                <th>状況</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => (
                                <tr key={product.id} style={product.salesStatus === '廃盤' ? { backgroundColor: 'var(--color-gray-100)', opacity: 0.7 } : {}}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{product.originalCode}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{product.janCode}</td>
                                    <td>{product.webCode}</td>
                                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.productName}</td>
                                    <td style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.specification}</td>
                                    <td style={{ textAlign: 'center' }}>{product.caseQuantity}</td>
                                    <td>{product.supplierId}</td>
                                    <td style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.supplierName}</td>
                                    <td>{product.makerId}</td>
                                    <td style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.makerName}</td>
                                    <td>
                                        {product.salesStatus === '廃盤' ? (
                                            <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>廃盤</span>
                                        ) : (
                                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>販売中</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button onClick={() => openModal(product)} className="btn btn-sm btn-secondary" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>編集</button>
                                            <button onClick={() => handleDelete(product.id)} className="btn btn-sm btn-danger" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>削除</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#6b7280' }}>
                    表示: {filteredProducts.length}件 / 全{products.length}件
                </div>
            </div>

            {/* モーダル */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingProduct ? '商品編集' : '新規商品登録'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        {editingProduct && (
                            <div style={{ marginBottom: 'var(--spacing-md)', padding: '10px', background: '#f3f4f6', borderRadius: '6px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>オリジナルコード: </span>
                                <strong style={{ fontFamily: 'monospace' }}>{editingProduct.originalCode}</strong>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div className="form-group">
                                <label className="form-label">JANコード <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.janCode}
                                    onChange={(e) => setFormData({ ...formData, janCode: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">WEBコード（6桁）</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    maxLength={6}
                                    placeholder="例: 123456"
                                    value={formData.webCode}
                                    onChange={(e) => setFormData({ ...formData, webCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">商品名 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.productName}
                                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">規格</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.specification}
                                    onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">ケース入数</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.caseQuantity}
                                    onChange={(e) => setFormData({ ...formData, caseQuantity: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">仕入先CD</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.supplierId}
                                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">仕入先名</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.supplierName}
                                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">メーカーCD</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.makerId}
                                    onChange={(e) => setFormData({ ...formData, makerId: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">メーカー名</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.makerName}
                                    onChange={(e) => setFormData({ ...formData, makerName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">販売状況</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.salesStatus === '廃盤'}
                                            onChange={(e) => setFormData({ ...formData, salesStatus: e.target.checked ? '廃盤' : '' })}
                                        />
                                        <span>廃盤</span>
                                    </label>
                                    {formData.salesStatus === '廃盤' && (
                                        <span className="badge badge-danger">この商品は発注不可になります</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">キャンセル</button>
                            <button onClick={handleSave} className="btn btn-primary">保存</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
