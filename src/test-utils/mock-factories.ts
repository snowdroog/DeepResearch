/**
 * Mock data factories for testing
 * These functions generate consistent mock data for tests
 */

import type { User, AISession, CapturedResponse } from '@shared/types';
import type { AppSettings } from '@renderer/types/settings';
import type { CaptureData } from '@renderer/lib/export-utils';
import { DEFAULT_SETTINGS } from '@renderer/types/settings';

/**
 * Counter for generating unique IDs in tests
 */
let mockIdCounter = 0;

/**
 * Reset the mock ID counter (useful in beforeEach)
 */
export function resetMockIdCounter() {
  mockIdCounter = 0;
}

/**
 * Generate a unique mock ID
 */
export function generateMockId(prefix = 'mock'): string {
  return `${prefix}-${++mockIdCounter}`;
}

/**
 * Create a mock User object
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    userId: generateMockId('user'),
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    lastLoginAt: new Date('2024-01-15T00:00:00Z'),
    ...overrides,
  };
}

/**
 * Create a mock AISession object
 */
export function createMockAISession(
  overrides: Partial<AISession> = {}
): AISession {
  return {
    sessionId: generateMockId('session'),
    userId: generateMockId('user'),
    provider: 'claude',
    sessionName: 'Test Session',
    active: true,
    lastActivity: new Date('2024-01-15T12:00:00Z'),
    contextTags: ['test', 'mock'],
    ...overrides,
  };
}

/**
 * Create a mock CapturedResponse object
 */
export function createMockCapturedResponse(
  overrides: Partial<CapturedResponse> = {}
): CapturedResponse {
  return {
    responseId: generateMockId('response'),
    sessionId: generateMockId('session'),
    content: 'This is a mock AI response for testing purposes.',
    timestamp: new Date('2024-01-15T12:30:00Z'),
    provider: 'claude',
    tokens: {
      input: 100,
      output: 200,
      total: 300,
    },
    metadata: {
      model: 'claude-3-opus',
      temperature: 0.7,
    },
    ...overrides,
  };
}

/**
 * Create mock AppSettings object
 */
export function createMockAppSettings(
  overrides: Partial<AppSettings> = {}
): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...overrides,
    general: {
      ...DEFAULT_SETTINGS.general,
      ...(overrides.general || {}),
    },
    ui: {
      ...DEFAULT_SETTINGS.ui,
      ...(overrides.ui || {}),
    },
    export: {
      ...DEFAULT_SETTINGS.export,
      ...(overrides.export || {}),
    },
    capture: {
      ...DEFAULT_SETTINGS.capture,
      ...(overrides.capture || {}),
      captureProviders: {
        ...DEFAULT_SETTINGS.capture.captureProviders,
        ...(overrides.capture?.captureProviders || {}),
      },
    },
    database: {
      ...DEFAULT_SETTINGS.database,
      ...(overrides.database || {}),
    },
    advanced: {
      ...DEFAULT_SETTINGS.advanced,
      ...(overrides.advanced || {}),
    },
  };
}

/**
 * Create an array of mock users
 */
export function createMockUsers(count: number): User[] {
  return Array.from({ length: count }, (_, i) =>
    createMockUser({
      email: `user${i + 1}@example.com`,
      name: `Test User ${i + 1}`,
    })
  );
}

/**
 * Create an array of mock AI sessions
 */
export function createMockAISessions(count: number): AISession[] {
  const providers: Array<'claude' | 'openai' | 'gemini' | 'custom'> = [
    'claude',
    'openai',
    'gemini',
    'custom',
  ];

  return Array.from({ length: count }, (_, i) =>
    createMockAISession({
      sessionName: `Test Session ${i + 1}`,
      provider: providers[i % providers.length],
      active: i % 3 !== 0, // Make some inactive
    })
  );
}

/**
 * Create an array of mock captured responses
 */
export function createMockCapturedResponses(count: number): CapturedResponse[] {
  return Array.from({ length: count }, (_, i) =>
    createMockCapturedResponse({
      content: `Mock response ${i + 1} - This is test content.`,
      timestamp: new Date(Date.now() - i * 60000), // Stagger timestamps
    })
  );
}

/**
 * Create a mock CaptureData object (for export utilities)
 */
export function createMockCaptureData(
  overrides: Partial<CaptureData> = {}
): CaptureData {
  return {
    id: generateMockId('capture'),
    session_id: generateMockId('session'),
    provider: 'claude',
    prompt: 'What is the meaning of life?',
    response: 'The meaning of life is a philosophical question concerning the significance of living or existence in general.',
    response_format: 'text',
    model: 'claude-3-opus-20240229',
    timestamp: Date.now(),
    token_count: 150,
    tags: 'philosophy,testing',
    notes: 'Test note for capture',
    is_archived: 0,
    ...overrides,
  };
}

/**
 * Create an array of mock capture data objects
 */
export function createMockCaptureDataArray(count: number): CaptureData[] {
  const providers = ['claude', 'openai', 'gemini', 'custom'];
  const prompts = [
    'What is the capital of France?',
    'Explain quantum computing',
    'How does photosynthesis work?',
    'What is machine learning?',
  ];
  const responses = [
    'The capital of France is Paris.',
    'Quantum computing uses quantum-mechanical phenomena like superposition and entanglement.',
    'Photosynthesis is the process by which plants convert light energy into chemical energy.',
    'Machine learning is a subset of AI that enables systems to learn from data.',
  ];

  return Array.from({ length: count }, (_, i) =>
    createMockCaptureData({
      provider: providers[i % providers.length],
      prompt: prompts[i % prompts.length],
      response: responses[i % responses.length],
      timestamp: Date.now() - i * 60000, // Stagger timestamps
      token_count: 100 + i * 10,
      tags: i % 2 === 0 ? 'test,mock' : undefined,
      notes: i % 3 === 0 ? `Note for capture ${i + 1}` : undefined,
      is_archived: i % 5 === 0 ? 1 : 0,
    })
  );
}

