'use client';
import { useState } from 'react';
import Papa from 'papaparse';

export default function ProductMaster() {
    const [products, setProducts] = useState([
        { id: '1', janCode: '4901234567890', productName: 'サンプル商品A', specification: '100ml×10本', caseQuantity: 10, supplierId: 'S001', supplierName: '仕入先A', makerId: 'M001', makerName: 'メーカーA' },
        { id: '2', janCode: '4901234567891', productName: 'サンプル商品B', specification: '50g×20個', caseQuantity: 20, supplierId: 'S002', supplierName: '仕入先B', makerId: 'M002', makerName: 'メーカーB' },
        { id: '3', janCode: '4901234567892', productName: 'サンプル商品C', specification: '200ml×5本', caseQuantity: 5, supplierId: 'S001', supplierName: '仕入先A', makerId: 'M001', makerName: 'メーカーA' },
    ]);

    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        janCode: '',
        productName: '',
        specification: '',
        caseQuantity: '',
        supplierId: '',
        supplierName: '',
        makerId: '',
        makerName: ''
    });

    // フィルタリング
    const filteredProducts = products.filter(p =>
        p.productName.includes(searchTerm) ||
        p.janCode.includes(searchTerm) ||
        p.makerName.includes(searchTerm)
    );

    // 新規/編集モーダル表示
    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData({
                janCode: '',
                productName: '',
                specification: '',
                caseQuantity: '',
                supplierId: '',
                supplierName: '',
                makerId: '',
                makerName: ''
            });
        }
        setShowModal(true);
    };

    // 保存処理
    const handleSave = () => {
        if (editingProduct) {
            setProducts(products.map(p => p.id === editingProduct.id ? { ...formData, id: editingProduct.id } : p));
        } else {
            setProducts([...products, { ...formData, id: String(Date.now()) }]);
        }
        setShowModal(false);
    };

    // 削除処理
    const handleDelete = (id) => {
        if (confirm('この商品を削除してもよろしいですか？')) {
            setProducts(products.filter(p => p.id !== id));
        }
    };

    // CSVエクスポート
    const handleExport = () => {
        const exportData = products.map(p => ({
            JANコード: p.janCode,
            商品名: p.productName,
            規格: p.specification,
            ケース入数: p.caseQuantity,
            仕入先CD: p.supplierId,
            仕入先名: p.supplierName,
            メーカーCD: p.makerId,
            メーカー名: p.makerName
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
            JANコード: '4901234567890',
            商品名: 'サンプル商品',
            規格: '100ml×10本',
            ケース入数: 10,
            仕入先CD: 'S001',
            仕入先名: '仕入先名',
            メーカーCD: 'M001',
            メーカー名: 'メーカー名'
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

    // CSVインポート
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const importedProducts = results.data.map((row, index) => ({
                    id: String(Date.now() + index),
                    janCode: row['JANコード'] || row.janCode || '',
                    productName: row['商品名'] || row.productName || '',
                    specification: row['規格'] || row.specification || '',
                    caseQuantity: Number(row['ケース入数'] || row.caseQuantity) || 0,
                    supplierId: row['仕入先CD'] || row.supplierId || '',
                    supplierName: row['仕入先名'] || row.supplierName || '',
                    makerId: row['メーカーCD'] || row.makerId || '',
                    makerName: row['メーカー名'] || row.makerName || ''
                }));

                setProducts([...products, ...importedProducts]);
                alert(`${importedProducts.length}件の商品をインポートしました`);
            },
            error: (error) => {
                alert('CSVの読み込みに失敗しました: ' + error.message);
            }
        });

        e.target.value = '';
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h1>商品マスタ</h1>
                <div className="flex gap-sm">
                    <button onClick={handleDownloadFormat} className="btn btn-secondary">
                        📥 フォーマットDL
                    </button>
                    <button onClick={handleExport} className="btn btn-secondary">
                        📤 CSVエクスポート
                    </button>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                        📥 CSVインポート
                        <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
                    </label>
                    <button onClick={() => openModal()} className="btn btn-primary">
                        ➕ 新規登録
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="商品名、JANコード、メーカー名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>JANコード</th>
                                <th>商品名</th>
                                <th>規格</th>
                                <th>ケース入数</th>
                                <th>仕入先CD</th>
                                <th>仕入先名</th>
                                <th>メーカーCD</th>
                                <th>メーカー名</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => (
                                <tr key={product.id}>
                                    <td>{product.janCode}</td>
                                    <td>{product.productName}</td>
                                    <td>{product.specification}</td>
                                    <td>{product.caseQuantity}</td>
                                    <td>{product.supplierId}</td>
                                    <td>{product.supplierName}</td>
                                    <td>{product.makerId}</td>
                                    <td>{product.makerName}</td>
                                    <td>
                                        <div className="flex gap-sm">
                                            <button onClick={() => openModal(product)} className="btn btn-sm btn-secondary">編集</button>
                                            <button onClick={() => handleDelete(product.id)} className="btn btn-sm btn-danger">削除</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* モーダル */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingProduct ? '商品編集' : '新規商品登録'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div className="form-group">
                                <label className="form-label">JANコード</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.janCode}
                                    onChange={(e) => setFormData({ ...formData, janCode: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">商品名</label>
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
