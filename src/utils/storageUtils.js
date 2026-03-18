/**
 * ストレージユーティリティ
 * デモ環境でのデータ永続化を提供
 */

const STORAGE_KEYS = {
    MAKER_RULES: 'demo_maker_rules',
    TEMPLATES: 'demo_templates',
    FACILITY_CODE_COUNTER: 'facility_code_counter',
    FACILITIES: 'demo_facilities'
};

/**
 * メーカールールを取得
 */
export function getMakerRules() {
    if (typeof window === 'undefined') return null;

    const data = localStorage.getItem(STORAGE_KEYS.MAKER_RULES);
    return data ? JSON.parse(data) : null;
}

/**
 * メーカールールを保存
 */
export function saveMakerRules(rules) {
    if (typeof window === 'undefined') return;

    localStorage.setItem(STORAGE_KEYS.MAKER_RULES, JSON.stringify(rules));
}

/**
 * テンプレートを取得
 */
export function getTemplates() {
    if (typeof window === 'undefined') return null;

    const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    return data ? JSON.parse(data) : null;
}

/**
 * テンプレートを保存
 */
export function saveTemplates(templates) {
    if (typeof window === 'undefined') return;

    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
}

/**
 * 施設コードを生成
 * フォーマット: FCD-XXXXX (5桁連番)
 */
export function generateFacilityCode() {
    if (typeof window === 'undefined') return 'FCD-00001';

    let counter = parseInt(localStorage.getItem(STORAGE_KEYS.FACILITY_CODE_COUNTER) || '0', 10);
    counter += 1;
    localStorage.setItem(STORAGE_KEYS.FACILITY_CODE_COUNTER, counter.toString());

    return `FCD-${counter.toString().padStart(5, '0')}`;
}

/**
 * 施設一覧を取得
 */
export function getFacilities() {
    if (typeof window === 'undefined') return null;

    const data = localStorage.getItem(STORAGE_KEYS.FACILITIES);
    return data ? JSON.parse(data) : null;
}

/**
 * 施設一覧を保存
 */
export function saveFacilities(facilities) {
    if (typeof window === 'undefined') return;

    localStorage.setItem(STORAGE_KEYS.FACILITIES, JSON.stringify(facilities));
}

export { STORAGE_KEYS };
