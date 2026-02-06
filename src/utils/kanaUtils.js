/**
 * カナ文字の正規化ユーティリティ
 * 半角カナ⇔全角カナの相互変換と検索用正規化を提供
 */

// 半角カナから全角カナへの変換マップ
const hankakuToZenkakuMap = {
    'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
    'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
    'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
    'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
    'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
    'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
    'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
    'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
    'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
    'ﾜ': 'ワ', 'ｦ': 'ヲ', 'ﾝ': 'ン',
    'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
    'ｯ': 'ッ', 'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ',
    'ｰ': 'ー', '｡': '。', '｢': '「', '｣': '」', '､': '、', '･': '・'
};

// 濁点・半濁点の処理
const dakutenMap = {
    'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
    'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
    'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
    'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
    'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
    'ｳﾞ': 'ヴ'
};

/**
 * 半角カナを全角カナに変換
 * @param {string} str - 変換対象の文字列
 * @returns {string} 全角カナに変換された文字列
 */
export function hankakuToZenkaku(str) {
    if (!str) return '';

    let result = str;

    // 濁点・半濁点の組み合わせを先に処理
    for (const [hankaku, zenkaku] of Object.entries(dakutenMap)) {
        result = result.replace(new RegExp(hankaku, 'g'), zenkaku);
    }

    // 単独の半角カナを処理
    for (const [hankaku, zenkaku] of Object.entries(hankakuToZenkakuMap)) {
        result = result.replace(new RegExp(hankaku, 'g'), zenkaku);
    }

    return result;
}

/**
 * 検索用に文字列を正規化
 * - 半角カナを全角カナに変換
 * - 小文字に変換
 * - 全角英数を半角に変換
 * @param {string} str - 正規化対象の文字列
 * @returns {string} 正規化された文字列
 */
export function normalizeForSearch(str) {
    if (!str) return '';

    let result = hankakuToZenkaku(str);

    // 全角英数を半角に変換
    result = result.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
        return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
    });

    // 小文字に変換
    result = result.toLowerCase();

    return result;
}

/**
 * 検索マッチング関数
 * 正規化した文字列同士で比較を行う
 * @param {string} target - 検索対象の文字列
 * @param {string} query - 検索クエリ
 * @returns {boolean} マッチするかどうか
 */
export function matchesSearch(target, query) {
    if (!query) return true;
    if (!target) return false;

    const normalizedTarget = normalizeForSearch(target);
    const normalizedQuery = normalizeForSearch(query);

    return normalizedTarget.includes(normalizedQuery);
}
