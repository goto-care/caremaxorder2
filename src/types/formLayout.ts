// フォームレイアウトの型定義

/**
 * フォームレイアウトアイテムの種類
 */
export type FormItemType = 'product' | 'header' | 'note';

/**
 * すべてのフォームアイテムの共通プロパティ
 */
export interface BaseFormItem {
    id: string;
    type: FormItemType;
}

/**
 * 商品アイテム
 * - 商品マスタから選択された商品を表示
 * - 数量入力欄と単位選択を含む
 */
export interface ProductFormItem extends BaseFormItem {
    type: 'product';
    productId: string;           // 商品マスタへの参照
    defaultUnit: 'case' | 'piece'; // デフォルト単位（ケース/バラ）
    defaultQuantity?: number;    // デフォルト数量（省略可能）
    productName?: string;        // 表示用商品名（参照解決後）
    specification?: string;      // 表示用規格
    janCode?: string;            // 表示用JANコード
}

/**
 * 見出しアイテム
 * - カテゴリ区切り用の見出しバー
 * - テキストは編集可能
 */
export interface HeaderFormItem extends BaseFormItem {
    type: 'header';
    textValue: string;           // 見出しテキスト
    backgroundColor?: string;    // オプション：背景色（デフォルト: グレー）
}

/**
 * 注釈アイテム
 * - 自由な注釈を入れるテキストエリア
 */
export interface NoteFormItem extends BaseFormItem {
    type: 'note';
    textValue: string;           // 注釈テキスト
}

/**
 * フォームアイテム（ユニオン型）
 * 配列のインデックスで表示順序を管理
 */
export type FormLayoutItem = ProductFormItem | HeaderFormItem | NoteFormItem;

/**
 * フォームレイアウト全体
 * - 施設ごとの画面構成を保存するためのスキーマ
 */
export interface FormLayout {
    id: string;
    name: string;                    // テンプレート名
    description?: string;            // テンプレートの説明
    items: FormLayoutItem[];         // 順序付きリスト（配列のインデックスで順序管理）
    createdAt: string;               // ISO 8601形式
    updatedAt: string;               // ISO 8601形式
    distributorId: string;           // 販売店ID（作成者）
    facilityIds?: string[];          // 適用対象の施設IDリスト（空の場合は全施設）
    isDefault?: boolean;             // デフォルトテンプレートフラグ
}

/**
 * ツールボックスで使用するドラッグ可能なアイテムの型
 */
export interface DraggableToolItem {
    id: string;
    type: FormItemType;
    label: string;
    icon: string;
    description: string;
}

/**
 * ドラッグ操作の種類
 */
export type DragOperation = 'add' | 'reorder';

/**
 * ドラッグイベントのデータ
 */
export interface DragEventData {
    operation: DragOperation;
    item?: FormLayoutItem;
    toolItem?: DraggableToolItem;
    fromIndex?: number;
}
