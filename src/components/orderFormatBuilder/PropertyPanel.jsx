'use client';

export default function PropertyPanel({ activeField, onChange, formatId, onOpenTableConfig }) {
    if (!activeField) {
        return (
            <div className="fb-properties-empty">
                <p>プレビュー領域で項目を選択すると<br />ここで詳細設定ができます</p>
            </div>
        );
    }

    const isFixed = activeField.type === 'product-table';
    const isSpacer = activeField.type === 'spacer';
    const isTextInput = ['text', 'company', 'address', 'phone', 'fax'].includes(activeField.type);

    const openTableConfig = () => {
        if (!formatId) {
            alert('先にフォーマットを一度保存してください。');
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
                        <p className="text-muted mt-sm">常に全幅（4/4カラム）で表示されます。</p>
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: '12px', width: '100%', fontSize: '0.85rem' }}
                            onClick={openTableConfig}
                        >
                            📋 明細テーブルを詳細設定する
                        </button>
                        {!formatId && (
                            <small className="text-muted" style={{ display: 'block', marginTop: '6px', color: 'var(--danger)' }}>
                                ※ フォーマットを保存した後に利用できます
                            </small>
                        )}
                    </div>
                ) : isSpacer ? (
                    <>
                        <div className="prop-group info-group">
                            <p className="text-muted">空白スペースを挿入します。横幅を設定して、他の項目との間に余白を作れます。</p>
                        </div>
                        <div className="prop-group">
                            <label>横幅（カラム数）</label>
                            <select
                                className="form-input"
                                value={activeField.colSpan || 1}
                                onChange={(e) => onChange({ ...activeField, colSpan: parseInt(e.target.value) })}
                            >
                                <option value={1}>1/4 (25%)</option>
                                <option value={2}>2/4 (50%)</option>
                                <option value={3}>3/4 (75%)</option>
                            </select>
                            <small className="text-muted mt-xs block">
                                配置位置はプレビュー上でドラッグ＆ドロップして調整できます。
                            </small>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="prop-group">
                            <label>項目名（ラベル） <span className="req">*</span></label>
                            <input
                                type="text"
                                className="form-input"
                                value={activeField.label || ''}
                                onChange={(e) => onChange({ ...activeField, label: e.target.value })}
                            />
                        </div>

                        {activeField.type === 'select' && (
                            <div className="prop-group">
                                <label>選択肢（カンマ区切りで入力）</label>
                                <textarea
                                    className="form-input"
                                    rows="4"
                                    value={activeField.options ? activeField.options.join(',') : ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const opts = val.split(',').map(s => s.trim()).filter(s => s !== '');
                                        onChange({ ...activeField, options: opts });
                                    }}
                                    placeholder="例: オプションA, オプションB, オプションC"
                                />
                                <small className="text-muted mt-xs block">カンマ(,)で区切って複数入力できます。</small>
                            </div>
                        )}

                        <div className="prop-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={activeField.required || false}
                                    onChange={(e) => onChange({ ...activeField, required: e.target.checked })}
                                />
                                この項目を必須入力にする
                            </label>
                        </div>

                        {/* 幅 (colSpan) */}
                        <div className="prop-group">
                            <label>横幅（カラム数）</label>
                            <select
                                className="form-input"
                                value={activeField.colSpan || 4}
                                onChange={(e) => onChange({ ...activeField, colSpan: parseInt(e.target.value) })}
                            >
                                <option value={1}>1/4 (25%)</option>
                                <option value={2}>2/4 (50%)</option>
                                <option value={3}>3/4 (75%)</option>
                                <option value={4}>全幅 (100%)</option>
                            </select>
                            <small className="text-muted mt-xs block">
                                配置位置はプレビュー上でドラッグ＆ドロップして調整できます。
                            </small>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
