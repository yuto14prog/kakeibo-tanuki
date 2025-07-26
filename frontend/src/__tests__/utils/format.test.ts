import { formatCurrency, formatDate, truncateText, isValidHexColor, classNames } from '../../utils/format';

describe('format utilities', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1000)).toBe('￥1,000');
      expect(formatCurrency(1234567)).toBe('￥1,234,567');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('￥0');
    });

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-1000)).toBe('-￥1,000');
    });

    it('should format decimal numbers correctly', () => {
      expect(formatCurrency(1000.5)).toBe('￥1,001'); // 日本円では小数点以下は切り上げ
      expect(formatCurrency(999.99)).toBe('￥1,000');
    });
  });

  describe('formatDate', () => {

    it('should format date in short format by default', () => {
      const result = formatDate('2025-01-15');
      expect(result).toMatch(/2025\/01\/15/);
    });

    it('should format date in long format', () => {
      const result = formatDate('2025-01-15', 'long');
      expect(result).toMatch(/2025年1月15日/);
    });

    it('should handle invalid date strings', () => {
      expect(formatDate('invalid-date')).toBe('無効な日付');
      expect(formatDate('')).toBe('無効な日付');
    });

    it('should handle different date formats', () => {
      expect(formatDate('2025/01/15')).toMatch(/2025\/01\/15/);
      expect(formatDate('2025-1-5')).toMatch(/2025\/01\/05/);
    });
  });

  describe('truncateText', () => {
    it('should return original text if within maxLength', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
      expect(truncateText('Hello', 5)).toBe('Hello');
    });

    it('should truncate text that exceeds maxLength', () => {
      expect(truncateText('This is a long text', 10)).toBe('This is a ...');
      expect(truncateText('Hello World', 8)).toBe('Hello Wo...');
    });

    it('should handle empty strings', () => {
      expect(truncateText('', 5)).toBe('');
    });

    it('should handle zero maxLength', () => {
      expect(truncateText('Hello', 0)).toBe('...');
    });

    it('should handle negative maxLength', () => {
      expect(truncateText('Hello', -1)).toBe('...');
    });
  });

  describe('isValidHexColor', () => {
    it('should validate 6-digit hex colors', () => {
      expect(isValidHexColor('#FF0000')).toBe(true);
      expect(isValidHexColor('#00ff00')).toBe(true);
      expect(isValidHexColor('#123ABC')).toBe(true);
    });

    it('should validate 3-digit hex colors', () => {
      expect(isValidHexColor('#F00')).toBe(true);
      expect(isValidHexColor('#0f0')).toBe(true);
      expect(isValidHexColor('#ABC')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('FF0000')).toBe(false); // No #
      expect(isValidHexColor('#FF')).toBe(false); // Too short
      expect(isValidHexColor('#FF00000')).toBe(false); // Too long
      expect(isValidHexColor('#GG0000')).toBe(false); // Invalid characters
      expect(isValidHexColor('')).toBe(false); // Empty string
      expect(isValidHexColor('red')).toBe(false); // Color name
    });
  });

  describe('classNames', () => {
    it('should join valid class names', () => {
      expect(classNames('class1', 'class2', 'class3')).toBe('class1 class2 class3');
    });

    it('should filter out falsy values', () => {
      expect(classNames('class1', null, 'class2', undefined, 'class3', false)).toBe('class1 class2 class3');
    });

    it('should handle empty input', () => {
      expect(classNames()).toBe('');
    });

    it('should handle all falsy values', () => {
      expect(classNames(null, undefined, false, '')).toBe('');
    });

    it('should handle mixed valid and invalid values', () => {
      expect(classNames('btn', true && 'btn-primary', false && 'btn-secondary')).toBe('btn btn-primary');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      
      expect(classNames(
        'base-class',
        isActive && 'active',
        isDisabled && 'disabled'
      )).toBe('base-class active');
    });
  });
});