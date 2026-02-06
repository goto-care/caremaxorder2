'use client';
import { useState, useCallback } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import Toolbox from './Toolbox';
import Canvas from './Canvas';
import CanvasItem from './CanvasItem';

// 初期レイアウトデータ
const initialLayout = {
    id: '',
    name: '',
    items: [],
};

export default function FormBuilder({ templateId, onSave }) {
    const [layout, setLayout] = useState(initialLayout);
    const [activeItem, setActiveItem] = useState(null);
    const [templateName, setTemplateName] = useState('');

    // ドラッグセンサーの設定（タブレット対応）
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px動かさないとドラッグ開始しない
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // ドラッグ開始
    const handleDragStart = useCallback((event) => {
        const { active } = event;

        if (active.data.current?.fromToolbox) {
            // ツールボックスからのドラッグ
            setActiveItem({
                type: active.data.current.type,
                isNew: true,
            });
        } else {
            // キャンバス内のアイテムのドラッグ
            const item = layout.items.find((i) => i.id === active.id);
            if (item) {
                setActiveItem({ ...item, isNew: false });
            }
        }
    }, [layout.items]);

    // ドラッグ終了
    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        setActiveItem(null);

        if (!over) return;

        // ツールボックスからキャンバスへのドロップ
        if (active.data.current?.fromToolbox) {
            const newItem = createNewItem(active.data.current.type);
            setLayout((prev) => ({
                ...prev,
                items: [...prev.items, newItem],
            }));
            return;
        }

        // キャンバス内での並べ替え
        if (active.id !== over.id) {
            setLayout((prev) => {
                const oldIndex = prev.items.findIndex((i) => i.id === active.id);
                const newIndex = prev.items.findIndex((i) => i.id === over.id);

                if (oldIndex === -1 || newIndex === -1) return prev;

                const newItems = [...prev.items];
                const [removed] = newItems.splice(oldIndex, 1);
                newItems.splice(newIndex, 0, removed);

                return { ...prev, items: newItems };
            });
        }
    }, []);

    // 新しいアイテムを作成
    const createNewItem = (type) => {
        const id = uuidv4();

        switch (type) {
            case 'product':
                return {
                    type: 'product',
                    id,
                    productId: '',
                    defaultUnit: 'case',
                    productName: '',
                    specification: '',
                    janCode: '',
                };
            case 'header':
                return {
                    type: 'header',
                    id,
                    textValue: '新しいカテゴリ',
                    backgroundColor: '#6b7280',
                };
            case 'note':
                return {
                    type: 'note',
                    id,
                    textValue: '',
                };
            default:
                return null;
        }
    };

    // アイテムを削除
    const handleDeleteItem = useCallback((id) => {
        setLayout((prev) => ({
            ...prev,
            items: prev.items.filter((item) => item.id !== id),
        }));
    }, []);

    // アイテムを更新
    const handleUpdateItem = useCallback((id, updates) => {
        setLayout((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
                item.id === id ? { ...item, ...updates } : item
            ),
        }));
    }, []);

    // テンプレートを保存
    const handleSave = () => {
        if (!templateName.trim()) {
            alert('テンプレート名を入力してください');
            return;
        }

        const savedLayout = {
            ...layout,
            id: templateId || uuidv4(),
            name: templateName,
            updatedAt: new Date().toISOString(),
            createdAt: layout.createdAt || new Date().toISOString(),
        };

        if (onSave) {
            onSave(savedLayout);
        }

        // ローカルストレージにも保存（デモ用）
        const layouts = JSON.parse(localStorage.getItem('formLayouts') || '[]');
        const existingIndex = layouts.findIndex((l) => l.id === savedLayout.id);
        if (existingIndex >= 0) {
            layouts[existingIndex] = savedLayout;
        } else {
            layouts.push(savedLayout);
        }
        localStorage.setItem('formLayouts', JSON.stringify(layouts));

        alert('テンプレートを保存しました');
    };

    return (
        <div className="min-h-screen bg-slate-900">
            {/* ヘッダー */}
            <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-white">
                            📋 フォームビルダー
                        </h1>
                        <input
                            type="text"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="テンプレート名を入力..."
                            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
                        >
                            💾 保存
                        </button>
                    </div>
                </div>
            </div>

            {/* メインコンテンツ */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex h-[calc(100vh-73px)]">
                    {/* 左サイドバー：ツールボックス */}
                    <Toolbox />

                    {/* 右メインエリア：キャンバス */}
                    <div className="flex-1 p-6 overflow-auto">
                        <SortableContext
                            items={layout.items.map((i) => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <Canvas
                                items={layout.items}
                                onDeleteItem={handleDeleteItem}
                                onUpdateItem={handleUpdateItem}
                            />
                        </SortableContext>
                    </div>
                </div>

                {/* ドラッグ中のオーバーレイ */}
                <DragOverlay>
                    {activeItem && (
                        <div className="opacity-80 shadow-2xl">
                            <CanvasItem
                                item={activeItem}
                                isDragging
                            />
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
