'use client';
import { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ──────── Droppable empty cell (1/4 block) ──────── */
function DroppableCell({ row, col, isOver: parentIsOver }) {
    const id = `cell-${row}-${col}`;
    const { setNodeRef, isOver } = useDroppable({
        id,
        data: { type: 'grid-cell', row, col },
    });

    return (
        <div
            ref={setNodeRef}
            style={{
                gridColumn: `${col} / span 1`,
                gridRow: row,
                minHeight: '55px',
                border: '1px dashed #e2e8f0',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#cbd5e1',
                fontSize: '0.65rem',
                background: isOver ? '#f0fdfa' : 'transparent',
                transition: 'background 0.12s',
            }}
        >
            {isOver ? '◎' : ''}
        </div>
    );
}

/* ──────── Placed item (on the grid) ──────── */
function PlacedField({ field, isActive, onSelect, onRemove, onUpdateField }) {
    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging,
    } = useSortable({ id: field.id });

    const isFixed = field.type === 'product-table';
    const isSpacer = field.type === 'spacer';
    const span = isFixed ? 4 : (field.colSpan || 4);
    const isTextInput = ['text', 'company', 'phone', 'fax'].includes(field.type);
    const isTextArea = ['textarea', 'address'].includes(field.type);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        gridColumn: isFixed ? '1 / span 4' : `${field.col} / span ${span}`,
        gridRow: field.row,
        zIndex: isDragging ? 10 : 1,
    };

    if (isSpacer) {
        return (
            <div ref={setNodeRef} style={style}
                className={`fb-canvas-item spacer-block ${isActive ? 'active' : ''}`}
                onClick={onSelect}>
                <div className="fb-canvas-item-controls">
                    <div className="drag-handle" {...attributes} {...listeners} style={{ touchAction: 'none' }}>⠿</div>
                    <button className="btn-remove" onClick={(e) => { e.stopPropagation(); onRemove(); }}>✕</button>
                </div>
                <span style={{ fontSize: '0.7rem' }}>⬜ ({span}/4)</span>
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style}
            className={`fb-canvas-item ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
            onClick={onSelect}>
            <div className="fb-canvas-item-controls">
                <div className="drag-handle" {...attributes} {...listeners} style={{ touchAction: 'none' }}>⠿</div>
                {!isFixed && <button className="btn-remove" onClick={(e) => { e.stopPropagation(); onRemove(); }}>✕</button>}
            </div>
            <div className="fb-canvas-item-content">
                <label className="item-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {field.label}
                    {field.required && <span className="req-badge" style={{ fontSize: '0.6rem', marginLeft: '4px' }}>必須</span>}
                </label>
                <div className="item-preview" style={{ marginTop: '4px' }}>
                    {isTextInput && <input type="text" className="form-input preview-input" defaultValue="" readOnly style={{ fontSize: '0.75rem', padding: '3px 6px' }} />}
                    {isTextArea && <textarea className="form-input preview-input" rows="2" defaultValue="" readOnly style={{ fontSize: '0.75rem', padding: '3px 6px', resize: 'vertical' }} />}
                    {field.type === 'date' && <input type="date" className="form-input preview-input" defaultValue="" readOnly style={{ fontSize: '0.75rem', padding: '3px 6px' }} />}
                    {field.type === 'select' && (
                        <select className="form-input preview-input" disabled style={{ fontSize: '0.75rem', padding: '3px 6px' }}>
                            {(field.options?.length > 0) ? field.options.map((o, i) => <option key={i}>{o}</option>) : <option>選択肢...</option>}
                        </select>
                    )}
                    {field.type === 'product-table' && (
                        <div style={{ fontSize: '0.75rem', padding: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', textAlign: 'center' }}>
                            {/* 商品明細テーブル領域 */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ──────── Parking area item ──────── */
function ParkedField({ field, isActive, onSelect, onRemove }) {
    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}
            className={`fb-canvas-item parked ${isActive ? 'active' : ''}`}
            onClick={onSelect}>
            <div className="fb-canvas-item-controls" style={{ padding: '2px 6px' }}>
                <div className="drag-handle" {...attributes} {...listeners} style={{ touchAction: 'none' }}>⠿</div>
                <button className="btn-remove" onClick={(e) => { e.stopPropagation(); onRemove(); }}>✕</button>
            </div>
            <div style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                {field.label} <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>({field.colSpan || 4}/4)</span>
            </div>
        </div>
    );
}


/* ████████████████████████████████████████████████████
   Main Canvas Component
   ████████████████████████████████████████████████████ */
export default function FormatCanvas({ fields, activeFieldId, onSelectField, onRemoveField, onUpdateField, onAddRow, onDeleteRow }) {
    const { setNodeRef: setCanvasRef, isOver: isCanvasOver } = useDroppable({
        id: 'canvas-drop-area',
    });

    // Parking area droppable
    const { setNodeRef: setParkingRef, isOver: isParkingOver } = useDroppable({
        id: 'parking-area',
        data: { type: 'parking' },
    });

    const [desiredRows, setDesiredRows] = useState(2);

    // Separate placed fields (have row/col) from parked fields
    const placedFields = fields.filter(f => f.row != null && f.col != null);
    const parkedFields = fields.filter(f => f.row == null || f.col == null);

    // compute how many rows the grid needs
    let maxRow = 0;
    placedFields.forEach(f => {
        maxRow = Math.max(maxRow, f.row);
    });
    const totalRows = Math.max(maxRow, desiredRows, 2);

    // Build occupancy map: which cells are occupied?
    const occupied = new Set();
    placedFields.forEach(f => {
        const span = f.type === 'product-table' ? 4 : (f.colSpan || 4);
        for (let c = f.col; c < f.col + span && c <= 4; c++) {
            occupied.add(`${f.row}-${c}`);
        }
    });

    const colHeaders = ['列1', '列2', '列3', '列4'];

    return (
        <div className="fb-canvas-container">
            <div className="fb-canvas-header">
                <h3>発注書プレビュー</h3>
            </div>

            <div ref={setCanvasRef}
                className={`fb-canvas-area ${isCanvasOver ? 'drag-over' : ''}`}
                style={{ padding: '16px' }}
            >
                {/* Column headers */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) 0px', gap: '4px',
                    marginBottom: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px',
                }}>
                    {colHeaders.map((h, i) => (
                        <div key={i} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px' }}>{h}</div>
                    ))}
                    <div></div>{/* End empty col header */}
                </div>

                {/* Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr) 0px',
                    gridAutoRows: 'minmax(60px, auto)',
                    gap: '6px',
                }}>
                    {/* Render empty cells for all unoccupied positions */}
                    {Array.from({ length: totalRows }, (_, rowIdx) => {
                        const row = rowIdx + 1;
                        const cells = [];
                        for (let col = 1; col <= 4; col++) {
                            if (!occupied.has(`${row}-${col}`)) {
                                cells.push(
                                    <DroppableCell key={`cell-${row}-${col}`} row={row} col={col} />
                                );
                            }
                        }
                        return cells;
                    }).flat()}

                    {/* Render placed fields */}
                    {placedFields.map(field => (
                        <PlacedField
                            key={field.id}
                            field={field}
                            isActive={field.id === activeFieldId}
                            onSelect={() => onSelectField(field.id)}
                            onRemove={() => onRemoveField(field.id)}
                            onUpdateField={onUpdateField}
                        />
                    ))}

                    {/* Render Row Controls */}
                    {Array.from({ length: totalRows }, (_, rowIdx) => {
                        const row = rowIdx + 1;
                        return (
                            <div key={`row-ctrl-${row}`} style={{
                                gridRow: row, gridColumn: 5,
                                position: 'relative'
                            }}>
                                <div style={{
                                    position: 'absolute', left: '16px', top: '0', bottom: '0',
                                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '4px',
                                }}>
                                    <button onClick={() => onAddRow(row)} title="この上に行を追加" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', cursor: 'pointer', color: '#64748b' }}>+</button>
                                    <button onClick={() => onDeleteRow(row)} title="この行を削除" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', cursor: 'pointer', color: '#ef4444' }}>🗑</button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setDesiredRows(totalRows + 1)}
                        style={{ padding: '4px 12px', fontSize: '0.8rem', background: '#f1f5f9', color: '#475569', border: '1px dashed #cbd5e1' }}
                    >
                        ＋ この下に行を追加
                    </button>
                </div>
            </div>

            {/* ── Parking Area ── */}
            <div ref={setParkingRef} style={{
                marginTop: '12px',
                padding: '10px',
                minHeight: '60px',
                background: isParkingOver ? '#fef3c7' : '#fefce8',
                border: `2px dashed ${isParkingOver ? '#f59e0b' : '#fbbf24'}`,
                borderRadius: '8px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                alignItems: 'flex-start',
            }}>
                <div style={{ width: '100%', fontSize: '0.7rem', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>
                    📦 一時退避エリア（ここにパーツを避難させることができます）
                </div>
                {parkedFields.length === 0 && (
                    <div style={{ fontSize: '0.7rem', color: '#a16207', width: '100%', textAlign: 'center', padding: '8px 0' }}>
                        パーツをここにドロップして一時的に退避できます
                    </div>
                )}
                {parkedFields.map(field => (
                    <ParkedField
                        key={field.id}
                        field={field}
                        isActive={field.id === activeFieldId}
                        onSelect={() => onSelectField(field.id)}
                        onRemove={() => onRemoveField(field.id)}
                    />
                ))}
            </div>
        </div>
    );
}
