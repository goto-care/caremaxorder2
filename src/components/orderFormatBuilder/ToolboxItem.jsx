'use client';
import { useDraggable } from '@dnd-kit/core';

export const TOOLBOX_ITEMS = [
    { type: 'textarea', icon: '📄', label: '複数行テキスト' },
    { type: 'date', icon: '📅', label: '日付' },
    { type: 'select', icon: '▼', label: 'ドロップダウン' },
    { type: 'company', icon: '🏢', label: '会社名' },
    { type: 'address', icon: '📍', label: '住所' },
    { type: 'phone', icon: '📞', label: '電話番号' },
    { type: 'fax', icon: '📠', label: 'FAX番号' },
    { type: 'spacer', icon: '⬜', label: 'スペーサー' },
    { type: 'product-table', icon: '📦', label: '商品明細テーブル' },
];

export default function ToolboxItem({ item, isUsed }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `toolbox-${item.type}`,
        data: {
            fromToolbox: true,
            type: item.type,
            label: item.label,
        },
        disabled: isUsed && item.type === 'product-table', // テーブルは1つまでの場合
    });

    const disabled = isUsed && item.type === 'product-table';

    return (
        <div
            ref={setNodeRef}
            {...(disabled ? {} : listeners)}
            {...(disabled ? {} : attributes)}
            className={`fb-toolbox-item ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
            style={{ touchAction: 'none' }}
        >
            <span className="fb-toolbox-icon">{item.icon}</span>
            <span className="fb-toolbox-label">{item.label}</span>
        </div>
    );
}
