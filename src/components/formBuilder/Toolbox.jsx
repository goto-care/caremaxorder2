'use client';
import { useDraggable } from '@dnd-kit/core';

const toolItems = [
    {
        type: 'product',
        label: '商品アイテム',
        icon: '📦',
        description: '商品を追加（数量・単位入力あり）',
    },
    {
        type: 'header',
        label: '見出しバー',
        icon: '📑',
        description: 'カテゴリの区切り見出し',
    },
    {
        type: 'note',
        label: '注釈テキスト',
        icon: '📝',
        description: '自由な注釈やメモ',
    },
];

function DraggableToolItem({ item }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `tool-${item.type}`,
        data: {
            type: item.type,
            fromToolbox: true,
        },
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`
        p-4 mb-3 rounded-xl border-2 cursor-grab active:cursor-grabbing
        transition-all duration-200 select-none
        ${isDragging
                    ? 'opacity-50 border-blue-500 bg-blue-500/20'
                    : 'border-slate-600 bg-slate-700 hover:border-blue-400 hover:bg-slate-600'
                }
      `}
            style={{
                touchAction: 'none', // タッチデバイスでのスクロール競合を防ぐ
            }}
        >
            {/* ドラッグハンドル - タブレット対応で大きめに */}
            <div className="flex items-center gap-3">
                <div className="text-3xl min-w-[48px] min-h-[48px] flex items-center justify-center bg-slate-600 rounded-lg">
                    {item.icon}
                </div>
                <div className="flex-1">
                    <div className="font-semibold text-white text-sm">
                        {item.label}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                        {item.description}
                    </div>
                </div>
                <div className="text-slate-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

export default function Toolbox() {
    return (
        <div className="w-80 bg-slate-800 border-r border-slate-700 p-4 overflow-y-auto">
            <div className="mb-4">
                <h2 className="text-lg font-bold text-white mb-1">
                    🧰 パーツ
                </h2>
                <p className="text-sm text-slate-400">
                    ドラッグして右側に配置
                </p>
            </div>

            <div className="space-y-2">
                {toolItems.map((item) => (
                    <DraggableToolItem key={item.type} item={item} />
                ))}
            </div>

            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <h3 className="text-sm font-medium text-slate-300 mb-2">
                    💡 ヒント
                </h3>
                <ul className="text-xs text-slate-400 space-y-1">
                    <li>• パーツを右エリアにドラッグ</li>
                    <li>• 配置後は上下に並べ替え可能</li>
                    <li>• 見出しと注釈は編集可能</li>
                </ul>
            </div>
        </div>
    );
}
