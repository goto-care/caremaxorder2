'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function getGridStyle(field) {
    const isFixed = field.type === 'product-table';
    const colSpan = isFixed ? 4 : (field.colSpan || 4);
    const colStart = field.colStart || null;
    const style = {};
    if (colStart) {
        style.gridColumn = `${colStart} / span ${colSpan}`;
    } else {
        style.gridColumn = `span ${colSpan}`;
    }
    return style;
}

export default function CanvasItem({ field, isActive, onSelect, onRemove }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.id });

    const baseStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        ...getGridStyle(field),
    };

    const isFixed = field.type === 'product-table';
    const isSpacer = field.type === 'spacer';

    // Spacer block
    if (isSpacer) {
        return (
            <div
                ref={setNodeRef}
                style={baseStyle}
                className={`fb-canvas-item spacer-block ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
                onClick={onSelect}
            >
                <div className="fb-canvas-item-controls">
                    <div className="drag-handle" {...attributes} {...listeners} style={{ touchAction: 'none' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 8h16M4 16h16" />
                        </svg>
                    </div>
                    <div className="item-actions">
                        <button className="btn-remove" onClick={(e) => { e.stopPropagation(); onRemove(); }} title="削除">✕</button>
                    </div>
                </div>
                <span>⬜ スペース ({field.colSpan || 1}/4)</span>
            </div>
        );
    }

    const supportsMultilineText = ['text', 'company', 'address', 'phone', 'fax'].includes(field.type);
    const isTextArea = field.type === 'textarea' || field.multiline || field.type === 'address';
    const isTextInput = supportsMultilineText && !isTextArea;
    const previewRows = field.rows || (field.type === 'address' ? 4 : 3);

    return (
        <div
            ref={setNodeRef}
            style={baseStyle}
            className={`fb-canvas-item ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
            onClick={onSelect}
        >
            <div className="fb-canvas-item-controls">
                <div className="drag-handle" {...attributes} {...listeners} style={{ touchAction: 'none' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 8h16M4 16h16" />
                    </svg>
                </div>
                <div className="item-actions">
                    {!isFixed && (
                        <button className="btn-remove" onClick={(e) => { e.stopPropagation(); onRemove(); }} title="削除">
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="fb-canvas-item-content">
                <div className="item-label-container">
                    <label className="item-label">
                        {field.label}
                        {field.required && <span className="req-badge">必須</span>}
                    </label>
                </div>

                <div className="item-preview">
                    {isTextInput && (
                        <input type="text" className="form-input preview-input" placeholder={field.placeholder || 'テキスト入力'} readOnly />
                    )}
                    {isTextArea && (
                        <textarea
                            className="form-input preview-input"
                            rows={previewRows}
                            placeholder={field.placeholder || '複数行テキスト'}
                            readOnly
                            style={{ textAlign: field.textAlign || 'left' }}
                        />
                    )}
                    {field.type === 'date' && (
                        <input type="date" className="form-input preview-input" readOnly />
                    )}
                    {field.type === 'select' && (
                        <select className="form-input preview-input" readOnly>
                            {(field.options && field.options.length > 0) ? (
                                field.options.map((opt, i) => <option key={i}>{opt}</option>)
                            ) : (
                                <option>選択肢...</option>
                            )}
                        </select>
                    )}
                    {field.type === 'product-table' && (
                        <div className="product-table-preview">
                            <div className="pt-header">
                                <span>商品明細テーブル（固定機能）</span>
                                <small>JANコードによるマスタ連携と自動計算が行われます</small>
                            </div>
                            <table className="order-table pseudo-table">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>JAN / 商品名検索エリア</th>
                                        <th>単価</th>
                                        <th>数量</th>
                                        <th>小計</th>
                                        <th>備考</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>1</td>
                                        <td><div className="pseudo-search">商品を検索...</div></td>
                                        <td>¥0</td>
                                        <td><div className="pseudo-qty">0</div></td>
                                        <td>¥0</td>
                                        <td><div className="pseudo-input"></div></td>
                                        <td>✕</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
