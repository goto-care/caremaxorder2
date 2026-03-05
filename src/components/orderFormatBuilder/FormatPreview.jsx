'use client';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FIXED_FIELDS, AVAILABLE_FIELDS } from './FieldBlock';

// ドロップ済みフィールドのソータブルアイテム（列タグ）
function SortableColumn({ field, onRemove }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const fieldDef = AVAILABLE_FIELDS.find(f => f.id === field.id);

    return (
        <div ref={setNodeRef} style={style} className={`fp-col-tag sortable ${isDragging ? 'dragging' : ''}`}>
            <div className="fp-col-tag-handle" {...attributes} {...listeners} style={{ touchAction: 'none' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 8h16M4 16h16" />
                </svg>
            </div>
            <span className="fp-col-tag-label">{fieldDef?.label || field.id}</span>
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(field.id); }}
                className="fp-col-tag-remove"
                title="削除"
            >
                ✕
            </button>
        </div>
    );
}

export default function FormatPreview({ selectedFields, onRemoveField }) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'format-drop-area',
    });

    // サンプルデータ
    const sampleData = [
        { no: 1, janCode: '4901234567890', productName: 'サンプル商品A', specification: '100ml×10本', caseQuantity: 10, quantity: 5, remarks: '' },
        { no: 2, janCode: '4901234567891', productName: 'サンプル商品B', specification: '50g×20個', caseQuantity: 20, quantity: 3, remarks: '急ぎ' },
        { no: 3, janCode: '4901234567892', productName: 'サンプル商品C', specification: '200ml×5本', caseQuantity: 5, quantity: 0, remarks: '' },
    ];

    // 全列の定義（固定 + 選択済み）
    const allColumns = [
        ...FIXED_FIELDS,
        ...selectedFields.map(f => {
            const def = AVAILABLE_FIELDS.find(d => d.id === f.id);
            return { id: f.id, label: def?.label || f.id };
        }),
    ];

    return (
        <div className="fp-container">
            {/* 列構成：固定タグ + ドロップゾーン */}
            <div className="fp-columns-bar">
                <span className="fp-columns-bar-label">列の構成：</span>
                {FIXED_FIELDS.map(f => (
                    <div key={f.id} className="fp-col-tag fixed">
                        <span className="fp-col-tag-label">{f.label}</span>
                        <span className="fp-col-tag-fixed-badge">固定</span>
                    </div>
                ))}
                <div
                    ref={setNodeRef}
                    className={`fp-drop-zone ${isOver ? 'over' : ''} ${selectedFields.length === 0 ? 'empty' : ''}`}
                >
                    {selectedFields.length === 0 ? (
                        <span className="fp-drop-zone-hint">⬇ ここにドロップ</span>
                    ) : (
                        selectedFields.map(field => (
                            <SortableColumn
                                key={field.id}
                                field={field}
                                onRemove={onRemoveField}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* テーブルプレビュー */}
            <div className="fp-table-area">
                <div style={{ overflowX: 'auto' }}>
                    <table className="order-table">
                        <thead>
                            <tr>
                                {allColumns.map(col => (
                                    <th key={col.id} style={
                                        col.id === 'no' ? { width: '50px', textAlign: 'center' } :
                                            col.id === 'janCode' ? { width: '140px' } : {}
                                    }>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sampleData.map((row, idx) => (
                                <tr key={idx}>
                                    {allColumns.map(col => (
                                        <td key={col.id} style={col.id === 'no' ? { textAlign: 'center', background: '#f3f4f6' } : {}}>
                                            {col.id === 'no' ? row.no :
                                                col.id === 'janCode' ? row.janCode :
                                                    col.id === 'quantity' ? (
                                                        <input type="number" defaultValue={row.quantity} min="0" style={{ textAlign: 'center', width: '70px' }} readOnly />
                                                    ) : col.id === 'remarks' ? (
                                                        <input type="text" defaultValue={row.remarks} placeholder="備考" style={{ width: '100%' }} readOnly />
                                                    ) : (
                                                        row[col.id] !== undefined ? row[col.id] : '-'
                                                    )
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
