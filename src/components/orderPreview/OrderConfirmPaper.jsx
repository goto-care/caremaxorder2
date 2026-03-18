'use client';

import MultiRowProductTable from '@/components/productTable/MultiRowProductTable';
import { sanitizeProductTableConfig } from '@/lib/productTableConfig';

const DEFAULT_TEXT_ALIGN = 'left';

function getGridStyle(field, fallbackSpan = 4) {
    const colSpan = field.type === 'product-table' ? 4 : (field.colSpan || fallbackSpan);

    return {
        gridRow: field.row || 'auto',
        gridColumn: field.col ? `${field.col} / span ${colSpan}` : `span ${colSpan}`,
    };
}

function formatDateValue(value) {
    if (!value) return '';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleDateString('ja-JP');
}

function formatFieldValue(field, value) {
    if (!value) return '';
    if (field.type === 'date') return formatDateValue(value);
    return value;
}

function hasOrderItemContent(item) {
    return Boolean(
        item.janCode ||
        item.productName ||
        item.specification ||
        item.remarks ||
        Number(item.quantity) ||
        Object.values(item.customColumns || {}).some(Boolean)
    );
}

function formatTableCell(col, item) {
    const customValue = item.customColumns?.[col.id] || '';

    switch (col.id) {
        case 'jan':
            return item.janCode || '';
        case 'name':
            return item.productName || '';
        case 'spec':
            return item.specification || '';
        case 'quantity':
            return item.quantity === '' || item.quantity === null || typeof item.quantity === 'undefined'
                ? ''
                : Number(item.quantity).toLocaleString();
        case 'unitPrice':
            return item.price ? Number(item.price).toLocaleString() : '';
        case 'subtotal':
            return item.price && item.quantity
                ? (Number(item.price) * Number(item.quantity)).toLocaleString()
                : '';
        case 'remarks':
            return item.remarks || '';
        default:
            if (col.type === 'date') return formatDateValue(customValue);
            if (col.type === 'number') return customValue ? Number(customValue).toLocaleString() : '';
            return customValue;
    }
}

function getCellAlign(col) {
    if (col.id === 'quantity' || col.id === 'unitPrice' || col.id === 'subtotal' || col.type === 'number') {
        return 'right';
    }

    return 'left';
}

