'use client';

import Papa from 'papaparse';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import AutoFitTextField from '@/components/AutoFitTextField';
import OrderConfirmPaper from '@/components/orderPreview/OrderConfirmPaper';
import MultiRowProductTable from '@/components/productTable/MultiRowProductTable';
import {
    loadFacilityOrderTemplates,
    readStoredFacilityOrderTemplates,
    saveFacilityOrderTemplate,
    sortOrderTemplatesBySavedAt,
} from '@/lib/facilityOrderTemplates';
import { getVisibleProductTableColumns, sanitizeProductTableConfig } from '@/lib/productTableConfig';

const DEFAULT_TEXT_ALIGN = 'left';
const TEXT_ALIGN_OPTIONS = [{ value: 'left', label: '左寄せ' }, { value: 'center', label: '中央揃え' }, { value: 'right', label: '右寄せ' }];
const DEFAULT_COLUMNS = [
    { id: 'jan', label: 'JAN/商品コード', type: 'text', visible: true, width: 140 },
    { id: 'name', label: '商品名', type: 'text', visible: true, width: 220 },
    { id: 'spec', label: '内容・規格', type: 'text', visible: true, width: 140 },
    { id: 'quantity', label: '数量', type: 'number', visible: true, width: 88 },
    { id: 'unitPrice', label: '単価', type: 'number', visible: true, width: 100 },
    { id: 'subtotal', label: '金額', type: 'computed', visible: true, width: 100 },
    { id: 'remarks', label: '備考', type: 'text', visible: true, width: 150 },
];
const DEFAULT_TABLE_CONFIG = { columns: DEFAULT_COLUMNS, showTotal: true, initialRows: 5, maxRows: null, recordRowCount: 2 };
const createEmptyOrderItem = () => ({ id: uuidv4(), janCode: '', productName: '', specification: '', price: 0, quantity: 0, remarks: '', customColumns: {} });
const isMultilineField = (field) => field.type === 'textarea' || field.multiline || field.type === 'address';
const getFieldGridStyle = (field, fallbackSpan = 4) => ({ gridRow: field.row || 'auto', gridColumn: field.col ? `${field.col} / span ${field.type === 'product-table' ? 4 : (field.colSpan || fallbackSpan)}` : `span ${field.type === 'product-table' ? 4 : (field.colSpan || fallbackSpan)}` });
const hasMeaningfulOrderItem = (item) => Boolean(item.janCode || item.productName || item.specification || item.remarks || Number(item.quantity) || Object.values(item.customColumns || {}).some(Boolean));
const serializeOrderItems = (items) => items.filter(hasMeaningfulOrderItem).map(item => ({ janCode: item.janCode, productName: item.productName, specification: item.specification, price: Number(item.price) || 0, quantity: parseInt(item.quantity, 10) || 0, remarks: item.remarks || '', customColumns: item.customColumns || {} }));
const buildOrderItemsFromTemplate = (items = []) => items.map(item => ({ id: uuidv4(), janCode: item.janCode || '', productName: item.productName || '', specification: item.specification || '', price: Number(item.price) || 0, quantity: Number(item.quantity) || 0, remarks: item.remarks || '', customColumns: item.customColumns || {} }));
const buildFieldAlignments = (fields = [], template = null) => fields.reduce((acc, field) => (isMultilineField(field) ? { ...acc, [field.id]: template?.customAlignments?.[field.id] || field.textAlign || DEFAULT_TEXT_ALIGN } : acc), {});
const createOrderTemplate = (format, formValues, items, fieldAlignments, orderRemark, savedAt = new Date()) => ({ id: `TPL-${uuidv4()}`, name: `${format.name} (${savedAt.toLocaleDateString('ja-JP')} 発注)`, formatId: format.id, formatName: format.name, formatSnapshot: format, customValues: formValues, customAlignments: fieldAlignments, items: serializeOrderItems(items), orderRemark: orderRemark || '', savedAt: savedAt.toISOString() });
const readStoredOrderFormats = () => { if (typeof window === 'undefined') return []; try { return JSON.parse(localStorage.getItem('orderFormats') || '[]'); } catch { return []; } };
const mergeFormatsWithTemplateSnapshot = (formats = [], template = null) => (template?.formatSnapshot && !formats.some(item => item.id === template.formatSnapshot.id) ? [template.formatSnapshot, ...formats] : formats);
const normalizeCsvHeader = (value) => String(value || '').replace(/^\uFEFF/, '').trim();
const formatCsvDate = () => new Date().toISOString().slice(0, 10);

