'use client';

import { useRef, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    getProductTableLayoutSlots,
    getProductTableLayoutRows,
    getProductTableSlotGridTemplate,
    sanitizeProductTableConfig,
} from '@/lib/productTableConfig';

function SortableColumnHeader({ column, isActive, onSelect, onResize }) {
    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging,
    } = useSortable({ id: column.id });

    const resizeRef = useRef(null);

    const handleResizeStart = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        const startX = event.clientX;
        const startWidth = column.width;

        const handleMouseMove = (moveEvent) => {
            const diff = moveEvent.clientX - startX;
            onResize(column.id, startWidth + diff);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [column.id, column.width, onResize]);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`tc-header-chip ${isActive ? 'is-active' : ''} ${isDragging ? 'is-dragging' : ''}`}
            onClick={() => onSelect(column.id)}
        >
            <div className="tc-header-chip-content" {...attributes} {...listeners} style={{ touchAction: 'none' }}>
                {column.locked && <span className="tc-lock-icon" title={'\u56fa\u5b9a\u5217'}>L</span>}
                <span className="tc-th-label">{column.label}</span>
            </div>
            <div
                ref={resizeRef}
                className="tc-resize-handle"
                onMouseDown={handleResizeStart}
            />
        </div>
    );
}

function HeaderDropRow({ rowIndex, rowSlots, gridTemplateColumns, activeColumnId, onSelectColumn, onColumnResize }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `row-drop-${rowIndex}`,
        data: { type: 'row-drop', rowIndex },
    });

    const hasColumns = rowSlots.some(Boolean);

    return (
        <div
            ref={setNodeRef}
            className={`mrpt-grid-row ${rowIndex > 1 ? 'is-sub-row' : ''} tc-header-drop-row ${isOver ? 'is-over' : ''} ${!hasColumns ? 'is-empty' : ''}`}
            style={{ gridTemplateColumns: gridTemplateColumns || 'minmax(0, 1fr)' }}
        >
            {hasColumns ? (
                rowSlots.map((column, slotIndex) => (
                    column ? (
                        <div key={column.id} className="mrpt-cell mrpt-header-cell">
                            <SortableColumnHeader
                                column={column}
                                isActive={column.id === activeColumnId}
                                onSelect={onSelectColumn}
                                onResize={onColumnResize}
                            />
                        </div>
                    ) : (
                        <EmptyDropSlot key={`empty-header-${rowIndex}-${slotIndex}`} rowIndex={rowIndex} slotIndex={slotIndex} />
                    )
                ))
            ) : (
                <div className="mrpt-cell mrpt-header-cell tc-empty-drop-cell" style={{ gridColumn: '1 / -1' }}>{'\u3053\u3053\u306b\u5217\u3092\u79fb\u52d5'}</div>
            )}
        </div>
    );
}

function EmptyDropSlot({ rowIndex, slotIndex }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `row-drop-${rowIndex}-slot-${slotIndex}`,
        data: { type: 'row-drop', rowIndex },
    });

    return (
        <div
            ref={setNodeRef}
            className={`mrpt-cell mrpt-header-cell tc-empty-slot ${isOver ? 'is-over' : ''}`}
            aria-hidden="true"
        />
    );
}

function renderCellPlaceholder(column) {
    switch (column.type) {
        case 'number':
        case 'computed':
            return <span className="tc-cell-placeholder tc-cell-number">0</span>;
        case 'date':
            return <span className="tc-cell-placeholder">____/__/__</span>;
        case 'select':
            return <span className="tc-cell-placeholder">...</span>;
        case 'textarea':
            return <span className="tc-cell-placeholder tc-cell-textarea">...</span>;
        default:
            return <span className="tc-cell-placeholder">&nbsp;</span>;
    }
}

export default function TablePreview({ columns, initialRows, showTotal, activeColumnId, onSelectColumn, onColumnResize, recordRowCount = 2 }) {
    const safeConfig = sanitizeProductTableConfig({ columns, initialRows, showTotal, recordRowCount });
    const visibleColumns = safeConfig.columns.filter(column => column.visible);
    const layoutSlots = getProductTableLayoutSlots(visibleColumns, safeConfig.recordRowCount);
    const gridTemplateColumns = getProductTableSlotGridTemplate(layoutSlots);
    const layoutRows = getProductTableLayoutRows(visibleColumns, safeConfig.recordRowCount);
    const rowCount = Math.max(1, initialRows || 5);

    return (
        <div className="tc-table-wrapper">
            <SortableContext items={visibleColumns.map(column => column.id)} strategy={rectSortingStrategy}>
                <div className="multi-row-product-table tc-multi-row-preview">
                    <div className="mrpt-record mrpt-record-header">
                        <div className="mrpt-number-cell">No</div>
                        <div className="mrpt-main">
                            {layoutRows.map((rowSlots, rowIndex) => (
                                <HeaderDropRow
                                    key={`header-row-${rowIndex + 1}`}
                                    rowIndex={rowIndex + 1}
                                    rowSlots={rowSlots}
                                    gridTemplateColumns={gridTemplateColumns}
                                    activeColumnId={activeColumnId}
                                    onSelectColumn={onSelectColumn}
                                    onColumnResize={onColumnResize}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mrpt-record-list">
                        {Array.from({ length: rowCount }, (_, recordIndex) => (
                            <div
                                key={`preview-row-${recordIndex}`}
                                className={`mrpt-record mrpt-record-body ${recordIndex % 2 === 0 ? 'is-even' : 'is-odd'}`}
                            >
                                <div className="mrpt-number-cell">{recordIndex + 1}</div>
                                <div className="mrpt-main">
                                    {layoutRows.map((rowSlots, displayRowIndex) => {
                                        const hasColumns = rowSlots.some(Boolean);

                                        return (
                                            <div
                                                key={`preview-row-${recordIndex}-display-${displayRowIndex + 1}`}
                                                className={`mrpt-grid-row ${displayRowIndex > 0 ? 'is-sub-row' : ''}`}
                                                style={{ gridTemplateColumns: gridTemplateColumns || 'minmax(0, 1fr)' }}
                                            >
                                                {hasColumns ? (
                                                    rowSlots.map((column, slotIndex) => (
                                                        column ? (
                                                            <div key={column.id} className="mrpt-cell">
                                                                <div
                                                                    className={`tc-preview-cell-inner ${column.id === activeColumnId ? 'is-active' : ''}`}
                                                                    onClick={() => onSelectColumn(column.id)}
                                                                >
                                                                    {renderCellPlaceholder(column)}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div key={`empty-preview-${recordIndex}-${displayRowIndex}-${slotIndex}`} className="mrpt-cell tc-empty-preview-cell" aria-hidden="true" />
                                                        )
                                                    ))
                                                ) : (
                                                    <div className="mrpt-cell tc-empty-preview-cell" style={{ gridColumn: '1 / -1' }} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </SortableContext>

            {showTotal && (
                <div className="tc-preview-total">
                    <strong>{'\u5408\u8a08'}</strong>
                    <span>{'\u00a50'}</span>
                </div>
            )}
        </div>
    );
}
