'use client';
import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// A4サイズ（ピクセル換算 72dpi）
const A4_WIDTH = 595;
const A4_HEIGHT = 842;

export default function A4FormBuilder({ templateId, onSave }) {
    const [templateName, setTemplateName] = useState('');
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const canvasRef = useRef(null);

    // 新規アイテムを追加
    const addItem = (type) => {
        const newItem = {
            id: uuidv4(),
            type,
            x: 50,
            y: 50 + items.length * 30,
            width: type === 'logo' ? 150 : 200,
            height: type === 'logo' ? 50 : 30,
            content: type === 'text' ? 'テキストを入力' : '',
            fontSize: 12,
            fontWeight: 'normal',
            textAlign: 'left',
            backgroundColor: 'transparent',
            borderColor: type === 'text' ? '#ccc' : 'transparent',
            imageUrl: ''
        };
        setItems([...items, newItem]);
        setSelectedItem(newItem.id);
    };

    // アイテムを削除
    const deleteItem = (id) => {
        setItems(items.filter(item => item.id !== id));
        if (selectedItem === id) {
            setSelectedItem(null);
        }
    };

    // アイテムを更新
    const updateItem = (id, updates) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, ...updates } : item
        ));
    };

    // ドラッグ開始
    const handleMouseDown = (e, item) => {
        if (e.target.classList.contains('resize-handle')) return;

        e.preventDefault();
        setSelectedItem(item.id);
        setIsDragging(true);

        const rect = canvasRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left - item.x,
            y: e.clientY - rect.top - item.y
        });
    };

    // ドラッグ中
    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !selectedItem) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(A4_WIDTH - 50, e.clientX - rect.left - dragOffset.x));
        const y = Math.max(0, Math.min(A4_HEIGHT - 20, e.clientY - rect.top - dragOffset.y));

        updateItem(selectedItem, { x, y });
    }, [isDragging, selectedItem, dragOffset]);

    // ドラッグ終了
    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // 画像アップロード
    const handleImageUpload = (e, itemId) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            updateItem(itemId, {
                imageUrl: ev.target.result,
                content: file.name
            });
        };
        reader.readAsDataURL(file);
    };

    // テンプレート保存
    const handleSave = () => {
        if (!templateName.trim()) {
            alert('テンプレート名を入力してください');
            return;
        }

        const template = {
            id: templateId || uuidv4(),
            name: templateName,
            canvasType: 'a4',
            items: items,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        // ローカルストレージに保存
        const templates = JSON.parse(localStorage.getItem('formLayouts') || '[]');
        const existingIndex = templates.findIndex(t => t.id === template.id);
        if (existingIndex >= 0) {
            templates[existingIndex] = template;
        } else {
            templates.push(template);
        }
        localStorage.setItem('formLayouts', JSON.stringify(templates));

        if (onSave) {
            onSave(template);
        }
        alert('テンプレートを保存しました');
    };

    const selectedItemData = items.find(item => item.id === selectedItem);

    return (
        <div
            className="min-h-screen bg-slate-900"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* ヘッダー */}
            <div className="bg-slate-800 border-b border-slate-700 px-4 py-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-bold text-white">📄 A4フォームビルダー</h1>
                        <input
                            type="text"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="テンプレート名..."
                            className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 text-sm w-48"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded shadow transition-colors"
                        >
                            💾 保存
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex h-[calc(100vh-60px)]">
                {/* 左パネル：ツールボックス */}
                <div className="w-56 bg-slate-800 border-r border-slate-700 p-3 overflow-y-auto">
                    <h2 className="text-sm font-semibold text-white mb-3">🧰 パーツ追加</h2>
                    <div className="space-y-2">
                        <button
                            onClick={() => addItem('text')}
                            className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-white text-sm flex items-center gap-2"
                        >
                            📝 テキストボックス
                        </button>
                        <button
                            onClick={() => addItem('logo')}
                            className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-white text-sm flex items-center gap-2"
                        >
                            🖼️ ロゴ/画像
                        </button>
                        <button
                            onClick={() => addItem('line')}
                            className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-white text-sm flex items-center gap-2"
                        >
                            ➖ 区切り線
                        </button>
                        <button
                            onClick={() => addItem('table')}
                            className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-white text-sm flex items-center gap-2"
                        >
                            📊 テーブル
                        </button>
                    </div>

                    {/* 選択中アイテムのプロパティ */}
                    {selectedItemData && (
                        <div className="mt-6 pt-4 border-t border-slate-700">
                            <h3 className="text-sm font-semibold text-white mb-3">⚙️ プロパティ</h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">X座標</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedItemData.x)}
                                        onChange={(e) => updateItem(selectedItem, { x: parseInt(e.target.value) || 0 })}
                                        className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Y座標</label>
                                    <input
                                        type="number"
                                        value={Math.round(selectedItemData.y)}
                                        onChange={(e) => updateItem(selectedItem, { y: parseInt(e.target.value) || 0 })}
                                        className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">幅</label>
                                    <input
                                        type="number"
                                        value={selectedItemData.width}
                                        onChange={(e) => updateItem(selectedItem, { width: parseInt(e.target.value) || 50 })}
                                        className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">高さ</label>
                                    <input
                                        type="number"
                                        value={selectedItemData.height}
                                        onChange={(e) => updateItem(selectedItem, { height: parseInt(e.target.value) || 20 })}
                                        className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                    />
                                </div>
                                {selectedItemData.type === 'text' && (
                                    <>
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">フォントサイズ</label>
                                            <input
                                                type="number"
                                                value={selectedItemData.fontSize}
                                                onChange={(e) => updateItem(selectedItem, { fontSize: parseInt(e.target.value) || 12 })}
                                                className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">太字</label>
                                            <select
                                                value={selectedItemData.fontWeight}
                                                onChange={(e) => updateItem(selectedItem, { fontWeight: e.target.value })}
                                                className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                                            >
                                                <option value="normal">標準</option>
                                                <option value="bold">太字</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                {selectedItemData.type === 'logo' && (
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">画像</label>
                                        <label className="block w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-white text-xs text-center cursor-pointer hover:bg-slate-500">
                                            📤 画像選択
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png"
                                                onChange={(e) => handleImageUpload(e, selectedItem)}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                )}
                                <button
                                    onClick={() => deleteItem(selectedItem)}
                                    className="w-full px-2 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded text-sm transition-colors"
                                >
                                    🗑️ 削除
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 中央：A4キャンバス */}
                <div className="flex-1 p-4 overflow-auto flex items-start justify-center bg-slate-700/30">
                    <div
                        ref={canvasRef}
                        className="relative bg-white shadow-2xl"
                        style={{
                            width: A4_WIDTH,
                            height: A4_HEIGHT,
                            backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}
                    >
                        {items.map(item => (
                            <div
                                key={item.id}
                                className={`absolute cursor-move ${selectedItem === item.id ? 'ring-2 ring-blue-500' : ''}`}
                                style={{
                                    left: item.x,
                                    top: item.y,
                                    width: item.width,
                                    height: item.height,
                                    backgroundColor: item.backgroundColor,
                                    border: item.borderColor !== 'transparent' ? `1px solid ${item.borderColor}` : 'none'
                                }}
                                onMouseDown={(e) => handleMouseDown(e, item)}
                            >
                                {item.type === 'text' && (
                                    <input
                                        type="text"
                                        value={item.content}
                                        onChange={(e) => updateItem(item.id, { content: e.target.value })}
                                        className="w-full h-full bg-transparent outline-none px-1"
                                        style={{
                                            fontSize: item.fontSize,
                                            fontWeight: item.fontWeight,
                                            textAlign: item.textAlign
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                                {item.type === 'logo' && (
                                    item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt="logo"
                                            className="w-full h-full object-contain"
                                            draggable={false}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs border-2 border-dashed border-gray-300 bg-gray-50">
                                            🖼️ 画像
                                        </div>
                                    )
                                )}
                                {item.type === 'line' && (
                                    <div className="w-full h-0 border-t-2 border-gray-400 absolute top-1/2" />
                                )}
                                {item.type === 'table' && (
                                    <div className="w-full h-full border border-gray-400 bg-gray-50 flex items-center justify-center text-xs text-gray-500">
                                        📊 テーブル
                                    </div>
                                )}

                                {/* リサイズハンドル */}
                                {selectedItem === item.id && (
                                    <div
                                        className="resize-handle absolute w-3 h-3 bg-blue-500 cursor-se-resize"
                                        style={{ right: -6, bottom: -6 }}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            // リサイズロジック（シンプル版）
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 右パネル：ヒント */}
                <div className="w-48 bg-slate-800 border-l border-slate-700 p-3">
                    <h3 className="text-sm font-semibold text-white mb-2">💡 ヒント</h3>
                    <ul className="text-xs text-slate-400 space-y-1">
                        <li>• 左からパーツを追加</li>
                        <li>• ドラッグで自由配置</li>
                        <li>• クリックで選択</li>
                        <li>• プロパティで詳細調整</li>
                    </ul>
                    <div className="mt-4 pt-3 border-t border-slate-700">
                        <div className="text-xs text-slate-500">
                            A4サイズ<br />
                            {A4_WIDTH} × {A4_HEIGHT} px
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
