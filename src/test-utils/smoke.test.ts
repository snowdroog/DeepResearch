/**
 * Smoke tests to verify Vitest setup is working correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMockUser,
  createMockAISession,
  createMockCapturedResponse,
  createMockAppSettings,
  resetMockIdCounter,
} from './mock-factories';

describe('Vitest Setup - Smoke Tests', () => {
  beforeEach(() => {
    resetMockIdCounter();
  });

  it('should run basic assertions', () => {
    expect(true).toBe(true);
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
  });

  it('should handle async operations', async () => {
    const asyncValue = await Promise.resolve('test');
    expect(asyncValue).toBe('test');
  });

  it('should create mock users', () => {
    const user = createMockUser();
    expect(user).toHaveProperty('userId');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('name');
    expect(user.email).toBe('test@example.com');
  });

  it('should create mock AI sessions', () => {
    const session = createMockAISession();
    expect(session).toHaveProperty('sessionId');
    expect(session).toHaveProperty('provider');
    expect(session.provider).toBe('claude');
    expect(session.active).toBe(true);
  });

  it('should create mock captured responses', () => {
    const response = createMockCapturedResponse();
    expect(response).toHaveProperty('responseId');
    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('tokens');
    expect(response.tokens.total).toBe(300);
  });

  it('should create mock app settings', () => {
    const settings = createMockAppSettings();
    expect(settings).toHaveProperty('general');
    expect(settings).toHaveProperty('ui');
    expect(settings).toHaveProperty('capture');
    expect(settings.ui.theme).toBe('system');
  });

  it('should allow overriding mock data', () => {
    const user = createMockUser({
      email: 'custom@example.com',
      name: 'Custom User',
    });
    expect(user.email).toBe('custom@example.com');
    expect(user.name).toBe('Custom User');
  });

  it('should work with arrays', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers).toHaveLength(5);
    expect(numbers).toContain(3);
    expect(numbers[0]).toBe(1);
  });

  it('should work with objects', () => {
    const obj = {
      name: 'Test',
      value: 42,
      nested: {
        key: 'value',
      },
    };
    expect(obj.name).toBe('Test');
    expect(obj.nested.key).toBe('value');
  });

  it('should handle errors', () => {
    const throwError = () => {
      throw new Error('Test error');
    };
    expect(throwError).toThrow('Test error');
  });

  it('should match snapshots (inline)', () => {
    const data = {
      name: 'Test',
      version: '1.0.0',
      features: ['feature1', 'feature2'],
    };
    expect(data).toMatchInlineSnapshot(`
      {
        "features": [
          "feature1",
          "feature2",
        ],
        "name": "Test",
        "version": "1.0.0",
      }
    `);
  });
});

describe('Environment Setup', () => {
  it('should have access to global window object', () => {
    expect(window).toBeDefined();
    expect(typeof window).toBe('object');
  });

  it('should have mocked electronAPI', () => {
    expect(window.electronAPI).toBeDefined();
    expect(window.electronAPI.getAppVersion).toBeDefined();
    expect(typeof window.electronAPI.getAppVersion).toBe('function');
  });

  it('should have mocked matchMedia', () => {
    expect(window.matchMedia).toBeDefined();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    expect(mq).toHaveProperty('matches');
    expect(mq).toHaveProperty('media');
  });

  it('should have IntersectionObserver', () => {
    expect(IntersectionObserver).toBeDefined();
    const observer = new IntersectionObserver(() => {});
    expect(observer).toBeDefined();
    expect(observer.observe).toBeDefined();
  });

  it('should have ResizeObserver', () => {
    expect(ResizeObserver).toBeDefined();
    const observer = new ResizeObserver(() => {});
    expect(observer).toBeDefined();
    expect(observer.observe).toBeDefined();
  });
});
