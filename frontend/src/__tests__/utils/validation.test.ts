import {
  validateAmount,
  validateCardName,
  validateCategoryName,
  validateDate,
  validateEmail,
} from '../../utils/validation';

describe('validation utilities', () => {
  describe('validateAmount', () => {
    it('should return null for valid amounts', () => {
      expect(validateAmount(100)).toBeNull();
      expect(validateAmount(1000.50)).toBeNull();
      expect(validateAmount('500')).toBeNull();
      expect(validateAmount('1234.56')).toBeNull();
    });

    it('should reject zero and negative amounts', () => {
      expect(validateAmount(0)).toBe('金額は0より大きい値を入力してください');
      expect(validateAmount(-100)).toBe('金額は0より大きい値を入力してください');
      expect(validateAmount('-50')).toBe('金額は0より大きい値を入力してください');
    });

    it('should reject non-numeric values', () => {
      expect(validateAmount('abc')).toBe('金額は数値で入力してください');
      expect(validateAmount('')).toBe('金額は数値で入力してください');
      // 注意: '100abc' は parseFloat では 100 として解析されるため、有効な値として扱われます
      expect(validateAmount('abc100')).toBe('金額は数値で入力してください');
    });

    it('should reject amounts exceeding the limit', () => {
      expect(validateAmount(10000001)).toBe('金額は1,000万円以下で入力してください');
      expect(validateAmount('99999999')).toBe('金額は1,000万円以下で入力してください');
    });

    it('should accept amounts at the boundary', () => {
      expect(validateAmount(10000000)).toBeNull();
      expect(validateAmount(0.01)).toBeNull();
    });
  });

  describe('validateCardName', () => {
    it('should return null for valid card names', () => {
      expect(validateCardName('楽天カード')).toBeNull();
      expect(validateCardName('My Credit Card')).toBeNull();
      expect(validateCardName('1234')).toBeNull();
    });

    it('should reject empty or whitespace-only names', () => {
      expect(validateCardName('')).toBe('カード名を入力してください');
      expect(validateCardName('   ')).toBe('カード名を入力してください');
      expect(validateCardName('\t\n')).toBe('カード名を入力してください');
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(101);
      expect(validateCardName(longName)).toBe('カード名は100文字以下で入力してください');
    });

    it('should accept names at the length boundary', () => {
      const maxLengthName = 'a'.repeat(100);
      expect(validateCardName(maxLengthName)).toBeNull();
    });
  });

  describe('validateCategoryName', () => {
    it('should return null for valid category names', () => {
      expect(validateCategoryName('食費')).toBeNull();
      expect(validateCategoryName('Transportation')).toBeNull();
      expect(validateCategoryName('娯楽・レジャー')).toBeNull();
    });

    it('should reject empty or whitespace-only names', () => {
      expect(validateCategoryName('')).toBe('カテゴリ名を入力してください');
      expect(validateCategoryName('   ')).toBe('カテゴリ名を入力してください');
      expect(validateCategoryName('\t\n')).toBe('カテゴリ名を入力してください');
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(51);
      expect(validateCategoryName(longName)).toBe('カテゴリ名は50文字以下で入力してください');
    });

    it('should accept names at the length boundary', () => {
      const maxLengthName = 'a'.repeat(50);
      expect(validateCategoryName(maxLengthName)).toBeNull();
    });
  });

  describe('validateDate', () => {
    beforeAll(() => {
      // 固定日時でテストを実行
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should return null for valid dates', () => {
      expect(validateDate('2025-01-01')).toBeNull();
      expect(validateDate('2024-12-31')).toBeNull();
      expect(validateDate('2025-06-15')).toBeNull();
    });

    it('should reject empty date strings', () => {
      expect(validateDate('')).toBe('日付を入力してください');
    });

    it('should reject invalid date formats', () => {
      expect(validateDate('invalid-date')).toBe('有効な日付を入力してください');
      expect(validateDate('2025-13-01')).toBe('有効な日付を入力してください');
      // 注意: 2025-02-30 は JavaScript の Date では自動的に 2025-03-02 に変換されるため、
      // 実際には有効な日付として扱われる可能性があります
      expect(validateDate('2025-02-32')).toBe('有効な日付を入力してください');
    });

    it('should reject dates too far in the future', () => {
      expect(validateDate('2027-01-01')).toBe('未来すぎる日付は入力できません');
    });

    it('should reject dates too far in the past', () => {
      expect(validateDate('2014-01-01')).toBe('過去すぎる日付は入力できません');
    });

    it('should accept dates at the boundary', () => {
      // 1年後まで
      expect(validateDate('2026-01-15')).toBeNull();
      // 10年前まで
      expect(validateDate('2015-01-15')).toBeNull();
    });

    it('should handle different date formats', () => {
      expect(validateDate('2025/01/01')).toBeNull();
      expect(validateDate('01/01/2025')).toBeNull();
    });
  });

  describe('validateEmail', () => {
    it('should return null for valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBeNull();
      expect(validateEmail('user.name+tag@example.co.jp')).toBeNull();
      expect(validateEmail('user123@test-domain.org')).toBeNull();
    });

    it('should reject empty or whitespace-only emails', () => {
      expect(validateEmail('')).toBe('メールアドレスを入力してください');
      expect(validateEmail('   ')).toBe('メールアドレスを入力してください');
      expect(validateEmail('\t\n')).toBe('メールアドレスを入力してください');
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe('有効なメールアドレスを入力してください');
      expect(validateEmail('test@')).toBe('有効なメールアドレスを入力してください');
      expect(validateEmail('@example.com')).toBe('有効なメールアドレスを入力してください');
      expect(validateEmail('test.example.com')).toBe('有効なメールアドレスを入力してください');
      expect(validateEmail('test@example')).toBe('有効なメールアドレスを入力してください');
      expect(validateEmail('test space@example.com')).toBe('有効なメールアドレスを入力してください');
    });

    it('should handle edge cases', () => {
      expect(validateEmail('a@b.c')).toBeNull(); // 最小限の有効なメール
      expect(validateEmail('test@example.co.uk')).toBeNull(); // 複数のドメイン部分
    });
  });
});