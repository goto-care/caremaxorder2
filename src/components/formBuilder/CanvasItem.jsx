'use client';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function CanvasItem({ item, onDelete, onUpdate, isDragging: isDraggingProp }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(item.textValue || '');

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging || isDraggingProp ? 0.5 : 1,
    };

    // テキスト編集を保存
    const saveEdit = () => {
        if (onUpdate) {
            onUpdate({ textValue: editValue });
        }
        setIsEditing(false);
    };

    // アイテムタイプごとのレンダリング
    const renderContent = () => {
        switch (item.type) {
            case 'product':
                return (
                    <div className="flex items-center gap-4 flex-1">
                        <div className="text-2xl">📦</div>
                        <div className="flex-1">
                            {item.productName ? (
                                <>
                                    <div className="font-medium text-white">{item.productName}</div>
                                    <div className="text-sm text-slate-400">
                                        {item.janCode} | {item.specification}
                                    </div>
                                </>
                            ) : (
                                <div className="text-slate-400 italic">
                                    商品を選択してください
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="数量"
                                defaultValue={item.defaultQuantity}
                                className="w-20 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-center"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <select
                                defaultValue={item.defaultUnit}
                                className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="case">ケース</option>
                                <option value="piece">バラ</option>
                            </select>
                        </div>
                    </div>
                );

            case 'header':
                return (
                    <div className="flex items-center gap-4 flex-1">
                        <div className="text-2xl">📑</div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                autoFocus
                                className="flex-1 px-3 py-2 bg-slate-600 border border-blue-500 rounded-lg text-white font-semibold"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <div
                                className="flex-1 font-semibold text-white cursor-text hover:text-blue-400"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(true);
                                    setEditValue(item.textValue);
                                }}
                            >
                                {item.textValue || '見出しを入力...'}
                            </div>
                        )}
                    </div>
                );

            case 'note':
                return (
                    <div className="flex items-start gap-4 flex-1">
                        <div className="text-2xl">📝</div>
                        {isEditing ? (
                            <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEdit}
                                autoFocus
                                rows={3}
                                className="flex-1 px-3 py-2 bg-slate-600 border border-blue-500 rounded-lg text-white resize-none"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <div
                                className="flex-1 text-slate-300 cursor-text hover:text-blue-400"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(true);
                                    setEditValue(item.textValue);
                                }}
                            >
                                {item.textValue || '注釈を入力...（クリックで編集）'}
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
        flex items-center gap-3 p-4 rounded-xl border-2 bg-slate-700
        transition-all duration-200
        ${isDragging
                    ? 'border-blue-500 shadow-2xl scale-105'
                    : 'border-slate-600 hover:border-slate-500'
                }
      `}
        >
            {/* ドラッグハンドル - タブレット対応で大きめに設定 */}
            <div
                {...attributes}
                {...listeners}
                className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-600 hover:bg-slate-500 cursor-grab active:cursor-grabbing transition-colors"
                style={{ touchAction: 'none' }}
            >
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
            </div>

            {/* コンテンツ */}
            {renderContent()}

            {/* 削除ボタン */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white transition-all duration-200"
                >
                    ✕
                </button>
            )}
        </div>
    );
}
