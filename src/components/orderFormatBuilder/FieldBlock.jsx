'use client';
import { useDraggable } from '@dnd-kit/core';

// 利用可能なフィールド定義
export const AVAILABLE_FIELDS = [
    { id: 'productName', label: '商品名', icon: '📦' },
    { id: 'specification', label: '規格', icon: '📐' },
    { id: 'caseQuantity', label: 'ケース入数', icon: '📊' },
    { id: 'quantity', label: '発注数', icon: '🔢' },
    { id: 'remarks', label: '備考', icon: '📝' },
];

// 固定列の定義
export const FIXED_FIELDS = [
    { id: 'no', label: 'No' },
    { id: 'janCode', label: 'JANコード' },
];

export default function FieldBlock({ field, isUsed, isDragOverlay }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `field-${field.id}`,
        data: {
            type: 'field',
            fieldId: field.id,
            fromToolbox: true,
        },
        disabled: isUsed,
    });

    const isDisabled = isUsed && !isDragOverlay;

    return (
        <div
            ref={setNodeRef}
            {...(isDisabled ? {} : listeners)}
            {...(isDisabled ? {} : attributes)}
            className={`fb-chip ${isDragging ? 'dragging' : ''} ${isDisabled ? 'used' : ''} ${isDragOverlay ? 'overlay' : ''}`}
            style={{ touchAction: 'none' }}
        >
            <span className="fb-chip-label">{field.label}</span>
        </div>
    );
}
