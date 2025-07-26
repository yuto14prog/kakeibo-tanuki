/**
 * 数値を日本円の通貨形式でフォーマットする
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
}

/**
 * 日付文字列を日本語形式でフォーマットする
 */
export function formatDate(dateString: string, format: 'short' | 'long' = 'short'): string {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return '無効な日付';
  }

  const options: Intl.DateTimeFormatOptions = 
    format === 'long' 
      ? { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
      : { year: 'numeric', month: '2-digit', day: '2-digit' };

  return new Intl.DateTimeFormat('ja-JP', options).format(date);
}

/**
 * 文字列を指定した長さで切り詰める
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * カラーコードが有効かどうかを検証する
 */
export function isValidHexColor(color: string): boolean {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
}

/**
 * クラス名を条件付きで結合する
 */
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}