'use client';
import { useState, useCallback, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    SortableContext,
    horizontalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import TablePreview from './TablePreview';
import TableColumnPanel from './TableColumnPanel';

const STORAGE_KEY = 'orderFormats';
const BROADCAST_CHANNEL = 'tableConfigChannel';

/* ─── Default standard columns ─── */
export const DEFAULT_COLUMNS = [
    { id: 'jan', label: 'JAN/商品コード', type: 'text', locked: true, visible: true, width: 140, editLocked: true },
    { id: 'name', label: '商品名', type: 'text', locked: true, visible: true, width: 200, editLocked: true },
    { id: 'spec', label: '規格', type: 'text', locked: false, visible: true, width: 100, editLocked: true },
    { id: 'quantity', label: '数量', type: 'number', locked: true, visible: true, width: 80, editLocked: false },
    { id: 'unit', label: '単位', type: 'text', locked: false, visible: true, width: 60, editLocked: true },
    { id: 'unitPrice', label: '単価', type: 'number', locked: false, visible: true, width: 100, editLocked: true },
    { id: 'subtotal', label: '小計', type: 'computed', locked: false, visible: true, width: 100, editLocked: true },
];

const DEFAULT_TABLE_CONFIG = {
    columns: DEFAULT_COLUMNS,
    showTotal: true,
    initialRows: 5,
    maxRows: null,
};

/* Column type options */
export const COLUMN_TYPES = [
    { value: 'text', label: 'テキスト（1行）' },
    { value: 'textarea', label: 'テキスト（複数行）' },
    { value: 'number', label: '数値' },
    { value: 'select', label: 'ドロップダウン' },
    { value: 'date', label: '日付' },
];

export default function TableConfigEditor({ formatId, fieldId, onClose, onSaved }) {
    const [tableConfig, setTableConfig] = useState(null);
    const [formatName, setFormatName] = useState('');
    const [activeColumnId, setActiveColumnId] = useState(null);
    const [dragActiveId, setDragActiveId] = useState(null);
    const [saved, setSaved] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    /* ─── Load config from localStorage ─── */
    useEffect(() => {
        if (!formatId || !fieldId) return;
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const formats = JSON.parse(raw);
        const fmt = formats.find(f => f.id === formatId);
        if (!fmt) return;
        setFormatName(fmt.name || '');
        const field = (fmt.fields || []).find(f => f.id === fieldId);
        if (!field) return;
        // Use existing config or create default
        setTableConfig(field.tableConfig ? JSON.parse(JSON.stringify(field.tableConfig)) : JSON.parse(JSON.stringify(DEFAULT_TABLE_CONFIG)));
    }, [formatId, fieldId]);

    /* ─── Save ─── */
    const handleSave = useCallback(() => {
        if (!formatId || !fieldId || !tableConfig) return;
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const formats = JSON.parse(raw);
        const fmtIdx = formats.findIndex(f => f.id === formatId);
        if (fmtIdx === -1) return;
        const fieldIdx = formats[fmtIdx].fields.findIndex(f => f.id === fieldId);
        if (fieldIdx === -1) return;

        formats[fmtIdx].fields[fieldIdx].tableConfig = JSON.parse(JSON.stringify(tableConfig));
        formats[fmtIdx].updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formats));

        // Notify parent via callback
        if (onSaved) onSaved();

        // Also try BroadcastChannel for other tabs
        try {
            const bc = new BroadcastChannel(BROADCAST_CHANNEL);
            bc.postMessage({ type: 'TABLE_CONFIG_SAVED', formatId, fieldId });
            bc.close();
        } catch (e) { /* BroadcastChannel not supported */ }

        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    }, [formatId, fieldId, tableConfig]);

    /* ─── Column CRUD ─── */
    const updateConfig = useCallback((updater) => {
        setTableConfig(prev => {
            if (!prev) return prev;
            return typeof updater === 'function' ? updater(prev) : updater;
        });
    }, []);

    const addColumn = useCallback((type = 'text') => {
        const newCol = {
            id: uuidv4(),
            label: '新しい列',
            type,
            locked: false,
            visible: true,
            width: 120,
            editLocked: false,
        };
        updateConfig(prev => ({
            ...prev,
            columns: [...prev.columns, newCol],
        }));
        setActiveColumnId(newCol.id);
    }, [updateConfig]);

    const removeColumn = useCallback((colId) => {
        updateConfig(prev => ({
            ...prev,
            columns: prev.columns.filter(c => c.id !== colId),
        }));
        if (activeColumnId === colId) setActiveColumnId(null);
    }, [updateConfig, activeColumnId]);

    const updateColumn = useCallback((updatedCol) => {
        updateConfig(prev => ({
            ...prev,
            columns: prev.columns.map(c => c.id === updatedCol.id ? updatedCol : c),
        }));
    }, [updateConfig]);

    const handleColumnResize = useCallback((colId, newWidth) => {
        updateConfig(prev => ({
            ...prev,
            columns: prev.columns.map(c => c.id === colId ? { ...c, width: Math.max(40, newWidth) } : c),
        }));
    }, [updateConfig]);

    /* ─── DnD for column reorder ─── */
    const handleDragStart = (event) => setDragActiveId(event.active.id);

    const handleDragEnd = (event) => {
        setDragActiveId(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        updateConfig(prev => {
            const oldIdx = prev.columns.findIndex(c => c.id === active.id);
            const newIdx = prev.columns.findIndex(c => c.id === over.id);
            return { ...prev, columns: arrayMove(prev.columns, oldIdx, newIdx) };
        });
    };

    if (!tableConfig) {
        return (
            <div className="tc-loading">
                <p>テーブル設定を読み込み中...</p>
                {(!formatId || !fieldId) && (
                    <p className="tc-error">URLパラメータが不足しています。親画面からアクセスしてください。</p>
                )}
            </div>
        );
    }

    const activeColumn = tableConfig.columns.find(c => c.id === activeColumnId);
    const dragActiveColumn = tableConfig.columns.find(c => c.id === dragActiveId);

    return (
        <div className="tc-editor">
            {/* ─── Header ─── */}
            <div className="tc-header">
                <div className="tc-header-left">
                    <h1 className="tc-title">商品明細テーブル設定</h1>
                    {formatName && <span className="tc-format-name">フォーマット: {formatName}</span>}
                </div>
                <div className="tc-header-right">
                    {saved && <span className="tc-saved-badge">✓ 保存しました</span>}
                    <button className="btn btn-primary" onClick={handleSave}>
                        💾 設定を保存
                    </button>
                    {onClose && (
                        <button className="btn btn-secondary" onClick={onClose}>
                            閉じる
                        </button>
                    )}
                </div>
            </div>

            {/* ─── Main Area ─── */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="tc-main">
                    {/* Left: Preview */}
                    <div className="tc-preview-area">
                        <div className="tc-section-header">
                            <h2>テーブルプレビュー</h2>
                            <p className="text-muted">列ヘッダーをドラッグで並び替え。列の境界線をドラッグで幅を調整できます。</p>
                        </div>
                        <TablePreview
                            columns={tableConfig.columns}
                            initialRows={tableConfig.initialRows}
                            showTotal={tableConfig.showTotal}
                            activeColumnId={activeColumnId}
                            onSelectColumn={setActiveColumnId}
                            onColumnResize={handleColumnResize}
                        />

                        {/* ─── Global settings ─── */}
                        <div className="tc-global-settings">
                            <h3>テーブル全体設定</h3>
                            <div className="tc-settings-grid">
                                <div className="tc-setting-item">
                                    <label>初期表示行数</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="1"
                                        max="50"
                                        value={tableConfig.initialRows}
                                        onChange={(e) => updateConfig(prev => ({ ...prev, initialRows: Math.max(1, parseInt(e.target.value) || 1) }))}
                                    />
                                </div>
                                <div className="tc-setting-item">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={tableConfig.maxRows !== null}
                                            onChange={(e) => updateConfig(prev => ({ ...prev, maxRows: e.target.checked ? 50 : null }))}
                                        />
                                        最大行数を制限する
                                    </label>
                                    {tableConfig.maxRows !== null && (
                                        <input
                                            type="number"
                                            className="form-input"
                                            min="1"
                                            max="999"
                                            value={tableConfig.maxRows}
                                            onChange={(e) => updateConfig(prev => ({ ...prev, maxRows: Math.max(1, parseInt(e.target.value) || 1) }))}
                                        />
                                    )}
                                </div>
                                <div className="tc-setting-item">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={tableConfig.showTotal}
                                            onChange={(e) => updateConfig(prev => ({ ...prev, showTotal: e.target.checked }))}
                                        />
                                        合計金額行を表示する
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Column Panel */}
                    <div className="tc-column-panel-area">
                        <TableColumnPanel
                            column={activeColumn}
                            onUpdate={updateColumn}
                            onRemove={removeColumn}
                            onAddColumn={addColumn}
                            allColumns={tableConfig.columns}
                        />
                    </div>
                </div>

                <DragOverlay>
                    {dragActiveColumn && (
                        <div className="tc-drag-overlay-col">
                            {dragActiveColumn.label}
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
