import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from './sanitizeHtml';

describe('sanitizeHtml', () => {
  it('allows safe formatting tags and attributes', () => {
    const input = '<p class="text-gray-800">Hello <strong>World</strong></p><h3>Heading</h3>';
    const output = sanitizeHtml(input);
    expect(output).toContain('<p class="text-gray-800">Hello <strong>World</strong></p>');
    expect(output).toContain('<h3>Heading</h3>');
  });

  it('strips malicious script tags completely', () => {
    const input = '<p>Normal text</p><script>alert("xss")</script>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('<script>');
    expect(output).not.toContain('alert');
    expect(output).toContain('<p>Normal text</p>');
  });

  it('removes inline event handlers like onerror and onclick', () => {
    const input = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" onerror="alert(1)" onclick="evil()"/>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('onerror');
    expect(output).not.toContain('onclick');
    expect(output).toContain('src="data:image/png;base64');
  });

  it('removes disallowed tags like iframe, object, style', () => {
    const input = '<iframe src="http://evil.com"></iframe><object data="evil.swf"></object><p>Safe</p>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('iframe');
    expect(output).not.toContain('object');
    expect(output).toContain('<p>Safe</p>');
  });

  it('handles empty or null input gracefully', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null as unknown as string)).toBe('');
  });
});
