'use client';
import { useRef, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

/* ─── Sortable Column Header ─── */
function SortableColumnHeader({ column, isActive, onSelect, onResize }) {
    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging,
    } = useSortable({ id: column.id });

    const resizeRef = useRef(null);

    const handleResizeStart = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startWidth = column.width;

        const handleMouseMove = (moveE) => {
            const diff = moveE.clientX - startX;
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
        width: `${column.width}px`,
        minWidth: `${column.width}px`,
        maxWidth: `${column.width}px`,
    };

    if (!column.visible) return null;

    return (
        <th
            ref={setNodeRef}
            style={style}
            className={`tc-th ${isActive ? 'tc-th-active' : ''} ${isDragging ? 'tc-th-dragging' : ''}`}
            onClick={() => onSelect(column.id)}
        >
            <div className="tc-th-content" {...attributes} {...listeners} style={{ touchAction: 'none' }}>
                {column.locked && <span className="tc-lock-icon" title="この列は削除できません">🔒</span>}
                <span className="tc-th-label">{column.label}</span>
            </div>
            <div
                ref={resizeRef}
                className="tc-resize-handle"
                onMouseDown={handleResizeStart}
            />
        </th>
    );
}

/* ─── Table Preview Component ─── */
export default function TablePreview({ columns, initialRows, showTotal, activeColumnId, onSelectColumn, onColumnResize }) {
    const visibleColumns = columns.filter(c => c.visible);
    const rowCount = Math.max(1, initialRows || 5);

    const renderCellPlaceholder = (col) => {
        switch (col.type) {
            case 'number':
            case 'computed':
                return <span className="tc-cell-placeholder tc-cell-number">0</span>;
            case 'date':
                return <span className="tc-cell-placeholder">____/__/__</span>;
            case 'select':
                return <span className="tc-cell-placeholder">▼</span>;
            case 'textarea':
                return <span className="tc-cell-placeholder tc-cell-textarea">...</span>;
            default:
                return <span className="tc-cell-placeholder">&nbsp;</span>;
        }
    };

    return (
        <div className="tc-table-wrapper">
            <SortableContext items={visibleColumns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                <table className="tc-table">
                    <thead>
                        <tr>
                            <th className="tc-th-row-num" style={{ width: '40px', minWidth: '40px' }}>#</th>
                            {visibleColumns.map((col) => (
                                <SortableColumnHeader
                                    key={col.id}
                                    column={col}
                                    isActive={col.id === activeColumnId}
                                    onSelect={onSelectColumn}
                                    onResize={onColumnResize}
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rowCount }, (_, rowIdx) => (
                            <tr key={rowIdx} className="tc-tr">
                                <td className="tc-td-row-num">{rowIdx + 1}</td>
                                {visibleColumns.map((col) => (
                                    <td
                                        key={col.id}
                                        className={`tc-td ${col.id === activeColumnId ? 'tc-td-active' : ''} ${col.editLocked ? 'tc-td-locked' : ''}`}
                                        style={{ width: `${col.width}px`, minWidth: `${col.width}px`, maxWidth: `${col.width}px` }}
                                        onClick={() => onSelectColumn(col.id)}
                                    >
                                        {renderCellPlaceholder(col)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                    {showTotal && (
                        <tfoot>
                            <tr className="tc-total-row">
                                <td className="tc-td-row-num"></td>
                                {visibleColumns.map((col, idx) => (
                                    <td key={col.id} className="tc-td-total"
                                        style={{ width: `${col.width}px`, minWidth: `${col.width}px`, maxWidth: `${col.width}px` }}>
                                        {idx === 0 ? <strong>合計</strong> : ''}
                                        {col.type === 'computed' || col.id === 'subtotal' ? <strong>¥0</strong> : ''}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </SortableContext>
        </div>
    );
}