function getVisibleTableColumns(tableConfig = DEFAULT_TABLE_CONFIG) {
    return getVisibleProductTableColumns(tableConfig);
}

function getCsvEditableColumns(tableConfig = DEFAULT_TABLE_CONFIG) {
    return getVisibleTableColumns(tableConfig).filter(column => column.id !== 'subtotal' && column.type !== 'computed');
}

function getColumnAliases(column) {
    const aliases = [column.label, column.id];

    switch (column.id) {
        case 'jan':
            aliases.push('JANコード', 'JAN商品コード', 'janCode');
            break;
        case 'name':
            aliases.push('商品名', 'productName');
            break;
        case 'spec':
            aliases.push('内容・規格', '規格', 'specification');
            break;
        case 'quantity':
            aliases.push('数量');
            break;
        case 'unitPrice':
            aliases.push('単価', 'price');
            break;
        case 'remarks':
            aliases.push('備考');
            break;
        default:
            break;
    }

    return aliases.map(normalizeCsvHeader).filter(Boolean);
}

function getColumnCellValue(column, item) {
    switch (column.id) {
        case 'jan':
            return item.janCode || '';
        case 'name':
            return item.productName || '';
        case 'spec':
            return item.specification || '';
        case 'quantity':
            return item.quantity ?? '';
        case 'unitPrice':
            return item.price || '';
        case 'subtotal':
            return (Number(item.price) || 0) * (parseInt(item.quantity, 10) || 0) || '';
        case 'remarks':
            return item.remarks || '';
        default:
            return item.customColumns?.[column.id] || '';
    }
}

function applyColumnValue(item, column, rawValue) {
    const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;

    switch (column.id) {
        case 'jan':
            item.janCode = value || '';
            return;
        case 'name':
            item.productName = value || '';
            return;
        case 'spec':
            item.specification = value || '';
            return;
        case 'quantity':
            item.quantity = value === '' ? 0 : parseInt(value, 10) || 0;
            return;
        case 'unitPrice':
            item.price = value === '' ? 0 : Number(value) || 0;
            return;
        case 'remarks':
            item.remarks = value || '';
            return;
        case 'subtotal':
            return;
        default:
            item.customColumns = { ...item.customColumns, [column.id]: value || '' };
    }
}

