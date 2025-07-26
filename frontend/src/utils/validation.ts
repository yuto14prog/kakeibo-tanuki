/**
 * 支出金額のバリデーション
 */
export function validateAmount(amount: string | number): string | null {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '金額は数値で入力してください';
  }
  
  if (numAmount <= 0) {
    return '金額は0より大きい値を入力してください';
  }
  
  if (numAmount > 10000000) {
    return '金額は1,000万円以下で入力してください';
  }
  
  return null;
}

/**
 * カード名のバリデーション
 */
export function validateCardName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'カード名を入力してください';
  }
  
  if (name.length > 100) {
    return 'カード名は100文字以下で入力してください';
  }
  
  return null;
}

/**
 * カテゴリ名のバリデーション
 */
export function validateCategoryName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'カテゴリ名を入力してください';
  }
  
  if (name.length > 50) {
    return 'カテゴリ名は50文字以下で入力してください';
  }
  
  return null;
}

/**
 * 日付のバリデーション
 */
export function validateDate(dateString: string): string | null {
  if (!dateString) {
    return '日付を入力してください';
  }
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return '有効な日付を入力してください';
  }
  
  const today = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(today.getFullYear() + 1);
  
  if (date > oneYearFromNow) {
    return '未来すぎる日付は入力できません';
  }
  
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(today.getFullYear() - 10);
  
  if (date < tenYearsAgo) {
    return '過去すぎる日付は入力できません';
  }
  
  return null;
}

/**
 * メールアドレスのバリデーション
 */
export function validateEmail(email: string): string | null {
  if (!email || email.trim().length === 0) {
    return 'メールアドレスを入力してください';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return '有効なメールアドレスを入力してください';
  }
  
  return null;
}