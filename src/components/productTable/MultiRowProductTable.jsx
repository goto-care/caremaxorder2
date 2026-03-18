'use client';

import {
    getProductTableLayoutSlots,
    getProductTableSlotGridTemplate,
    getVisibleProductTableColumns,
    sanitizeProductTableConfig,
} from '@/lib/productTableConfig';

function getSlotSegments(slotColumns = []) {
    const segments = [];
    let currentRowIndex = 0;

    while (currentRowIndex < slotColumns.length) {
        const column = slotColumns[currentRowIndex];
        let nextRowIndex = currentRowIndex + 1;

        while (nextRowIndex < slotColumns.length && !slotColumns[nextRowIndex]) {
            nextRowIndex += 1;
        }

        segments.push({
            column,
            rowStart: currentRowIndex + 1,
            rowSpan: nextRowIndex - currentRowIndex,
        });

        currentRowIndex = nextRowIndex;
    }

    return segments;
}

function renderSlotCells(slot, slotIndex, renderContent, keyPrefix, extraClassName = '') {
    return getSlotSegments(slot.columns).map((segment, segmentIndex) => {
        const cellKey = `${keyPrefix}-slot-${slotIndex + 1}-segment-${segmentIndex + 1}`;
        const className = ['mrpt-cell', extraClassName, !segment.column ? 'mrpt-empty-slot' : '', segment.rowSpan > 1 ? 'mrpt-cell-rowspan' : ''].filter(Boolean).join(' ');
        const style = {
            gridColumn: slotIndex + 1,
            gridRow: `${segment.rowStart} / span ${segment.rowSpan}`,
        };

        if (!segment.column) {
            return <div key={cellKey} className={className} style={style} aria-hidden="true" />;
        }

        return (
            <div key={cellKey} className={className} style={style}>
                {renderContent(segment.column, {
                    rowStart: segment.rowStart,
                    rowSpan: segment.rowSpan,
                    slotIndex,
                })}
            </div>
        );
    });
}

export default function MultiRowProductTable({
    tableConfig,
    rows,
    getRowKey,
    renderCell,
    renderAction,
    renderHeaderCell,
    renderNumberCell,
    renderHeaderAction,
    className = '',
    emptyMessage = '\u8868\u793a\u3059\u308b\u30ec\u30b3\u30fc\u30c9\u304c\u3042\u308a\u307e\u305b\u3093\u3002',
}) {
    const safeConfig = sanitizeProductTableConfig(tableConfig);
    const visibleColumns = getVisibleProductTableColumns(safeConfig);
    const layoutSlots = getProductTableLayoutSlots(visibleColumns, safeConfig.recordRowCount);
    const gridTemplateColumns = getProductTableSlotGridTemplate(layoutSlots);
    const hasActionColumn = typeof renderAction === 'function';
    const safeRows = Array.isArray(rows) ? rows : [];
    const wrapperClassName = ['multi-row-product-table', hasActionColumn ? 'has-action-column' : '', className].filter(Boolean).join(' ');
    const gridStyle = {
        gridTemplateColumns: gridTemplateColumns || 'minmax(0, 1fr)',
        gridTemplateRows: `repeat(${safeConfig.recordRowCount}, minmax(0, auto))`,
    };

    return (
        <div className={wrapperClassName}>
            <div className="mrpt-record mrpt-record-header">
                <div className="mrpt-number-cell">{typeof renderNumberCell === 'function' ? renderNumberCell(null, -1, true) : 'No'}</div>
                <div className="mrpt-main mrpt-main-grid" style={gridStyle}>
                    {layoutSlots.flatMap((slot, slotIndex) => renderSlotCells(
                        slot,
                        slotIndex,
                        (column, segment) => (
                            typeof renderHeaderCell === 'function'
                                ? renderHeaderCell(column, segment.rowStart - 1)
                                : column.label
                        ),
                        'header',
                        'mrpt-header-cell'
                    ))}
                </div>
                {hasActionColumn && <div className="mrpt-action-cell mrpt-action-header">{renderHeaderAction || null}</div>}
            </div>

            <div className="mrpt-record-list">
                {safeRows.length === 0 ? (
                    <div className="mrpt-empty">{emptyMessage}</div>
                ) : (
                    safeRows.map((row, rowIndex) => (
                        <div
                            key={typeof getRowKey === 'function' ? getRowKey(row, rowIndex) : rowIndex}
                            className={`mrpt-record mrpt-record-body ${rowIndex % 2 === 0 ? 'is-even' : 'is-odd'}`}
                        >
                            <div className="mrpt-number-cell">{typeof renderNumberCell === 'function' ? renderNumberCell(row, rowIndex, false) : rowIndex + 1}</div>
                            <div className="mrpt-main mrpt-main-grid" style={gridStyle}>
                                {layoutSlots.flatMap((slot, slotIndex) => renderSlotCells(
                                    slot,
                                    slotIndex,
                                    (column, segment) => renderCell(column, row, {
                                        rowIndex,
                                        displayRowIndex: segment.rowStart,
                                        rowSpan: segment.rowSpan,
                                        slotIndex,
                                    }),
                                    typeof getRowKey === 'function' ? getRowKey(row, rowIndex) : `row-${rowIndex + 1}`
                                ))}
                            </div>
                            {hasActionColumn && <div className="mrpt-action-cell">{renderAction(row, rowIndex)}</div>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
