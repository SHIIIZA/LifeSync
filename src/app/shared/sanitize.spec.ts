import { sanitizeText } from './sanitize';

describe('sanitizeText', () => {
  it('should strip HTML tags', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe('alert("xss")');
    expect(sanitizeText('<b>bold</b>')).toBe('bold');
  });

  it('should strip dangerous characters', () => {
    expect(sanitizeText('hello"world')).toBe('helloworld');
    expect(sanitizeText("hello'world")).toBe('helloworld');
    expect(sanitizeText('hello`world')).toBe('helloworld');
    expect(sanitizeText('hello<world>')).toBe('helloworld');
  });

  it('should normalize whitespace', () => {
    expect(sanitizeText('  hello   world  ')).toBe('hello world');
    expect(sanitizeText('hello\n\nworld')).toBe('hello world');
  });

  it('should handle empty strings', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText('   ')).toBe('');
  });

  it('should handle normal text', () => {
    expect(sanitizeText('Oats + banana')).toBe('Oats + banana');
    expect(sanitizeText('Eggs, 1 dozen')).toBe('Eggs, 1 dozen');
  });
});