export default function OrderConfirmPaper({
    format,
    formValues,
    fieldAlignments,
    orderItems,
    orderRemark,
    subtotal,
    tax,
    totalAmount,
    defaultTableConfig,
}) {
    const tableField = format.fields.find(field => field.type === 'product-table');
    const tableConfig = sanitizeProductTableConfig(tableField?.tableConfig || defaultTableConfig);
    const visibleCols = tableConfig.columns.filter(column => column.visible);
    const filledItems = orderItems.filter(hasOrderItemContent);
    const previewItems = filledItems.length > 0 ? filledItems : orderItems.slice(0, 1);
    const issuedOn = new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="order-confirm-preview-shell">
            <div className="order-paper-preview">
                <div className="order-paper-header">
                    <div className="order-paper-meta">
                        <span>確認用プレビュー</span>
                        <span>発行日: {issuedOn}</span>
                    </div>
                    <h2 className="order-paper-title">発注書</h2>
                    <p className="order-paper-subtitle">{format.name}</p>
                </div>

                <div className="dynamic-form-grid order-paper-grid">
                    {format.fields.map(field => {
                        if (field.type === 'spacer') {
                            return <div key={field.id} style={getGridStyle(field, 1)} />;
                        }

                        if (field.type === 'product-table') {
                            const useMultiRowLayout = tableConfig.recordRowCount > 1;

                            if (useMultiRowLayout) {
                                return (
                                    <section key={field.id} className="order-paper-table-section" style={getGridStyle(field, 4)}>
                                        <div className="order-paper-section-header">
                                            <span>{'\u5546\u54c1\u660e\u7d30'}</span>
                                            <span>{previewItems.length} {'\u884c'}</span>
                                        </div>

                                        <MultiRowProductTable
                                            tableConfig={tableConfig}
                                            rows={previewItems}
                                            getRowKey={(item) => item.id}
                                            renderCell={(col, item) => {
                                                const cellValue = formatTableCell(col, item);

                                                return (
                                                    <div
                                                        className={col.type === 'textarea' ? 'order-paper-cell-multiline' : undefined}
                                                        style={{ textAlign: getCellAlign(col) }}
                                                    >
                                                        {cellValue || ' '}
                                                    </div>
                                                );
                                            }}
                                            className="order-paper-record-table"
                                        />

                                        {tableConfig.showTotal !== false && (
                                            <div className="order-paper-summary">
                                                <div>
                                                    <span>{'\u5c0f\u8a08'}</span>
                                                    <strong>{subtotal.toLocaleString()} {'\u5186'}</strong>
                                                </div>
                                                <div>
                                                    <span>{'\u6d88\u8cbb\u7a0e'}</span>
                                                    <strong>{tax.toLocaleString()} {'\u5186'}</strong>
                                                </div>
                                                <div className="order-paper-summary-total">
                                                    <span>{'\u5408\u8a08'}</span>
                                                    <strong>{totalAmount.toLocaleString()} {'\u5186'}</strong>
                                                </div>
                                            </div>
                                        )}

                                        <div className="order-paper-field">
                                            <div className="order-paper-field-label">
                                                <span>{'\u5099\u8003'}</span>
                                            </div>
                                            <div className={`order-paper-field-value ${!orderRemark ? 'is-empty' : ''}`} style={{ minHeight: '120px' }}>
                                                {orderRemark || ' '}
                                            </div>
                                        </div>
                                    </section>
                                );
                            }

                            return (
                                <section key={field.id} className="order-paper-table-section" style={getGridStyle(field, 4)}>
                                    <div className="order-paper-section-header">
                                        <span>商品明細</span>
                                        <span>{previewItems.length} 行</span>
                                    </div>

                                    <div className="order-paper-table-wrap">
                                        <table className="order-table order-paper-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '52px', textAlign: 'center' }}>No</th>
                                                    {visibleCols.map(col => (
                                                        <th
                                                            key={col.id}
                                                            style={{
                                                                width: col.width ? `${col.width}px` : 'auto',
                                                                minWidth: col.width ? `${col.width}px` : '88px',
                                                            }}
                                                        >
                                                            {col.label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewItems.map((item, index) => (
                                                    <tr key={item.id}>
                                                        <td className="order-paper-row-no">{index + 1}</td>
                                                        {visibleCols.map(col => {
                                                            const cellValue = formatTableCell(col, item);

                                                            return (
                                                                <td
                                                                    key={col.id}
                                                                    style={{ textAlign: getCellAlign(col) }}
                                                                >
                                                                    <div className={col.type === 'textarea' ? 'order-paper-cell-multiline' : undefined}>
                                                                        {cellValue || ' '}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {tableConfig.showTotal !== false && (
                                        <div className="order-paper-summary">
                                            <div>
                                                <span>小計</span>
                                                <strong>{subtotal.toLocaleString()} 円</strong>
                                            </div>
                                            <div>
                                                <span>消費税</span>
                                                <strong>{tax.toLocaleString()} 円</strong>
                                            </div>
                                            <div className="order-paper-summary-total">
                                                <span>合計</span>
                                                <strong>{totalAmount.toLocaleString()} 円</strong>
                                            </div>
                                        </div>
                                    )}

                                    <div className="order-paper-field">
                                        <div className="order-paper-field-label">
                                            <span>備考</span>
                                        </div>
                                        <div className={`order-paper-field-value ${!orderRemark ? 'is-empty' : ''}`} style={{ minHeight: '120px' }}>
                                            {orderRemark || ' '}
                                        </div>
                                    </div>
                                </section>
                            );
                        }

                        const isMultiline = field.type === 'textarea' || field.multiline || field.type === 'address';
                        const fieldValue = formatFieldValue(field, formValues[field.id] || '');
                        const valueStyle = isMultiline
                            ? { textAlign: fieldAlignments?.[field.id] || field.textAlign || DEFAULT_TEXT_ALIGN }
                            : undefined;

                        return (
                            <section key={field.id} className="order-paper-field" style={getGridStyle(field, field.colSpan || 4)}>
                                <div className="order-paper-field-label">
                                    <span>{field.label}</span>
                                    {field.required && <span className="order-paper-required">必須</span>}
                                </div>
                                <div
                                    className={`order-paper-field-value ${!fieldValue ? 'is-empty' : ''}`}
                                    style={valueStyle}
                                >
                                    {fieldValue || ' '}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
