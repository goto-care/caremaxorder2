'use client';
import { useDroppable } from '@dnd-kit/core';
import CanvasItem from './CanvasItem';

export default function Canvas({ items, onDeleteItem, onUpdateItem }) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'canvas',
    });

    return (
        <div
            ref={setNodeRef}
            className={`
        min-h-full rounded-xl border-2 border-dashed p-6 transition-all duration-200
        ${isOver
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-slate-600 bg-slate-800/50'
                }
        ${items.length === 0 ? 'flex items-center justify-center' : ''}
      `}
        >
            {items.length === 0 ? (
                <div className="text-center">
                    <div className="text-6xl mb-4 opacity-50">📋</div>
                    <p className="text-slate-400 text-lg">
                        左側からパーツをドラッグしてください
                    </p>
                    <p className="text-slate-500 text-sm mt-2">
                        商品、見出し、注釈を自由に配置できます
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <CanvasItem
                            key={item.id}
                            item={item}
                            onDelete={() => onDeleteItem(item.id)}
                            onUpdate={(updates) => onUpdateItem(item.id, updates)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