function downloadCsvFile(filename, fields, data) {
    const csv = Papa.unparse({ fields, data });
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function renderEditableCell(column, item, updateRow) {
    if (column.id === 'jan') return <input type="text" className="form-input" placeholder="JAN/商品コード" value={item.janCode} onChange={(event) => updateRow(item.id, 'janCode', event.target.value)} style={{ padding: '6px', border: !item.janCode && item.quantity > 0 ? '1px solid var(--danger)' : '' }} />;
    if (column.id === 'name') return <input type="text" className="form-input" placeholder="商品名" value={item.productName} onChange={(event) => updateRow(item.id, 'productName', event.target.value)} style={{ padding: '6px' }} />;
    if (column.id === 'spec') return <input type="text" className="form-input" placeholder="内容・規格" value={item.specification} onChange={(event) => updateRow(item.id, 'specification', event.target.value)} style={{ padding: '6px' }} />;
    if (column.id === 'quantity') return <input type="number" min="0" className="form-input" value={item.quantity ?? 0} onChange={(event) => updateRow(item.id, 'quantity', event.target.value === '' ? 0 : parseInt(event.target.value, 10) || 0)} style={{ padding: '6px', textAlign: 'right' }} />;
    if (column.id === 'unitPrice') return <input type="number" min="0" className="form-input" value={item.price === 0 ? '' : item.price} onChange={(event) => updateRow(item.id, 'price', event.target.value)} style={{ padding: '6px', textAlign: 'right' }} />;
    if (column.id === 'subtotal' || column.type === 'computed') return <div style={{ fontWeight: 'bold', textAlign: 'right' }}>{(Number(item.price) * (parseInt(item.quantity, 10) || 0)).toLocaleString()}</div>;
    if (column.id === 'remarks') return <input type="text" className="form-input" value={item.remarks} onChange={(event) => updateRow(item.id, 'remarks', event.target.value)} style={{ padding: '6px' }} />;
    const customValue = item.customColumns?.[column.id] || '';
    const handleCustomChange = (value) => updateRow(item.id, 'customColumns', { ...item.customColumns, [column.id]: value });
    if (column.type === 'select') return <select className="form-input" value={customValue} onChange={(event) => handleCustomChange(event.target.value)} style={{ padding: '6px' }}><option value=""></option><option value="Option A">Option A</option><option value="Option B">Option B</option></select>;
    if (column.type === 'date') return <input type="date" className="form-input" value={customValue} onChange={(event) => handleCustomChange(event.target.value)} style={{ padding: '6px' }} />;
    if (column.type === 'number') return <input type="number" className="form-input" value={customValue} onChange={(event) => handleCustomChange(event.target.value)} style={{ padding: '6px', textAlign: 'right' }} />;
    if (column.type === 'textarea') return <textarea className="form-input" value={customValue} onChange={(event) => handleCustomChange(event.target.value)} rows="1" style={{ padding: '6px', resize: 'vertical', minHeight: '34px' }} />;
    return <input type="text" className="form-input" value={customValue} onChange={(event) => handleCustomChange(event.target.value)} style={{ padding: '6px' }} />;
}

export default function OrderPage() {
    const pathname = usePathname();
    const isConfirmMode = pathname === '/facility/order/confirm';
    const csvInputRef = useRef(null);
    const [savedFormats, setSavedFormats] = useState([]);
    const [storedTemplates, setStoredTemplates] = useState(() => readStoredFacilityOrderTemplates());
    const [selectedFormat, setSelectedFormat] = useState(null);
    const [activeTemplateId, setActiveTemplateId] = useState(null);
    const [isInitializingFormats, setIsInitializingFormats] = useState(true);
    const [formValues, setFormValues] = useState({});
    const [fieldAlignments, setFieldAlignments] = useState({});
    const [orderItems, setOrderItems] = useState([createEmptyOrderItem()]);
    const [orderRemark, setOrderRemark] = useState('');
    const [errors, setErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmEditing, setIsConfirmEditing] = useState(false);
    const isPreviewMode = isConfirmMode && !isConfirmEditing;

    function applyFormat(format, template = null) {
        const nextValues = {};
        let initialItemCount = 1;
        format.fields.forEach(field => {
            if (field.type !== 'product-table') nextValues[field.id] = template?.customValues?.[field.id] || '';
            else initialItemCount = Math.max(1, (field.tableConfig || DEFAULT_TABLE_CONFIG).initialRows || 5);
        });
        setSelectedFormat(format);
        setActiveTemplateId(template?.id || null);
        setFormValues(nextValues);
        setFieldAlignments(buildFieldAlignments(format.fields, template));
        setOrderItems(template?.items?.length ? buildOrderItemsFromTemplate(template.items) : Array.from({ length: initialItemCount }, () => createEmptyOrderItem()));
        setOrderRemark(template?.orderRemark || '');
        setErrors([]);
    }

    useEffect(() => {
        let isActive = true;

        const initializePage = async () => {
            const templateId = new URLSearchParams(window.location.search).get('template');
            const localFormats = readStoredOrderFormats();
            const localTemplates = readStoredFacilityOrderTemplates();
            const localTemplate = templateId ? localTemplates.find(item => item.id === templateId) : null;
            const initialFormats = mergeFormatsWithTemplateSnapshot(localFormats, localTemplate);

            setStoredTemplates(localTemplates);
            setSavedFormats(initialFormats);

            if (initialFormats.length > 0) {
                const initialFormat = localTemplate
                    ? initialFormats.find(item => item.id === localTemplate.formatId) || localTemplate.formatSnapshot || initialFormats[0]
                    : initialFormats[0];

                applyFormat(initialFormat, localTemplate);
            }

            setIsInitializingFormats(false);

            const templates = await loadFacilityOrderTemplates();

            if (!isActive) {
                return;
            }

            setStoredTemplates(templates);

            const template = templateId ? templates.find(item => item.id === templateId) : null;
            const nextFormats = mergeFormatsWithTemplateSnapshot(initialFormats, template);

            setSavedFormats(nextFormats);

            if (!nextFormats.length) {
                return;
            }

            const initialFormat = template
                ? nextFormats.find(item => item.id === template.formatId) || template.formatSnapshot || nextFormats[0]
                : nextFormats[0];

            if (template || !localTemplate) {
                applyFormat(initialFormat, template);
            }
        };

        initializePage();

        return () => {
            isActive = false;
        };
    }, []);

    const handleFormatChange = (event) => { const format = savedFormats.find(item => item.id === event.target.value); if (format) applyFormat(format); };
    const handleFieldChange = (fieldId, value) => setFormValues(prev => ({ ...prev, [fieldId]: value }));
    const handleAlignmentChange = (fieldId, alignment) => setFieldAlignments(prev => ({ ...prev, [fieldId]: alignment }));
    const addRow = () => { const tableConfig = selectedFormat?.fields.find(field => field.type === 'product-table')?.tableConfig || DEFAULT_TABLE_CONFIG; if (tableConfig.maxRows && orderItems.length >= tableConfig.maxRows) return alert(`行の追加は最大 ${tableConfig.maxRows} 行までです。`); setOrderItems(prev => [...prev, createEmptyOrderItem()]); };
    const removeRow = (id) => { if (orderItems.length > 1) setOrderItems(prev => prev.filter(item => item.id !== id)); };
    const updateRow = (id, field, value) => setOrderItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    const openCsvPicker = () => csvInputRef.current?.click();
    const subtotal = orderItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * (parseInt(item.quantity, 10) || 0)), 0);
    const tax = Math.floor(subtotal * 0.10);
    const totalAmount = subtotal + tax;

    const handleExportCsv = () => {
        const tableConfig = selectedFormat?.fields.find(field => field.type === 'product-table')?.tableConfig || DEFAULT_TABLE_CONFIG;
        const exportColumns = getVisibleTableColumns(tableConfig);
        const itemsToExport = orderItems.filter(hasMeaningfulOrderItem);

        if (!itemsToExport.length) {
            alert('書き出す商品明細がありません。');
            return;
        }

        const data = itemsToExport.map(item => exportColumns.map(column => getColumnCellValue(column, item)));
        downloadCsvFile(`${selectedFormat?.name || '発注書'}_商品明細_${formatCsvDate()}.csv`, exportColumns.map(column => column.label), data);
    };

    const handleDownloadCsvTemplate = () => {
        const tableConfig = selectedFormat?.fields.find(field => field.type === 'product-table')?.tableConfig || DEFAULT_TABLE_CONFIG;
        const templateColumns = getCsvEditableColumns(tableConfig);
        downloadCsvFile('商品明細取込フォーマット.csv', templateColumns.map(column => column.label), []);
    };

    const handleImportCsv = (event) => {
        const file = event.target.files?.[0];

        if (!file || !selectedFormat) return;

        const tableConfig = selectedFormat.fields.find(field => field.type === 'product-table')?.tableConfig || DEFAULT_TABLE_CONFIG;
        const importColumns = getCsvEditableColumns(tableConfig);
        const headerMap = new Map();

        importColumns.forEach(column => {
            getColumnAliases(column).forEach(alias => headerMap.set(alias, column));
        });

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: ({ data, errors: parseErrors }) => {
                event.target.value = '';

                if (parseErrors?.length) {
                    alert('CSVの読み込みに失敗しました。ファイル形式を確認してください。');
                    return;
                }

                const importedItems = data.reduce((acc, row) => {
                    const nextItem = createEmptyOrderItem();

                    Object.entries(row || {}).forEach(([header, value]) => {
                        const column = headerMap.get(normalizeCsvHeader(header));
                        if (column) applyColumnValue(nextItem, column, value);
                    });

                    if (hasMeaningfulOrderItem(nextItem)) acc.push(nextItem);
                    return acc;
                }, []);

                if (!importedItems.length) {
                    alert('取り込める商品明細がありませんでした。');
                    return;
                }

                const maxRows = tableConfig.maxRows;
                const nextItems = maxRows ? importedItems.slice(0, maxRows) : importedItems;
                setOrderItems(nextItems);

                if (maxRows && importedItems.length > maxRows) {
                    alert(`CSVを取り込みました。最大行数 ${maxRows} 行を超えたため、先頭 ${maxRows} 行のみ反映しています。`);
                    return;
                }

                alert(`${nextItems.length}件の商品明細を取り込みました。`);
            },
            error: () => {
                event.target.value = '';
                alert('CSVの読み込みに失敗しました。');
            },
        });
    };

    const getValidationErrors = () => {
        if (!selectedFormat) return { validationErrors: ['発注フォーマットが選択されていません。'], validItems: [] };
        const validationErrors = [];
        selectedFormat.fields.forEach(field => { if (field.required && field.type !== 'product-table' && !formValues[field.id]) validationErrors.push(`「${field.label}」は必須項目です。`); });
        const validItems = orderItems.filter(item => item.janCode && Number(item.quantity) > 0);
        if (!validItems.length) validationErrors.push('商品明細を1行以上入力し、数量を設定してください。');
        return { validationErrors, validItems };
    };

    const persistEditedTemplate = async () => {
        if (!activeTemplateId || !selectedFormat) return { savedRemotely: false };

        const currentTemplate = storedTemplates.find(template => template.id === activeTemplateId);
        const nextTemplate = {
            ...currentTemplate,
            id: activeTemplateId,
            formatId: selectedFormat.id,
            formatName: selectedFormat.name,
            formatSnapshot: selectedFormat,
            customValues: formValues,
            customAlignments: fieldAlignments,
            items: serializeOrderItems(orderItems),
            orderRemark: orderRemark || '',
            savedAt: new Date().toISOString(),
        };

        const result = await saveFacilityOrderTemplate(nextTemplate);
        setStoredTemplates(templates => sortOrderTemplatesBySavedAt([
            result.template,
            ...templates.filter(template => template.id !== result.template.id),
        ]));
        return result;
    };

    const handleConfirmEditSave = async () => {
        setIsSubmitting(true);
        const result = await persistEditedTemplate();
        setIsSubmitting(false);
        setErrors([]);
        setIsConfirmEditing(false);

        if (result?.template) {
            alert(result.savedRemotely ? '編集内容を保存しました。' : '編集内容をローカルに保存しました。Firebase への保存は失敗しました。');
        }
    };

    const handleSubmit = async () => {
        const { validationErrors, validItems } = getValidationErrors();
        if (validationErrors.length) { setErrors(validationErrors); window.scrollTo(0, 0); return; }
        setErrors([]); setIsSubmitting(true);
        if (isConfirmMode) alert('発注書送付トリガーを実行しました。API 連携はこのボタンに接続予定です。');
        else {
            const result = await saveFacilityOrderTemplate(
                createOrderTemplate(selectedFormat, formValues, validItems, fieldAlignments, orderRemark),
            );

            setStoredTemplates(templates => sortOrderTemplatesBySavedAt([
                result.template,
                ...templates.filter(template => template.id !== result.template.id),
            ]));

            alert(result.savedRemotely ? '「いつもの注文」に保存しました。' : '「いつもの注文」をローカルに保存しました。Firebase への保存は失敗しました。');
            applyFormat(selectedFormat);
        }
        setIsSubmitting(false);
    };

    const primaryAction = isConfirmMode && isConfirmEditing ? handleConfirmEditSave : handleSubmit;
    const primaryLabel = isConfirmMode ? (isConfirmEditing ? '編集内容を保存' : '発注書送付') : '発注書を保存';
    const primaryClass = isConfirmMode && !isConfirmEditing ? 'btn btn-warning' : 'btn btn-primary';
    const primaryLoadingLabel = isConfirmMode && !isConfirmEditing ? '送付準備中...' : '保存中...';

    if (isInitializingFormats) return <div className="card" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}><p className="text-muted mb-md">発注フォーマットを読み込み中です。</p></div>;
    if (!selectedFormat) return <div className="card" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}><p className="text-muted mb-md">利用できる発注フォーマットがありません。</p><p>「設定 &gt; 発注書設定」からフォーマットを作成してください。</p></div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className={isConfirmMode ? 'order-page-toolbar' : undefined} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)', gap: '12px', flexWrap: 'wrap' }}>
                <h1>{isConfirmMode ? '発注確認' : '発注書作成'}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {isConfirmMode && <button type="button" className="btn btn-secondary" onClick={() => setIsConfirmEditing(prev => !prev)}>{isConfirmEditing ? 'プレビューに戻る' : '編集'}</button>}
                    <select className="form-input" value={selectedFormat?.id || ''} onChange={handleFormatChange} style={{ width: '250px' }}>{savedFormats.map(format => <option key={format.id} value={format.id}>{format.name}</option>)}</select>
                </div>
            </div>

            {errors.length > 0 && <div className="alert alert-danger" style={{ marginBottom: 'var(--spacing-lg)', display: 'block' }}><strong>入力内容を確認してください。</strong><ul style={{ margin: '8px 0 0 20px' }}>{errors.map((error, index) => <li key={index}>{error}</li>)}</ul></div>}

            {isPreviewMode ? (
                <>
                    <OrderConfirmPaper format={selectedFormat} formValues={formValues} fieldAlignments={fieldAlignments} orderItems={orderItems} orderRemark={orderRemark} subtotal={subtotal} tax={tax} totalAmount={totalAmount} defaultTableConfig={DEFAULT_TABLE_CONFIG} />
                    <div className="order-preview-actions"><button type="button" className={primaryClass} onClick={primaryAction} disabled={isSubmitting} style={{ padding: '12px 40px', fontSize: '1.1rem', boxShadow: '0 4px 6px rgba(217, 119, 6, 0.25)' }}>{isSubmitting ? primaryLoadingLabel : primaryLabel}</button><p className="text-muted mt-sm" style={{ fontSize: '0.85rem' }}>このボタンを API 連携のトリガーとして利用する想定です。</p></div>
                </>
            ) : (
                <div className="card" style={{ padding: 'var(--spacing-xl)', background: '#fff' }}>
                    <h2 style={{ textAlign: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: '10px', marginBottom: '30px' }}>発注書</h2>
                    <div className="dynamic-form-grid">
                        {selectedFormat.fields.map(field => {
                            if (field.type === 'product-table') {
                                const tableConfig = sanitizeProductTableConfig(field.tableConfig || DEFAULT_TABLE_CONFIG);
                                const visibleCols = getVisibleTableColumns(tableConfig);
                                const useMultiRowLayout = tableConfig.recordRowCount > 1;
                                if (useMultiRowLayout) {
                                    return (
                                        <div key={field.id} className="form-section field-block-wrapper" style={getFieldGridStyle(field, 4)}>
                                            <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {'\u5546\u54c1\u660e\u7d30'} <span className="req-badge">{'\u5fc5\u9808'}</span>
                                            </h3>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    <button type="button" onClick={openCsvPicker} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>{'CSV\u53d6\u8fbc'}</button>
                                                    <button type="button" onClick={handleExportCsv} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>{'CSV\u51fa\u529b'}</button>
                                                    <button type="button" onClick={handleDownloadCsvTemplate} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>{'\u30d5\u30a9\u30fc\u30de\u30c3\u30c8DL'}</button>
                                                    <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={handleImportCsv} style={{ display: 'none' }} />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                                    <button type="button" onClick={addRow} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>{'+ \u884c\u3092\u8ffd\u52a0'}</button>
                                                    {tableConfig.maxRows && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({'\u6700\u5927'} {tableConfig.maxRows} {'\u884c'})</span>}
                                                </div>
                                            </div>
                                            <MultiRowProductTable
                                                tableConfig={tableConfig}
                                                rows={orderItems}
                                                getRowKey={(item) => item.id}
                                                renderHeaderCell={(column) => <>{column.label} {column.id === 'jan' || column.id === 'quantity' ? <span className="req">*</span> : ''}</>}
                                                renderCell={(column, item) => renderEditableCell(column, item, updateRow)}
                                                renderAction={(item) => (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRow(item.id)}
                                                        className="mrpt-remove-button"
                                                        title={'\u884c\u3092\u524a\u9664'}
                                                    >
                                                        {'\u00d7'}
                                                    </button>
                                                )}
                                            />
                                            <div style={{ marginTop: '16px', background: '#fafafa', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>{'\u5099\u8003'}</label>
                                                <textarea className="form-input" rows="4" placeholder={'\u5546\u54c1\u660e\u7d30\u306b\u95a2\u3059\u308b\u88dc\u8db3\u4e8b\u9805\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044'} value={orderRemark} onChange={(event) => setOrderRemark(event.target.value)} style={{ resize: 'vertical', lineHeight: 1.5 }} />
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={field.id} className="form-section field-block-wrapper" style={getFieldGridStyle(field, 4)}>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            商品明細 <span className="req-badge">必須</span>
                                        </h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <button type="button" onClick={openCsvPicker} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>CSV取込</button>
                                                <button type="button" onClick={handleExportCsv} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>CSV書出</button>
                                                <button type="button" onClick={handleDownloadCsvTemplate} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>フォーマットDL</button>
                                                <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={handleImportCsv} style={{ display: 'none' }} />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                                <button type="button" onClick={addRow} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>+ 行を追加</button>
                                                {tableConfig.maxRows && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(最大 {tableConfig.maxRows} 行)</span>}
                                            </div>
                                        </div>
                                        <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                                            <table className="order-table" style={{ margin: 0, minWidth: '100%' }}>
                                                <thead style={{ background: '#f8fafc' }}>
                                                    <tr>
                                                        <th style={{ width: '40px', textAlign: 'center' }}>No</th>
                                                        {visibleCols.map(column => (
                                                            <th
                                                                key={column.id}
                                                                style={{ width: column.width ? `${column.width}px` : 'auto', minWidth: column.width ? `${column.width}px` : '100px' }}
                                                            >
                                                                {column.label} {column.id === 'jan' || column.id === 'quantity' ? <span className="req">*</span> : ''}
                                                            </th>
                                                        ))}
                                                        <th style={{ width: '50px', textAlign: 'center' }}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orderItems.map((item, index) => (
                                                        <tr key={item.id}>
                                                            <td style={{ textAlign: 'center', background: '#f8fafc', fontWeight: 'bold' }}>{index + 1}</td>
                                                            {visibleCols.map(column => (
                                                                <td key={column.id} style={{ verticalAlign: 'top' }}>
                                                                    {renderEditableCell(column, item, updateRow)}
                                                                </td>
                                                            ))}
                                                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                                <button type="button" onClick={() => removeRow(item.id)} style={{ padding: '4px', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }} title="行を削除">×</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div style={{ marginTop: '16px', background: '#fafafa', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>備考</label>
                                            <textarea className="form-input" rows="4" placeholder="商品明細に関する補足事項を入力してください" value={orderRemark} onChange={(event) => setOrderRemark(event.target.value)} style={{ resize: 'vertical', lineHeight: 1.5 }} />
                                        </div>
                                    </div>
                                );
                            }
                            if (field.type === 'spacer') return <div key={field.id} style={{ ...getFieldGridStyle(field, 1), minHeight: '1px' }} />;
                            const isError = field.required && !formValues[field.id] && errors.length > 0;
                            const multiline = isMultilineField(field);
                            const textAlign = fieldAlignments[field.id] || field.textAlign || DEFAULT_TEXT_ALIGN;
                            const rows = field.rows || (field.type === 'address' ? 4 : 3);
                            return <div key={field.id} className="form-group" style={{ ...getFieldGridStyle(field, field.colSpan || 4), background: '#fafafa', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}><label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold', marginBottom: '8px' }}>{field.label}{field.required && <span className="req-badge">必須</span>}</label>{multiline && <div className="order-text-align-controls">{TEXT_ALIGN_OPTIONS.map(option => <button key={option.value} type="button" className={`order-text-align-button ${textAlign === option.value ? 'active' : ''}`} onClick={() => handleAlignmentChange(field.id, option.value)}>{option.label}</button>)}</div>}{multiline ? <AutoFitTextField as="textarea" className="form-input" placeholder={field.placeholder} rows={rows} value={formValues[field.id] || ''} onChange={(event) => handleFieldChange(field.id, event.target.value)} multiline minFontSize={10} style={{ resize: 'vertical', lineHeight: 1.4, textAlign, ...(isError ? { borderColor: 'var(--danger)', background: '#fef2f2' } : {}) }} /> : field.type === 'date' ? <input type="date" className="form-input" value={formValues[field.id] || ''} onChange={(event) => handleFieldChange(field.id, event.target.value)} style={isError ? { borderColor: 'var(--danger)', background: '#fef2f2' } : {}} /> : field.type === 'select' ? <select className="form-input" value={formValues[field.id] || ''} onChange={(event) => handleFieldChange(field.id, event.target.value)} style={isError ? { borderColor: 'var(--danger)', background: '#fef2f2' } : {}}><option value="">選択してください</option>{field.options?.map((option, index) => <option key={index} value={option}>{option}</option>)}</select> : <AutoFitTextField className="form-input" placeholder={field.placeholder} value={formValues[field.id] || ''} onChange={(event) => handleFieldChange(field.id, event.target.value)} minFontSize={10} style={isError ? { borderColor: 'var(--danger)', background: '#fef2f2' } : {}} />}</div>;
                        })}
                    </div>
                    <div style={{ marginTop: '40px', textAlign: 'center' }}><button type="button" className={primaryClass} onClick={primaryAction} disabled={isSubmitting} style={{ padding: '12px 40px', fontSize: '1.1rem' }}>{isSubmitting ? primaryLoadingLabel : primaryLabel}</button><p className="text-muted mt-sm" style={{ fontSize: '0.85rem' }}>{isConfirmMode ? '編集内容を保存すると、この画面のプレビューへ反映されます。' : '保存した内容は「いつもの注文」から再利用できます。'}</p></div>
                </div>
            )}

        </div>
    );
}
