/**
 * Comprehensive unit tests for export utilities
 * Tests all export format conversion functions with edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  convertToJSON,
  convertToCSV,
  getDefaultFileName,
  estimateFileSize,
  formatBytes,
  validateExportData,
  getFileExtension,
  getMimeType,
  type CaptureData,
  type ExportFormat,
} from '../export-utils';
import {
  createMockCaptureData,
  createMockCaptureDataArray,
  resetMockIdCounter,
} from '@/test-utils/mock-factories';

describe('Export Utilities - convertToJSON', () => {
  beforeEach(() => {
    resetMockIdCounter();
  });

  it('should export a single capture to JSON', () => {
    const capture = createMockCaptureData();
    const json = convertToJSON([capture]);

    // Parse to verify it's valid JSON
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual(capture);
  });

  it('should export multiple captures to JSON', () => {
    const captures = createMockCaptureDataArray(5);
    const json = convertToJSON(captures);

    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(5);
    expect(parsed).toEqual(captures);
  });

  it('should export with all metadata fields', () => {
    const capture = createMockCaptureData({
      id: 'test-id-123',
      session_id: 'session-456',
      provider: 'openai',
      prompt: 'Test prompt',
      response: 'Test response',
      response_format: 'json',
      model: 'gpt-4',
      timestamp: 1704067200000,
      token_count: 250,
      tags: 'test,export,metadata',
      notes: 'Detailed test notes',
      is_archived: 1,
    });

    const json = convertToJSON([capture]);
    const parsed = JSON.parse(json);

    expect(parsed[0]).toMatchObject({
      id: 'test-id-123',
      session_id: 'session-456',
      provider: 'openai',
      prompt: 'Test prompt',
      response: 'Test response',
      response_format: 'json',
      model: 'gpt-4',
      timestamp: 1704067200000,
      token_count: 250,
      tags: 'test,export,metadata',
      notes: 'Detailed test notes',
      is_archived: 1,
    });
  });

  it('should export empty array', () => {
    const json = convertToJSON([]);
    const parsed = JSON.parse(json);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(0);
  });

  it('should format JSON with proper indentation', () => {
    const capture = createMockCaptureData();
    const json = convertToJSON([capture]);

    // Check for indentation (2 spaces)
    expect(json).toContain('  ');
    expect(json).toMatch(/\n  {/);
  });

  it('should handle special characters in content', () => {
    const capture = createMockCaptureData({
      prompt: 'Test with "quotes" and \'apostrophes\'',
      response: 'Response with\nnewlines\tand\ttabs',
      notes: 'Unicode: 你好 世界 🌍',
    });

    const json = convertToJSON([capture]);
    const parsed = JSON.parse(json);

    expect(parsed[0].prompt).toBe('Test with "quotes" and \'apostrophes\'');
    expect(parsed[0].response).toBe('Response with\nnewlines\tand\ttabs');
    expect(parsed[0].notes).toBe('Unicode: 你好 世界 🌍');
  });

  it('should handle null and undefined optional fields', () => {
    const capture = createMockCaptureData({
      response_format: undefined,
      model: undefined,
      token_count: undefined,
      tags: undefined,
      notes: undefined,
    });

    const json = convertToJSON([capture]);
    const parsed = JSON.parse(json);

    // JSON.stringify converts undefined to null or omits the field
    expect(parsed[0]).toBeDefined();
  });

  it('should handle very long content', () => {
    const longResponse = 'A'.repeat(100000); // 100KB of text
    const capture = createMockCaptureData({
      response: longResponse,
    });

    const json = convertToJSON([capture]);
    const parsed = JSON.parse(json);

    expect(parsed[0].response).toBe(longResponse);
    expect(parsed[0].response).toHaveLength(100000);
  });
});

describe('Export Utilities - convertToCSV', () => {
  beforeEach(() => {
    resetMockIdCounter();
  });

  it('should export a single capture to CSV', () => {
    const capture = createMockCaptureData({
      id: 'cap-1',
      session_id: 'sess-1',
      provider: 'claude',
      prompt: 'Simple prompt',
      response: 'Simple response',
    });

    const csv = convertToCSV([capture]);
    const lines = csv.split('\n');

    // Should have header + 1 data row
    expect(lines).toHaveLength(2);

    // Check header
    expect(lines[0]).toBe('id,session_id,provider,prompt,response,response_format,model,timestamp,token_count,tags,notes,is_archived');

    // Check data row starts correctly
    expect(lines[1]).toContain('cap-1');
    expect(lines[1]).toContain('sess-1');
    expect(lines[1]).toContain('claude');
  });

  it('should export multiple captures to CSV', () => {
    const captures = createMockCaptureDataArray(3);
    const csv = convertToCSV(captures);
    const lines = csv.split('\n');

    // Should have header + 3 data rows
    expect(lines).toHaveLength(4);
  });

  it('should verify CSV headers are correct', () => {
    const captures = createMockCaptureDataArray(1);
    const csv = convertToCSV(captures);
    const lines = csv.split('\n');

    const expectedHeaders = [
      'id',
      'session_id',
      'provider',
      'prompt',
      'response',
      'response_format',
      'model',
      'timestamp',
      'token_count',
      'tags',
      'notes',
      'is_archived'
    ];

    expect(lines[0]).toBe(expectedHeaders.join(','));
  });

  it('should escape commas in content', () => {
    const capture = createMockCaptureData({
      prompt: 'A prompt with, commas, in it',
      response: 'Response, with, multiple, commas',
    });

    const csv = convertToCSV([capture]);

    // Fields with commas should be quoted
    expect(csv).toContain('"A prompt with, commas, in it"');
    expect(csv).toContain('"Response, with, multiple, commas"');
  });

  it('should escape double quotes in content', () => {
    const capture = createMockCaptureData({
      prompt: 'A prompt with "quoted" text',
      response: 'Response with "quotes" inside',
    });

    const csv = convertToCSV([capture]);

    // Quotes should be doubled and field quoted
    expect(csv).toContain('"A prompt with ""quoted"" text"');
    expect(csv).toContain('"Response with ""quotes"" inside"');
  });

  it('should handle newlines in content', () => {
    const capture = createMockCaptureData({
      prompt: 'First line\nSecond line',
      response: 'Line 1\nLine 2\nLine 3',
      notes: 'Note with\nnewlines',
    });

    const csv = convertToCSV([capture]);

    // Fields with newlines should be quoted
    expect(csv).toContain('"First line\nSecond line"');
    expect(csv).toContain('"Line 1\nLine 2\nLine 3"');
    expect(csv).toContain('"Note with\nnewlines"');
  });

  it('should handle carriage returns in content', () => {
    const capture = createMockCaptureData({
      response: 'Windows style\r\nline breaks',
    });

    const csv = convertToCSV([capture]);

    expect(csv).toContain('"Windows style\r\nline breaks"');
  });

  it('should return empty string for empty data array', () => {
    const csv = convertToCSV([]);
    expect(csv).toBe('');
  });

  it('should handle null and undefined values', () => {
    const capture = createMockCaptureData({
      response_format: undefined,
      model: undefined,
      token_count: undefined,
      tags: undefined,
      notes: undefined,
    });

    const csv = convertToCSV([capture]);
    const lines = csv.split('\n');

    // Should have header and data row
    expect(lines).toHaveLength(2);

    // Undefined/null values should be empty strings
    const fields = lines[1].split(',');
    expect(fields.some(f => f === '')).toBe(true);
  });

  it('should handle special characters and unicode', () => {
    const capture = createMockCaptureData({
      prompt: 'Unicode: 你好 世界',
      response: 'Emoji: 🚀 🌍 ✨',
      notes: 'Special: @#$%^&*()',
    });

    const csv = convertToCSV([capture]);

    expect(csv).toContain('你好 世界');
    expect(csv).toContain('🚀 🌍 ✨');
    expect(csv).toContain('@#$%^&*()');
  });

  it('should handle mixed escape scenarios', () => {
    const capture = createMockCaptureData({
      response: 'Text with "quotes", commas,\nand newlines',
    });

    const csv = convertToCSV([capture]);

    // Should be quoted and quotes should be doubled
    expect(csv).toContain('"Text with ""quotes"", commas,\nand newlines"');
  });

  it('should maintain data integrity for all fields', () => {
    const capture = createMockCaptureData({
      id: 'test-123',
      session_id: 'sess-456',
      provider: 'openai',
      prompt: 'Test',
      response: 'Response',
      response_format: 'json',
      model: 'gpt-4',
      timestamp: 1704067200000,
      token_count: 500,
      tags: 'tag1,tag2',
      notes: 'Note',
      is_archived: 1,
    });

    const csv = convertToCSV([capture]);
    const lines = csv.split('\n');
    const dataRow = lines[1];

    expect(dataRow).toContain('test-123');
    expect(dataRow).toContain('sess-456');
    expect(dataRow).toContain('openai');
    expect(dataRow).toContain('gpt-4');
    expect(dataRow).toContain('1704067200000');
    expect(dataRow).toContain('500');
    expect(dataRow).toContain('1'); // is_archived
  });
});

describe('Export Utilities - getDefaultFileName', () => {
  it('should generate filename with timestamp', () => {
    const filename = getDefaultFileName('json');

    expect(filename).toMatch(/^deepresearch_export_\d{4}-\d{2}-\d{2}_\d{6}\.json$/);
  });

  it('should generate JSON filename', () => {
    const filename = getDefaultFileName('json');
    expect(filename).toContain('.json');
  });

  it('should generate CSV filename', () => {
    const filename = getDefaultFileName('csv');
    expect(filename).toContain('.csv');
  });

  it('should include record count when provided', () => {
    const filename = getDefaultFileName('json', 42);
    expect(filename).toContain('_42records');
  });

  it('should not include record count when not provided', () => {
    const filename = getDefaultFileName('json');
    expect(filename).not.toContain('records');
  });

  it('should handle zero record count (treated as falsy)', () => {
    const filename = getDefaultFileName('csv', 0);
    // 0 is falsy, so no record count suffix is added
    expect(filename).not.toContain('records');
    expect(filename).toMatch(/^deepresearch_export_\d{4}-\d{2}-\d{2}_\d{6}\.csv$/);
  });
});

describe('Export Utilities - estimateFileSize', () => {
  beforeEach(() => {
    resetMockIdCounter();
  });

  it('should return 0 for empty array', () => {
    const size = estimateFileSize([], 'json');
    expect(size).toBe(0);
  });

  it('should estimate JSON file size', () => {
    const captures = createMockCaptureDataArray(10);
    const size = estimateFileSize(captures, 'json');

    expect(size).toBeGreaterThan(0);
    expect(typeof size).toBe('number');
  });

  it('should estimate CSV file size', () => {
    const captures = createMockCaptureDataArray(10);
    const size = estimateFileSize(captures, 'csv');

    expect(size).toBeGreaterThan(0);
    expect(typeof size).toBe('number');
  });

  it('should scale estimate with more data', () => {
    const smallCaptures = createMockCaptureDataArray(10);
    const largeCaptures = createMockCaptureDataArray(100);

    const smallSize = estimateFileSize(smallCaptures, 'json');
    const largeSize = estimateFileSize(largeCaptures, 'json');

    expect(largeSize).toBeGreaterThan(smallSize);
  });

  it('should handle datasets larger than sample size', () => {
    const captures = createMockCaptureDataArray(50);
    const size = estimateFileSize(captures, 'json');

    expect(size).toBeGreaterThan(0);
  });

  it('should return integer size', () => {
    const captures = createMockCaptureDataArray(5);
    const size = estimateFileSize(captures, 'json');

    expect(Number.isInteger(size)).toBe(true);
  });
});

describe('Export Utilities - formatBytes', () => {
  it('should format 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('should format bytes', () => {
    expect(formatBytes(500)).toBe('500 Bytes');
    expect(formatBytes(1000)).toBe('1000 Bytes');
  });

  it('should format kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('should format megabytes', () => {
    expect(formatBytes(1048576)).toBe('1 MB'); // 1024 * 1024
    expect(formatBytes(5242880)).toBe('5 MB');
  });

  it('should format gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1 GB'); // 1024^3
    expect(formatBytes(2147483648)).toBe('2 GB');
  });

  it('should format terabytes', () => {
    expect(formatBytes(1099511627776)).toBe('1 TB'); // 1024^4
  });

  it('should respect decimal places parameter', () => {
    expect(formatBytes(1536, 0)).toBe('2 KB');
    expect(formatBytes(1536, 1)).toBe('1.5 KB');
    expect(formatBytes(1536, 3)).toBe('1.5 KB');
  });

  it('should handle negative decimals parameter', () => {
    expect(formatBytes(1536, -1)).toBe('2 KB');
  });

  it('should format with default 2 decimals', () => {
    const result = formatBytes(1234567);
    expect(result).toMatch(/\d+\.\d{1,2} MB/);
  });
});

describe('Export Utilities - validateExportData', () => {
  beforeEach(() => {
    resetMockIdCounter();
  });

  it('should validate valid data', () => {
    const captures = createMockCaptureDataArray(5);
    const result = validateExportData(captures);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject non-array data', () => {
    const result = validateExportData({} as any);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Data must be an array');
  });

  it('should reject empty array', () => {
    const result = validateExportData([]);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('No data to export');
  });

  it('should reject data without required fields - missing id', () => {
    const invalidData = [
      {
        session_id: 'sess-1',
        provider: 'claude',
        prompt: 'test',
        response: 'test',
        timestamp: Date.now(),
        is_archived: 0,
      } as any,
    ];

    const result = validateExportData(invalidData);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid data structure');
  });

  it('should reject data without required fields - missing session_id', () => {
    const invalidData = [
      {
        id: 'cap-1',
        provider: 'claude',
        prompt: 'test',
        response: 'test',
        timestamp: Date.now(),
        is_archived: 0,
      } as any,
    ];

    const result = validateExportData(invalidData);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid data structure');
  });

  it('should reject data without required fields - missing provider', () => {
    const invalidData = [
      {
        id: 'cap-1',
        session_id: 'sess-1',
        prompt: 'test',
        response: 'test',
        timestamp: Date.now(),
        is_archived: 0,
      } as any,
    ];

    const result = validateExportData(invalidData);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid data structure');
  });

  it('should accept data with optional fields missing', () => {
    const validData = [
      {
        id: 'cap-1',
        session_id: 'sess-1',
        provider: 'claude',
        prompt: 'test',
        response: 'test',
        timestamp: Date.now(),
        is_archived: 0,
        // Optional fields omitted
      } as CaptureData,
    ];

    const result = validateExportData(validData);

    expect(result.valid).toBe(true);
  });
});

describe('Export Utilities - getFileExtension', () => {
  it('should return json extension', () => {
    expect(getFileExtension('json')).toBe('json');
  });

  it('should return csv extension', () => {
    expect(getFileExtension('csv')).toBe('csv');
  });
});

describe('Export Utilities - getMimeType', () => {
  it('should return JSON MIME type', () => {
    expect(getMimeType('json')).toBe('application/json');
  });

  it('should return CSV MIME type', () => {
    expect(getMimeType('csv')).toBe('text/csv');
  });
});

describe('Export Utilities - Edge Cases and Integration', () => {
  beforeEach(() => {
    resetMockIdCounter();
  });

  it('should handle large datasets (performance test)', () => {
    const largeDataset = createMockCaptureDataArray(1000);

    const startTime = performance.now();
    const json = convertToJSON(largeDataset);
    const jsonTime = performance.now() - startTime;

    expect(json).toBeDefined();
    expect(jsonTime).toBeLessThan(1000); // Should complete in less than 1 second

    const startCsv = performance.now();
    const csv = convertToCSV(largeDataset);
    const csvTime = performance.now() - startCsv;

    expect(csv).toBeDefined();
    expect(csvTime).toBeLessThan(1000);
  });

  it('should handle very long strings in fields', () => {
    const longString = 'A'.repeat(50000);
    const capture = createMockCaptureData({
      response: longString,
    });

    const json = convertToJSON([capture]);
    const csv = convertToCSV([capture]);

    expect(json).toContain(longString);
    expect(csv).toContain(longString);
  });

  it('should preserve data integrity through JSON export/import cycle', () => {
    const captures = createMockCaptureDataArray(5);

    const json = convertToJSON(captures);
    const parsed = JSON.parse(json);

    expect(parsed).toEqual(captures);
  });

  it('should handle captures with all optional fields undefined', () => {
    const minimalCapture = createMockCaptureData({
      response_format: undefined,
      model: undefined,
      token_count: undefined,
      tags: undefined,
      notes: undefined,
    });

    const json = convertToJSON([minimalCapture]);
    const csv = convertToCSV([minimalCapture]);

    expect(json).toBeDefined();
    expect(csv).toBeDefined();
  });

  it('should handle mixed archived and non-archived captures', () => {
    const captures = [
      createMockCaptureData({ is_archived: 0 }),
      createMockCaptureData({ is_archived: 1 }),
      createMockCaptureData({ is_archived: 0 }),
    ];

    const json = convertToJSON(captures);
    const parsed = JSON.parse(json);

    expect(parsed[0].is_archived).toBe(0);
    expect(parsed[1].is_archived).toBe(1);
    expect(parsed[2].is_archived).toBe(0);
  });

  it('should handle captures from different providers', () => {
    const captures = [
      createMockCaptureData({ provider: 'claude' }),
      createMockCaptureData({ provider: 'openai' }),
      createMockCaptureData({ provider: 'gemini' }),
      createMockCaptureData({ provider: 'custom' }),
    ];

    const json = convertToJSON(captures);
    const csv = convertToCSV(captures);

    expect(json).toContain('claude');
    expect(json).toContain('openai');
    expect(json).toContain('gemini');
    expect(json).toContain('custom');

    expect(csv).toContain('claude');
    expect(csv).toContain('openai');
    expect(csv).toContain('gemini');
    expect(csv).toContain('custom');
  });

  it('should handle timestamp edge cases', () => {
    const captures = [
      createMockCaptureData({ timestamp: 0 }),
      createMockCaptureData({ timestamp: Date.now() }),
      createMockCaptureData({ timestamp: 9999999999999 }),
    ];

    const json = convertToJSON(captures);
    const parsed = JSON.parse(json);

    expect(parsed[0].timestamp).toBe(0);
    expect(parsed[1].timestamp).toBeGreaterThan(0);
    expect(parsed[2].timestamp).toBe(9999999999999);
  });

  it('should handle empty strings vs undefined', () => {
    const capture1 = createMockCaptureData({ notes: '' });
    const capture2 = createMockCaptureData({ notes: undefined });

    const json1 = convertToJSON([capture1]);
    const json2 = convertToJSON([capture2]);

    const parsed1 = JSON.parse(json1);
    const parsed2 = JSON.parse(json2);

    expect(parsed1[0].notes).toBe('');
    // undefined may be omitted or null in JSON
  });

  it('should handle CSV with complex escaping scenarios', () => {
    const capture = createMockCaptureData({
      response: 'Line 1\nLine 2 with "quotes"\nLine 3, with, commas',
    });

    const csv = convertToCSV([capture]);

    // Should be properly escaped
    expect(csv).toContain('"');
    expect(csv).toContain('\n');
  });
});