/**
 * Create a mock electron API object
 */
export function createMockElectronAPI() {
  return {
    // Database operations
    getCapturedResponses: vi.fn(() => Promise.resolve(createMockCapturedResponses(5))),
    saveResponse: vi.fn((response: CapturedResponse) =>
      Promise.resolve({ success: true, responseId: response.responseId })
    ),
    updateResponse: vi.fn((responseId: string, updates: Partial<CapturedResponse>) =>
      Promise.resolve({ success: true })
    ),
    deleteResponse: vi.fn((responseId: string) =>
      Promise.resolve({ success: true })
    ),

    // Project operations
    getProjects: vi.fn(() => Promise.resolve([])),
    createProject: vi.fn((name: string) =>
      Promise.resolve({ success: true, projectId: generateMockId('project') })
    ),
    updateProject: vi.fn((projectId: string, updates: any) =>
      Promise.resolve({ success: true })
    ),
    deleteProject: vi.fn((projectId: string) =>
      Promise.resolve({ success: true })
    ),

    // Settings operations
    getSettings: vi.fn(() => Promise.resolve(createMockAppSettings())),
    updateSettings: vi.fn((settings: Partial<AppSettings>) =>
      Promise.resolve({ success: true })
    ),

    // Export operations
    exportData: vi.fn((format: string) =>
      Promise.resolve({ success: true, path: '/mock/export/path.json' })
    ),

    // File system operations
    selectDirectory: vi.fn(() =>
      Promise.resolve({ canceled: false, filePaths: ['/mock/directory'] })
    ),
    openExternal: vi.fn((url: string) => Promise.resolve()),

    // Window operations
    minimizeWindow: vi.fn(),
    maximizeWindow: vi.fn(),
    closeWindow: vi.fn(),

    // App info
    getAppVersion: vi.fn(() => Promise.resolve('0.1.0-test')),

    // Event listeners
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
  };
}

/**
 * Create a mock Session object (for database tests)
 */
export function createMockSession(
  overrides: Partial<{
    id: string;
    provider: string;
    name: string;
    partition: string;
    created_at: number;
    last_active: number;
    is_active: number;
    metadata?: string;
  }> = {}
): {
  id: string;
  provider: string;
  name: string;
  partition: string;
  created_at: number;
  last_active: number;
  is_active: number;
  metadata?: string;
} {
  const id = overrides.id || generateMockId('session');
  return {
    id,
    provider: 'claude',
    name: 'Test Session',
    partition: `persist:${id}`,
    created_at: Date.now(),
    last_active: Date.now(),
    is_active: 1,
    ...overrides,
  };
}

/**
 * Create a mock Capture object (for database tests)
 */
export function createMockCapture(
  overrides: Partial<{
    id: string;
    session_id: string;
    provider: string;
    prompt: string;
    response: string;
    response_format?: string;
    model?: string;
    timestamp: number;
    token_count?: number;
    tags?: string;
    notes?: string;
    is_archived: number;
  }> = {}
): {
  id: string;
  session_id: string;
  provider: string;
  prompt: string;
  response: string;
  response_format?: string;
  model?: string;
  timestamp: number;
  token_count?: number;
  tags?: string;
  notes?: string;
  is_archived: number;
} {
  return {
    id: generateMockId('capture'),
    session_id: generateMockId('session'),
    provider: 'claude',
    prompt: 'Test prompt',
    response: 'Test response',
    response_format: 'text',
    timestamp: Date.now(),
    is_archived: 0,
    ...overrides,
  };
}

/**
 * Create an array of mock Sessions
 */
export function createMockSessions(count: number): Array<{
  id: string;
  provider: string;
  name: string;
  partition: string;
  created_at: number;
  last_active: number;
  is_active: number;
  metadata?: string;
}> {
  const providers: Array<'claude' | 'openai' | 'gemini' | 'perplexity'> = [
    'claude',
    'openai',
    'gemini',
    'perplexity',
  ];

  return Array.from({ length: count }, (_, i) => {
    const provider = providers[i % providers.length];
    return createMockSession({
      name: `${provider} Session ${i + 1}`,
      provider,
      is_active: i % 3 !== 0 ? 1 : 0, // Make some inactive
    });
  });
}

/**
 * Create an array of mock Captures
 */
export function createMockCaptures(count: number, sessionId?: string): Array<{
  id: string;
  session_id: string;
  provider: string;
  prompt: string;
  response: string;
  response_format?: string;
  model?: string;
  timestamp: number;
  token_count?: number;
  tags?: string;
  notes?: string;
  is_archived: number;
}> {
  return Array.from({ length: count }, (_, i) =>
    createMockCapture({
      session_id: sessionId || generateMockId('session'),
      prompt: `Test prompt ${i + 1}`,
      response: `Test response ${i + 1}`,
      timestamp: Date.now() - i * 60000, // Stagger timestamps
      is_archived: i % 5 === 0 ? 1 : 0, // Make some archived
    })
  );
}

/**
 * Re-export vi for convenience
 */
export { vi } from 'vitest';
