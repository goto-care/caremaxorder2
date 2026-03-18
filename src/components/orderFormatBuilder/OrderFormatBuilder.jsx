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
import TableConfigEditor from '../tableConfigEditor/TableConfigEditor';

const STORAGE_KEY = 'orderFormats';

export default function OrderFormatBuilder({ formatId, onSaved }) {
    const [fields, setFields] = useState([]);
    const [formatName, setFormatName] = useState('');
    const [activeDragItem, setActiveDragItem] = useState(null);
    const [activeFieldId, setActiveFieldId] = useState(null);
    const [savedFormats, setSavedFormats] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [history, setHistory] = useState([]);
    const [future, setFuture] = useState([]);
    const [tableConfigModalFieldId, setTableConfigModalFieldId] = useState(null);

    const updateFields = useCallback((updater) => {
        setFields(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            setHistory(h => [...h, prev]);
            setFuture([]); // clear redo stack on new action
            return next;
        });
    }, []);

    const handleUndo = useCallback(() => {
        if (history.length === 0) return;
        setHistory(prev => {
            const next = [...prev];
            const last = next.pop();
            setFuture(f => [...f, fields]);
            setFields(last);
            return next;
        });
    }, [history.length, fields]);

    const handleRedo = useCallback(() => {
        if (future.length === 0) return;
        setFuture(prev => {
            const next = [...prev];
            const nextState = next.pop();
            setHistory(h => [...h, fields]);
            setFields(nextState);
            return next;
        });
    }, [future.length, fields]);

    // 読み込み処理
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            setSavedFormats(JSON.parse(saved));
        }
    }, []);

    // BroadcastChannel: listen for table config saves from the separate tab
    useEffect(() => {
        let bc;
        try {
            bc = new BroadcastChannel('tableConfigChannel');
            bc.onmessage = (event) => {
                if (event.data?.type === 'TABLE_CONFIG_SAVED' && event.data.formatId === editingId) {
                    // Reload fields from localStorage
                    const raw = localStorage.getItem(STORAGE_KEY);
                    if (raw) {
                        const formats = JSON.parse(raw);
                        const fmt = formats.find(f => f.id === editingId);
                        if (fmt && fmt.fields) {
                            setFields(fmt.fields);
                        }
                        setSavedFormats(formats);
                    }
                }
            };
        } catch (e) { /* BroadcastChannel not supported */ }
        return () => { if (bc) bc.close(); };
    }, [editingId]);

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
                multiline: type === 'textarea' || type === 'address',
                rows: type === 'address' ? 4 : 3,
                textAlign: 'left',
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

            updateFields(prev => {
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
            updateFields(prev => {
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
    }, [fields, hasProductTable, updateFields]);

    // Canvas Item Actions
    const handleSelectField = (id) => setActiveFieldId(id);
    const handleRemoveField = (id) => {
        updateFields(prev => prev.filter(f => f.id !== id));
        if (activeFieldId === id) setActiveFieldId(null);
    };

    // Row Actions
    const handleAddRow = (rowIndex) => {
        updateFields(prev => {
            return prev.map(f => {
                if (f.row >= rowIndex) {
                    return { ...f, row: f.row + 1 };
                }
                return f;
            });
        });
    };

    const handleDeleteRow = (rowIndex) => {
        if (!confirm(`行${rowIndex}を削除しますか？\n配置されているパーツは一時退避エリアに移動します。`)) return;
        updateFields(prev => {
            return prev.map(f => {
                if (f.row === rowIndex) {
                    return { ...f, row: null, col: null }; // move to parking
                }
                if (f.row > rowIndex) {
                    return { ...f, row: f.row - 1 }; // shift up
                }
                return f;
            });
        });
    };

    // Property Panel / Inline Actions
    const handleUpdateField = (updatedField) => {
        updateFields(prev => prev.map(f => f.id === updatedField.id ? updatedField : f));
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
        setHistory([]);
        setFuture([]);
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
            setHistory([]);
            setFuture([]);
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
                    <button
                        className="btn btn-secondary"
                        onClick={handleUndo}
                        disabled={history.length === 0}
                        style={{ opacity: history.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a5 5 0 0 1 5 5v2a5 5 0 0 1-5 5H3m0-12 4-4m-4 4 4 4" /></svg>
                        一つ戻る
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={handleRedo}
                        disabled={future.length === 0}
                        style={{ opacity: future.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        一つ進む
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10h10a5 5 0 0 0-5 5v2a5 5 0 0 0 5 5h10m0-12-4-4m4 4-4 4" /></svg>
                    </button>
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
                            {TOOLBOX_ITEMS.map((item) => (
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
                            onUpdateField={handleUpdateField}
                            onAddRow={handleAddRow}
                            onDeleteRow={handleDeleteRow}
                        />
                    </div>

                    {/* 3. 右ペイン（プロパティ） */}
                    <div className="fb-pane fb-properties-pane">
                        <div className="fb-pane-header">設定</div>
                        <div className="fb-pane-body p-0">
                            <PropertyPanel
                                activeField={fields.find(f => f.id === activeFieldId)}
                                onChange={handleUpdateField}
                                formatId={editingId}
                                onOpenTableConfig={(fieldId) => setTableConfigModalFieldId(fieldId)}
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

            {/* Modal: Table Config Editor */}
            {tableConfigModalFieldId && (
                <div className="tc-modal-overlay" onClick={() => setTableConfigModalFieldId(null)}>
                    <div className="tc-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="tc-modal-close" onClick={() => setTableConfigModalFieldId(null)}>×</button>
                        <TableConfigEditor
                            formatId={editingId}
                            fieldId={tableConfigModalFieldId}
                            onClose={() => setTableConfigModalFieldId(null)}
                            onSaved={() => {
                                // Reload fields from localStorage after save
                                const raw = localStorage.getItem(STORAGE_KEY);
                                if (raw) {
                                    const formats = JSON.parse(raw);
                                    const fmt = formats.find(f => f.id === editingId);
                                    if (fmt && fmt.fields) {
                                        setFields(fmt.fields);
                                    }
                                    setSavedFormats(formats);
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
