'use client';

const TEXT_ALIGN_OPTIONS = [
    { value: 'left', label: '左寄せ' },
    { value: 'center', label: '中央揃え' },
    { value: 'right', label: '右寄せ' },
];

export default function PropertyPanel({ activeField, onChange, formatId, onOpenTableConfig }) {
    if (!activeField) {
        return (
            <div className="fb-properties-empty">
                <p>
                    プレビュー上で項目を選択すると
                    <br />
                    ここで詳細設定ができます。
                </p>
            </div>
        );
    }

    const isFixed = activeField.type === 'product-table';
    const isSpacer = activeField.type === 'spacer';
    const isTextInput = ['text', 'company', 'address', 'phone', 'fax'].includes(activeField.type);
    const canToggleMultiline = isTextInput && activeField.type !== 'textarea';
    const isMultiline = activeField.type === 'textarea' || activeField.multiline || activeField.type === 'address';
    const multilineRows = activeField.rows || (activeField.type === 'address' ? 4 : 3);
    const multilineTextAlign = activeField.textAlign || 'left';

    const openTableConfig = () => {
        if (!formatId) {
            alert('先にフォーマットを保存してください。');
            return;
        }

        if (onOpenTableConfig) {
            onOpenTableConfig(activeField.id);
        }
    };

    return (
        <div className="fb-properties-panel">
            <div className="fb-properties-header">
                <h3>詳細設定</h3>
                <span className="badge">{activeField.type.toUpperCase()}</span>
            </div>

            <div className="fb-properties-body">
                {isFixed ? (
                    <div className="prop-group info-group">
                        <p className="text-muted">このパーツは発注書に必須の「商品明細テーブル」です。</p>
                        <p className="text-muted mt-sm">常に全幅で表示されます。</p>
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: '12px', width: '100%', fontSize: '0.85rem' }}
                            onClick={openTableConfig}
                        >
                            商品明細テーブルを詳細設定する
                        </button>
                        {!formatId && (
                            <small className="text-muted" style={{ display: 'block', marginTop: '6px', color: 'var(--danger)' }}>
                                保存後にテーブル設定を編集できます。
                            </small>
                        )}
                    </div>
                ) : isSpacer ? (
                    <>
                        <div className="prop-group info-group">
                            <p className="text-muted">空白スペースを追加します。複数行テキストや明細テーブルとの間隔調整に使います。</p>
                        </div>
                        <div className="prop-group">
                            <label>幅</label>
                            <select
                                className="form-input"
                                value={activeField.colSpan || 1}
                                onChange={(e) => onChange({ ...activeField, colSpan: parseInt(e.target.value, 10) })}
                            >
                                <option value={1}>1/4 (25%)</option>
                                <option value={2}>2/4 (50%)</option>
                                <option value={3}>3/4 (75%)</option>
                            </select>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="prop-group">
                            <label>
                                項目ラベル <span className="req">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                value={activeField.label || ''}
                                onChange={(e) => onChange({ ...activeField, label: e.target.value })}
                            />
                        </div>

                        {canToggleMultiline && (
                            <div className="prop-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={isMultiline}
                                        onChange={(e) => onChange({ ...activeField, multiline: e.target.checked })}
                                    />
                                    複数行テキストとして表示する
                                </label>
                                <small className="text-muted mt-xs block">
                                    住所や宛名のように改行を含む内容を配置する場合に使います。
                                </small>
                            </div>
                        )}

                        {isMultiline && (
                            <>
                                <div className="prop-group">
                                    <label>行数</label>
                                    <select
                                        className="form-input"
                                        value={multilineRows}
                                        onChange={(e) => onChange({ ...activeField, rows: parseInt(e.target.value, 10) })}
                                    >
                                        <option value={2}>2行</option>
                                        <option value={3}>3行</option>
                                        <option value={4}>4行</option>
                                        <option value={5}>5行</option>
                                        <option value={6}>6行</option>
                                    </select>
                                </div>

                                <div className="prop-group">
                                    <label>テキスト揃え</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                        {TEXT_ALIGN_OPTIONS.map(option => {
                                            const isSelected = multilineTextAlign === option.value;

                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    className="btn"
                                                    onClick={() => onChange({ ...activeField, textAlign: option.value })}
                                                    style={{
                                                        padding: '8px 10px',
                                                        fontSize: '0.8rem',
                                                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                                                        background: isSelected ? 'rgba(13, 148, 136, 0.08)' : '#fff',
                                                        color: isSelected ? 'var(--primary-dark)' : 'var(--text-secondary)',
                                                    }}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeField.type === 'select' && (
                            <div className="prop-group">
                                <label>選択肢</label>
                                <textarea
                                    className="form-input"
                                    rows="4"
                                    value={activeField.options ? activeField.options.join(',') : ''}
                                    onChange={(e) => {
                                        const opts = e.target.value
                                            .split(',')
                                            .map(option => option.trim())
                                            .filter(Boolean);

                                        onChange({ ...activeField, options: opts });
                                    }}
                                    placeholder="例: 選択肢A, 選択肢B, 選択肢C"
                                />
                                <small className="text-muted mt-xs block">カンマ区切りで入力します。</small>
                            </div>
                        )}

                        <div className="prop-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={activeField.required || false}
                                    onChange={(e) => onChange({ ...activeField, required: e.target.checked })}
                                />
                                必須項目にする
                            </label>
                        </div>

                        <div className="prop-group">
                            <label>幅</label>
                            <select
                                className="form-input"
                                value={activeField.colSpan || 4}
                                onChange={(e) => onChange({ ...activeField, colSpan: parseInt(e.target.value, 10) })}
                            >
                                <option value={1}>1/4 (25%)</option>
                                <option value={2}>2/4 (50%)</option>
                                <option value={3}>3/4 (75%)</option>
                                <option value={4}>全幅 (100%)</option>
                            </select>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
