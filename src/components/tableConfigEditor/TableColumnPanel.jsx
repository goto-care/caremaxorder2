'use client';
import { COLUMN_TYPES } from './TableConfigEditor';

export default function TableColumnPanel({ column, onUpdate, onRemove, onAddColumn, allColumns }) {
    if (!column) {
        return (
            <div className="tc-panel">
                <div className="tc-panel-header">
                    <h3>列設定</h3>
                </div>
                <div className="tc-panel-body">
                    <div className="tc-panel-empty">
                        <p>テーブルの列ヘッダーをクリックすると<br />ここで詳細設定ができます</p>
                    </div>
                    <hr className="tc-divider" />
                    <div className="tc-add-column-section">
                        <h4>列を追加する</h4>
                        <div className="tc-add-column-buttons">
                            {COLUMN_TYPES.map(ct => (
                                <button
                                    key={ct.value}
                                    className="btn btn-sm tc-add-col-btn"
                                    onClick={() => onAddColumn(ct.value)}
                                >
                                    + {ct.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr className="tc-divider" />
                    <div className="tc-column-list-section">
                        <h4>全列一覧</h4>
                        <ul className="tc-column-list">
                            {allColumns.map(c => (
                                <li key={c.id} className={`tc-column-list-item ${!c.visible ? 'tc-col-hidden' : ''}`}>
                                    {c.locked && <span className="tc-lock-icon-sm">🔒</span>}
                                    <span className="tc-col-list-label">{c.label}</span>
                                    {!c.visible && <span className="tc-col-hidden-badge">非表示</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    const isStandardLocked = column.locked;

    return (
        <div className="tc-panel">
            <div className="tc-panel-header">
                <h3>列設定</h3>
                <span className="badge">{column.type.toUpperCase()}</span>
            </div>
            <div className="tc-panel-body">
                {/* Label */}
                <div className="tc-prop-group">
                    <label>列名（ラベル）</label>
                    <input
                        type="text"
                        className="form-input"
                        value={column.label}
                        onChange={(e) => onUpdate({ ...column, label: e.target.value })}
                    />
                </div>

                {/* Type (only for custom columns) */}
                {!isStandardLocked && (
                    <div className="tc-prop-group">
                        <label>データ型</label>
                        <select
                            className="form-input"
                            value={column.type}
                            onChange={(e) => onUpdate({ ...column, type: e.target.value })}
                        >
                            {COLUMN_TYPES.map(ct => (
                                <option key={ct.value} value={ct.value}>{ct.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Width */}
                <div className="tc-prop-group">
                    <label>列幅（px）</label>
                    <input
                        type="number"
                        className="form-input"
                        min="40"
                        max="500"
                        value={column.width}
                        onChange={(e) => onUpdate({ ...column, width: Math.max(40, parseInt(e.target.value) || 40) })}
                    />
                    <small className="text-muted">テーブル上で列の境界線をドラッグしても調整できます。</small>
                </div>

                {/* Visible toggle */}
                {!isStandardLocked && (
                    <div className="tc-prop-group tc-checkbox-group">
                        <label className="tc-checkbox-label">
                            <input
                                type="checkbox"
                                checked={column.visible}
                                onChange={(e) => onUpdate({ ...column, visible: e.target.checked })}
                            />
                            この列を表示する
                        </label>
                    </div>
                )}

                {/* Edit locked toggle */}
                <div className="tc-prop-group tc-checkbox-group">
                    <label className="tc-checkbox-label">
                        <input
                            type="checkbox"
                            checked={column.editLocked}
                            onChange={(e) => onUpdate({ ...column, editLocked: e.target.checked })}
                        />
                        入力をロックする（マスタ参照のみ）
                    </label>
                    <small className="text-muted">ONにすると、発注時にこの列の手入力ができなくなります。</small>
                </div>

                {/* Select options */}
                {column.type === 'select' && (
                    <div className="tc-prop-group">
                        <label>選択肢（カンマ区切り）</label>
                        <textarea
                            className="form-input"
                            rows="3"
                            value={column.options ? column.options.join(',') : ''}
                            onChange={(e) => {
                                const opts = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
                                onUpdate({ ...column, options: opts });
                            }}
                            placeholder="例: 選択肢A, 選択肢B, 選択肢C"
                        />
                    </div>
                )}

                {/* Locked info */}
                {isStandardLocked && (
                    <div className="tc-info-box">
                        🔒 この列はシステム標準の必須列です。削除や非表示にすることはできません。
                    </div>
                )}

                {/* Delete button */}
                {!isStandardLocked && (
                    <div className="tc-prop-group" style={{ marginTop: '16px' }}>
                        <button
                            className="btn tc-btn-danger"
                            onClick={() => onRemove(column.id)}
                        >
                            🗑 この列を削除する
                        </button>
                    </div>
                )}

                <hr className="tc-divider" />

                {/* Add column section */}
                <div className="tc-add-column-section">
                    <h4>列を追加する</h4>
                    <div className="tc-add-column-buttons">
                        {COLUMN_TYPES.map(ct => (
                            <button
                                key={ct.value}
                                className="btn btn-sm tc-add-col-btn"
                                onClick={() => onAddColumn(ct.value)}
                            >
                                + {ct.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
