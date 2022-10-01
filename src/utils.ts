/**
 * 指定した値を等価の文字列に変換します。
 * @param value 変換する値
 * @returns 変換後の値
 */
export const convertToString = (value: boolean) => (value ? 'true' : 'false');

/**
 * 指定した値を等価の真偽値に変換します。
 * @param value 変換する値
 * @param defaultValue 変換できない場合の既定値
 * @returns 変換後の値
 */
export const convertToBoolean = (value: string | null, defaultValue = true) =>
  defaultValue ? (value?.toLowerCase() === 'false' ? false : true) : value?.toLowerCase() === 'true' ? true : false;

/**
 * 指定した値を等価の数値に変換します。
 * @param value 変換する値
 * @param defaultValue 変換できない場合の既定値
 * @returns 変換後の値
 */
export const convertToNumber = (value: string | null, defaultValue: number) => {
  if (!value) return defaultValue;
  const n = Number(value);
  if (isNaN(n)) return defaultValue;
  return n;
};

/**
 * 配列内の要素をキーに従って昇順に並び替えます。
 * @param array 配列
 * @param key 並び替えを行うキー
 * @returns 並び替え後の配列
 */
export const orderBy = function _<T, K extends keyof T>(array: T[], key: K) {
  return array.sort(function (a, b) {
    if (a[key] < b[key]) return -1;
    if (b[key] < a[key]) return 1;
    return 0;
  });
};
