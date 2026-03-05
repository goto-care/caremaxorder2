'use client';
import { useState, useCallback, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    sortableKeyboardCoordinates,
    arrayMove,
} from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import ToolboxItem, { TOOLBOX_ITEMS } from './ToolboxItem';
import FormatCanvas from './FormatCanvas';
import PropertyPanel from './PropertyPanel';

const STORAGE_KEY = 'orderFormats';

export default function OrderFormatBuilder({ formatId, onSaved }) {
    const [fields, setFields] = useState([]);
    const [formatName, setFormatName] = useState('');
    const [activeDragItem, setActiveDragItem] = useState(null);
    const [activeFieldId, setActiveFieldId] = useState(null);
    const [savedFormats, setSavedFormats] = useState([]);
    const [editingId, setEditingId] = useState(null);

    // 読み込み処理
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            setSavedFormats(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        if (formatId && savedFormats.length > 0) {
            const target = savedFormats.find(f => f.id === formatId);
            if (target) {
                setFormatName(target.name);
                setEditingId(target.id);

                // Migrate old formats without row/col
                let updatedFields = target.fields || [];
                const needsMigration = updatedFields.some(f => f.row == null || f.col == null);
                if (needsMigration) {
                    updatedFields = migrateFieldsToGrid(updatedFields);
                }
                setFields(updatedFields);
            }
        }
    }, [formatId, savedFormats]);

    // Helper to compute grid positions for old formats
    const migrateFieldsToGrid = (oldFields) => {
        const migrated = [];
        let currentRow = 1;
        let currentCol = 1;

        oldFields.forEach(field => {
            const span = field.type === 'product-table' ? 4 : (field.colSpan || 4);
            if (currentCol + span > 5) {
                currentRow++;
                currentCol = 1;
            }
            migrated.push({ ...field, row: currentRow, col: currentCol, colSpan: span });
            currentCol += span;
            if (currentCol > 4) {
                currentRow++;
                currentCol = 1;
            }
        });
        return migrated;
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const hasProductTable = fields.some(f => f.type === 'product-table');

    // Drag Actions
    const handleDragStart = useCallback((event) => {
        const { active } = event;
        if (active.data.current?.fromToolbox) {
            setActiveDragItem(TOOLBOX_ITEMS.find(item => item.type === active.data.current.type));
        } else {
            setActiveDragItem(fields.find(f => f.id === active.id));
        }
    }, [fields]);

    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        const overData = over.data.current || {};
        const overType = overData.type;
        const overFieldId = (overType !== 'grid-cell' && overType !== 'parking' && over.id !== 'canvas-drop-area') ? over.id : null;
        const overField = overFieldId ? fields.find(f => f.id === overFieldId) : null;

        // ツールボックスからのドロップ
        if (active.data.current?.fromToolbox) {
            const type = active.data.current.type;
            const label = active.data.current.label;

            // 商品明細テーブルは1つまで
            if (type === 'product-table' && hasProductTable) return;

            const newField = {
                id: uuidv4(),
                type: type,
                label: label,
                required: type === 'product-table',
                placeholder: '',
                options: type === 'select' ? ['オプション1', 'オプション2'] : [],
                colSpan: type === 'spacer' ? 1 : 4,
                row: null,
                col: null,
            };

            if (overType === 'grid-cell') {
                newField.row = overData.row;
                newField.col = overData.col;
            } else if (overField) {
                // ドロップ先が既存パーツなら位置を奪い、元のパーツは退避へ
                newField.row = overField.row;
                newField.col = overField.col;
            } else if (overType === 'parking' || over.id === 'canvas-drop-area') {
                // 退避エリアやキャンバスの空き領域なら退避(row=null, col=null)
                newField.row = null;
                newField.col = null;
            }

            setFields(prev => {
                const next = [...prev];
                if (overField) {
                    const idx = next.findIndex(f => f.id === overField.id);
                    if (idx >= 0) {
                        next[idx] = { ...next[idx], row: null, col: null }; // 退避
                    }
                }
                return [...next, newField];
            });
            setActiveFieldId(newField.id);
            return;
        }

        // キャンバス内の移動
        if (active.id !== over.id) {
            setFields(prev => {
                const actIdx = prev.findIndex(f => f.id === active.id);
                if (actIdx < 0) return prev;
                const activeField = prev[actIdx];
                const next = [...prev];

                if (overType === 'grid-cell') {
                    // 空きセルへ移動
                    next[actIdx] = { ...activeField, row: overData.row, col: overData.col };
                } else if (overType === 'parking' || over.id === 'canvas-drop-area') {
                    // 退避エリアへ移動
                    next[actIdx] = { ...activeField, row: null, col: null };
                } else if (overField) {
                    // 別のパーツ上にドロップした場合は、位置を入れ替える（スワップ）
                    const ovIdx = next.findIndex(f => f.id === overField.id);
                    if (ovIdx >= 0) {
                        next[actIdx] = { ...activeField, row: overField.row, col: overField.col };
                        next[ovIdx] = { ...overField, row: activeField.row, col: activeField.col };
                    }
                }
                return next;
            });
        }
    }, [fields, hasProductTable]);

    // Canvas Item Actions
    const handleSelectField = (id) => setActiveFieldId(id);
    const handleRemoveField = (id) => {
        setFields(prev => prev.filter(f => f.id !== id));
        if (activeFieldId === id) setActiveFieldId(null);
    };

    // Property Panel Actions
    const handleUpdateField = (updatedField) => {
        setFields(prev => prev.map(f => f.id === updatedField.id ? updatedField : f));
    };

    // Global Actions
    const handleSave = () => {
        if (!formatName.trim()) return alert('フォーマット名を入力してください。');
        if (!hasProductTable) return alert('商品明細テーブルは必須です。左のメニューから追加してください。');

        const newFormat = {
            id: editingId || uuidv4(),
            name: formatName.trim(),
            fields,
            updatedAt: new Date().toISOString(),
            createdAt: editingId
                ? savedFormats.find(f => f.id === editingId)?.createdAt || new Date().toISOString()
                : new Date().toISOString(),
        };

        const updated = editingId
            ? savedFormats.map(f => f.id === editingId ? newFormat : f)
            : [...savedFormats, newFormat];

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setSavedFormats(updated);
        setEditingId(newFormat.id);
        alert('保存しました。');
        if (onSaved) onSaved(newFormat);
    };

    const handleNew = () => {
        setFormatName('');
        setFields([]);
        setEditingId(null);
        setActiveFieldId(null);
    };

    const handleDelete = () => {
        if (!editingId) return;
        if (!confirm('このフォーマットを削除しますか？')) return;
        const updated = savedFormats.filter(f => f.id !== editingId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setSavedFormats(updated);
        handleNew();
    };

    const handleLoad = (e) => {
        const id = e.target.value;
        if (!id) return handleNew();

        const target = savedFormats.find(f => f.id === id);
        if (target) {
            setFormatName(target.name);
            setEditingId(target.id);

            let updatedFields = target.fields || [];
            const needsMigration = updatedFields.some(f => f.row == null || f.col == null);
            if (needsMigration) {
                updatedFields = migrateFieldsToGrid(updatedFields);
            }
            setFields(updatedFields);
            setActiveFieldId(null);
        }
    };

    return (
        <div className="fb-root">
            {/* ヘッダー */}
            <div className="fb-header">
                <div className="fb-header-left">
                    <input
                        type="text"
                        className="form-input"
                        placeholder="発注フォーマット名..."
                        value={formatName}
                        onChange={(e) => setFormatName(e.target.value)}
                        style={{ width: '300px', fontWeight: 'bold' }}
                    />
                    <select className="form-input" value={editingId || ''} onChange={handleLoad} style={{ width: '200px' }}>
                        <option value="">(新規作成)</option>
                        {savedFormats.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>
                <div className="fb-header-right">
                    {editingId && (
                        <button className="btn" onClick={handleDelete} style={{ color: 'var(--danger)', background: 'transparent', border: '1px solid var(--danger)' }} title="フォーマット削除">🗑 削除</button>
                    )}
                    <button className="btn btn-secondary" onClick={handleNew}>新規追加</button>
                    <button className="btn btn-primary" onClick={handleSave}>💾 フォームを保存</button>
                </div>
            </div>

            {/* 3ペインメインエリア */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="fb-layout">
                    {/* 1. 左ペイン（ツールボックス） */}
                    <div className="fb-pane fb-toolbox-pane">
                        <div className="fb-pane-header">パーツ</div>
                        <div className="fb-pane-body">
                            {TOOLBOX_ITEMS.map(item => (
                                <ToolboxItem
                                    key={item.type}
                                    item={item}
                                    isUsed={item.type === 'product-table' && hasProductTable}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 2. 中央ペイン（キャンバス） */}
                    <div className="fb-pane fb-canvas-pane">
                        <FormatCanvas
                            fields={fields}
                            activeFieldId={activeFieldId}
                            onSelectField={handleSelectField}
                            onRemoveField={handleRemoveField}
                        />
                    </div>

                    {/* 3. 右ペイン（プロパティ） */}
                    <div className="fb-pane fb-properties-pane">
                        <div className="fb-pane-header">設定</div>
                        <div className="fb-pane-body p-0">
                            <PropertyPanel
                                activeField={fields.find(f => f.id === activeFieldId)}
                                onChange={handleUpdateField}
                            />
                        </div>
                    </div>
                </div>

                {/* ドラッグ中のプレビュー */}
                <DragOverlay>
                    {activeDragItem && (
                        <div className="fb-toolbox-item dragging-overlay">
                            {activeDragItem.icon && <span className="fb-toolbox-icon">{activeDragItem.icon}</span>}
                            <span className="fb-toolbox-label">{activeDragItem.label}</span>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
