const DEFAULT_ROW_COUNT = 2;
const MIN_ROW_COUNT = 2;
const MAX_ROW_COUNT = 3;

export const DEFAULT_PRODUCT_TABLE_COLUMNS = [
    { id: 'jan', label: 'JAN/商品コード', type: 'text', locked: true, visible: true, width: 170, rowIndex: 1 },
    { id: 'name', label: '商品名', type: 'text', locked: true, visible: true, width: 220, rowIndex: 1 },
    { id: 'quantity', label: '数量(袋)', type: 'number', locked: true, visible: true, width: 88, rowIndex: 1 },
    { id: 'unitPrice', label: '単価', type: 'number', locked: false, visible: true, width: 100, rowIndex: 1 },
    { id: 'subtotal', label: '販売金額', type: 'computed', locked: false, visible: true, width: 120, rowIndex: 1 },
    { id: 'remarks', label: '備考', type: 'text', locked: false, visible: true, width: 160, rowIndex: 1 },
    { id: 'spec', label: '内容・規格', type: 'text', locked: false, visible: true, width: 220, rowIndex: 2 },
];

export const DEFAULT_PRODUCT_TABLE_CONFIG = {
    columns: DEFAULT_PRODUCT_TABLE_COLUMNS,
    showTotal: true,
    initialRows: 5,
    maxRows: null,
    recordRowCount: DEFAULT_ROW_COUNT,
};

function clampRecordRowCount(value) {
    const rowCount = Number(value) || DEFAULT_ROW_COUNT;
    return Math.min(MAX_ROW_COUNT, Math.max(MIN_ROW_COUNT, rowCount));
}

function clampColumnRowIndex(rowIndex, recordRowCount = DEFAULT_ROW_COUNT) {
    const safeRowCount = clampRecordRowCount(recordRowCount);
    const normalizedRowIndex = Number(rowIndex) || 1;
    return Math.min(safeRowCount, Math.max(1, normalizedRowIndex));
}

function inferRowIndex(column) {
    if (column?.rowIndex >= 1 && column.rowIndex <= MAX_ROW_COUNT) return column.rowIndex;

    const label = String(column?.label || '');

    if (column?.id === 'spec') return 2;
    if (/[内容規格カテゴリ]/.test(label)) return 2;
    if (/内容|規格/.test(label)) return 2;

    return 1;
}

function withClampedRowIndex(column, recordRowCount = DEFAULT_ROW_COUNT) {
    return {
        ...column,
        rowIndex: clampColumnRowIndex(column?.rowIndex, recordRowCount),
    };
}

export function sanitizeProductTableColumn(column) {
    return withClampedRowIndex({
        ...column,
        width: Math.max(40, Number(column?.width) || 120),
        rowIndex: inferRowIndex(column),
    }, MAX_ROW_COUNT);
}

export function normalizeProductTableColumns(columns, recordRowCount = DEFAULT_ROW_COUNT) {
    return (columns || []).map(column => withClampedRowIndex(sanitizeProductTableColumn(column), recordRowCount));
}

export function sanitizeProductTableConfig(config) {
    const source = config || DEFAULT_PRODUCT_TABLE_CONFIG;
    const recordRowCount = clampRecordRowCount(source.recordRowCount || source.itemRowCount || DEFAULT_ROW_COUNT);

    return {
        ...DEFAULT_PRODUCT_TABLE_CONFIG,
        ...source,
        recordRowCount,
        columns: normalizeProductTableColumns(source.columns || DEFAULT_PRODUCT_TABLE_COLUMNS, recordRowCount),
    };
}

export function getVisibleProductTableColumns(tableConfig = DEFAULT_PRODUCT_TABLE_CONFIG) {
    return sanitizeProductTableConfig(tableConfig).columns.filter(column => column.visible);
}

export function getProductTableRowGroups(columns, recordRowCount = DEFAULT_ROW_COUNT) {
    const safeRowCount = clampRecordRowCount(recordRowCount);
    const groups = Array.from({ length: safeRowCount }, () => []);

    normalizeProductTableColumns(columns, safeRowCount).forEach((column) => {
        groups[column.rowIndex - 1].push(column);
    });

    return groups;
}

export function getProductTableLayoutSlots(columns, recordRowCount = DEFAULT_ROW_COUNT) {
    const safeRowCount = clampRecordRowCount(recordRowCount);
    const normalizedColumns = normalizeProductTableColumns(columns, safeRowCount);
    const slots = [];

    normalizedColumns.forEach((column) => {
        const targetRowIndex = clampColumnRowIndex(column.rowIndex, safeRowCount) - 1;
        let targetSlot = null;

        if (targetRowIndex > 0) {
            for (let index = slots.length - 1; index >= 0; index -= 1) {
                const candidateSlot = slots[index];
                const hasUpperColumn = candidateSlot.columns.slice(0, targetRowIndex).some(Boolean);

                if (!hasUpperColumn || candidateSlot.columns[targetRowIndex]) continue;

                targetSlot = candidateSlot;
                break;
            }
        }

        if (!targetSlot) {
            targetSlot = {
                columns: Array.from({ length: safeRowCount }, () => null),
            };
            slots.push(targetSlot);
        }

        targetSlot.columns[targetRowIndex] = column;
    });

    return slots.map((slot) => ({
        ...slot,
        width: slot.columns.reduce((maxWidth, column) => (
            column ? Math.max(maxWidth, Math.max(40, Number(column.width) || 120)) : maxWidth
        ), 40),
    }));
}

export function getProductTableLayoutRows(columns, recordRowCount = DEFAULT_ROW_COUNT) {
    const safeRowCount = clampRecordRowCount(recordRowCount);
    const layoutSlots = getProductTableLayoutSlots(columns, safeRowCount);

    return Array.from({ length: safeRowCount }, (_, rowIndex) => (
        layoutSlots.map(slot => slot.columns[rowIndex] || null)
    ));
}

export function getProductTableGridTemplate(columns = []) {
    return columns
        .map((column) => `minmax(0, ${Math.max(40, Number(column.width) || 120)}fr)`)
        .join(' ');
}

export function getProductTableSlotGridTemplate(slots = []) {
    return slots
        .map((slot) => `minmax(0, ${Math.max(40, Number(slot?.width) || 120)}fr)`)
        .join(' ');
}
