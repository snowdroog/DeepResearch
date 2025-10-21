/**
 * Unit Tests for ResponseInterceptor
 * Tests Chrome DevTools Protocol response interception
 *
 * Coverage:
 * - enable() and disable() lifecycle
 * - CDP debugger attachment and detachment
 * - Fetch domain enablement with provider patterns
 * - Request paused handling for Claude/OpenAI/Gemini
 * - Response body decoding (base64 and plain text)
 * - SSE stream parsing
 * - JSON response parsing
 * - Prompt extraction from request bodies
 * - Response text extraction
 * - Model name extraction
 * - Token estimation
 * - Error handling and edge cases
 * - Concurrent request handling
 */

import { describe, it, expect, beforeEach, vi, MockInstance } from 'vitest';
import { WebContents } from 'electron';
import { ResponseInterceptor } from '../ResponseInterceptor';

// Mock dependencies
vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('crypto')>();
  return {
    ...actual,
    randomUUID: vi.fn(() => 'test-uuid-123'),
  };
});

// Mock database
vi.mock('../../database/db.js', () => ({
  db: {
    createCapture: vi.fn(),
  },
}));

// Import mocked db to access the mock
import { db } from '../../database/db.js';
const mockCreateCapture = db.createCapture as any;

// Create mock WebContents
interface MockDebugger {
  attach: MockInstance;
  detach: MockInstance;
  sendCommand: MockInstance;
  on: MockInstance;
}

interface MockWebContents {
  debugger: MockDebugger;
  send: MockInstance;
}

const createMockWebContents = (): MockWebContents => {
  const eventHandlers = new Map<string, Function>();

  const mockDebugger = {
    attach: vi.fn(),
    detach: vi.fn(),
    sendCommand: vi.fn(),
    on: vi.fn((event: string, handler: Function) => {
      eventHandlers.set(event, handler);
    }),
  };

  // Helper to trigger events
  (mockDebugger as any).emit = (event: string, ...args: any[]) => {
    const handler = eventHandlers.get(event);
    if (handler) handler(...args);
  };

  return {
    debugger: mockDebugger,
    send: vi.fn(),
  } as any;
};

describe('ResponseInterceptor', () => {
  let mockWebContents: MockWebContents;
  let interceptor: ResponseInterceptor;
  const sessionId = 'session-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebContents = createMockWebContents();
  });

  describe('Constructor', () => {
    it('should create interceptor with provider configuration', () => {
      const interceptor = new ResponseInterceptor(
        mockWebContents as any,
        sessionId,
        'claude'
      );

      expect(interceptor).toBeDefined();
    });

    it('should accept different provider types', () => {
      const claudeInterceptor = new ResponseInterceptor(mockWebContents as any, sessionId, 'claude');
      const openaiInterceptor = new ResponseInterceptor(mockWebContents as any, sessionId, 'openai');
      const geminiInterceptor = new ResponseInterceptor(mockWebContents as any, sessionId, 'gemini');

      expect(claudeInterceptor).toBeDefined();
      expect(openaiInterceptor).toBeDefined();
      expect(geminiInterceptor).toBeDefined();
    });
  });

  describe('enable()', () => {
    beforeEach(() => {
      interceptor = new ResponseInterceptor(mockWebContents as any, sessionId, 'claude');
    });

    it('should attach debugger and enable Fetch domain', async () => {
      await interceptor.enable();

      expect(mockWebContents.debugger.attach).toHaveBeenCalledWith('1.3');
      expect(mockWebContents.debugger.sendCommand).toHaveBeenCalledWith(
        'Fetch.enable',
        expect.objectContaining({
          patterns: expect.arrayContaining([
            expect.objectContaining({
              urlPattern: expect.stringContaining('claude.ai'),
              requestStage: 'Response',
            }),
          ]),
        })
      );
    });

    it('should enable with correct patterns for OpenAI', async () => {
      interceptor = new ResponseInterceptor(mockWebContents as any, sessionId, 'openai');
      await interceptor.enable();

      expect(mockWebContents.debugger.sendCommand).toHaveBeenCalledWith(
        'Fetch.enable',
        expect.objectContaining({
          patterns: expect.arrayContaining([
            expect.objectContaining({
              urlPattern: expect.stringContaining('openai.com'),
            }),
          ]),
        })
      );
    });

    it('should enable with correct patterns for Gemini', async () => {
      interceptor = new ResponseInterceptor(mockWebContents as any, sessionId, 'gemini');
      await interceptor.enable();

      expect(mockWebContents.debugger.sendCommand).toHaveBeenCalledWith(
        'Fetch.enable',
        expect.objectContaining({
          patterns: expect.arrayContaining([
            expect.objectContaining({
              urlPattern: expect.stringContaining('gemini.google.com'),
            }),
          ]),
        })
      );
    });

    it('should set up event listeners', async () => {
      await interceptor.enable();

      expect(mockWebContents.debugger.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWebContents.debugger.on).toHaveBeenCalledWith('detach', expect.any(Function));
    });

    it('should not enable twice if already enabled', async () => {
      await interceptor.enable();
      mockWebContents.debugger.attach.mockClear();

      await interceptor.enable();

      expect(mockWebContents.debugger.attach).not.toHaveBeenCalled();
    });

    it('should throw error for unknown provider', async () => {
      interceptor = new ResponseInterceptor(mockWebContents as any, sessionId, 'unknown');

      await expect(interceptor.enable()).rejects.toThrow('Unknown provider: unknown');
    });

    it('should handle debugger attachment failures', async () => {
      // Create a fresh interceptor with a mock that will reject
      const failingMock = createMockWebContents();
      failingMock.debugger.attach.mockImplementation(() => {
        throw new Error('Debugger already attached');
      });

      const failingInterceptor = new ResponseInterceptor(failingMock as any, sessionId, 'claude');

      await expect(failingInterceptor.enable()).rejects.toThrow('Debugger already attached');
    });
  });

  describe('disable()', () => {
    beforeEach(async () => {
      interceptor = new ResponseInterceptor(mockWebContents as any, sessionId, 'claude');
      await interceptor.enable();
      vi.clearAllMocks();
    });

    it('should detach debugger when enabled', async () => {
      await interceptor.disable();

      expect(mockWebContents.debugger.detach).toHaveBeenCalled();
    });

    it('should handle disable when not enabled', async () => {
      await interceptor.disable();
      mockWebContents.debugger.detach.mockClear();

      await interceptor.disable();

      expect(mockWebContents.debugger.detach).not.toHaveBeenCalled();
    });

    it('should handle detach errors gracefully', async () => {
      mockWebContents.debugger.detach.mockImplementation(() => {
        throw new Error('Detach failed');
      });

      await expect(interceptor.disable()).resolves.toBeUndefined();
    });
  });

  describe('Request Paused Handling', () => {
    beforeEach(async () => {
      interceptor = new ResponseInterceptor(mockWebContents as any, sessionId, 'claude');
      await interceptor.enable();
      vi.clearAllMocks();
    });

    it('should handle request paused event for JSON response', async () => {
      const mockResponse = {
        body: JSON.stringify({ completion: 'Hello, world!' }),
        base64Encoded: false,
      };

      mockWebContents.debugger.sendCommand
        .mockResolvedValueOnce(mockResponse) // getResponseBody
        .mockResolvedValueOnce(undefined); // continueRequest

      const params = {
        requestId: 'req-123',
        request: {
          url: 'https://claude.ai/api/organizations/123/chat_conversations/456/completion',
          method: 'POST',
          postData: JSON.stringify({ messages: [{ content: 'Hello' }] }),
        },
        responseStatusCode: 200,
        responseHeaders: [{ name: 'content-type', value: 'application/json' }],
      };

      // Trigger the message event
      (mockWebContents.debugger as any).emit('message', null, 'Fetch.requestPaused', params);

      // Wait for async handling
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockWebContents.debugger.sendCommand).toHaveBeenCalledWith('Fetch.getResponseBody', {
        requestId: 'req-123',
      });

      expect(mockWebContents.debugger.sendCommand).toHaveBeenCalledWith('Fetch.continueRequest', {
        requestId: 'req-123',
      });

      expect(mockCreateCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: sessionId,
          provider: 'claude',
          prompt: 'Hello',
          response: 'Hello, world!',
          response_format: 'json',
        })
      );
    });

    it('should decode base64 encoded responses', async () => {
      const responseText = 'Hello, world!';
      const base64Response = Buffer.from(responseText).toString('base64');

      const mockResponse = {
        body: base64Response,
        base64Encoded: true,
      };

      mockWebContents.debugger.sendCommand
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(undefined);

      const params = {
        requestId: 'req-123',
        request: {
          url: 'https://claude.ai/api/organizations/123/chat_conversations/456/completion',
          method: 'POST',
        },
        responseStatusCode: 200,
        responseHeaders: [],
      };

      (mockWebContents.debugger as any).emit('message', null, 'Fetch.requestPaused', params);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockCreateCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          response: responseText,
        })
      );
    });

    it('should handle SSE streaming responses', async () => {
      const sseBody = `data: {"delta":{"text":"Hello"}}\n\ndata: {"delta":{"text":" world"}}\n\ndata: [DONE]\n\n`;

      // Create fresh interceptor for OpenAI
      interceptor = new ResponseInterceptor(mockWebContents as any, sessionId, 'openai');
      await interceptor.enable();

      // Clear mocks after enable() to reset sendCommand call count
      vi.clearAllMocks();

      // Now set up mocks for the actual request handling
      const mockResponse = {
        body: sseBody,
        base64Encoded: false,
      };

      mockWebContents.debugger.sendCommand
        .mockResolvedValueOnce(mockResponse) // For getResponseBody
        .mockResolvedValueOnce(undefined); // For continueRequest

      const params = {
        requestId: 'req-123',
        request: {
          url: 'https://api.openai.com/v1/chat/completions',
          method: 'POST',
        },
        responseStatusCode: 200,
        responseHeaders: [{ name: 'content-type', value: 'text/event-stream' }],
      };

      (mockWebContents.debugger as any).emit('message', null, 'Fetch.requestPaused', params);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockCreateCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          response: 'Hello world',
          response_format: 'sse',
        })
      );
    });

    it('should handle OpenAI choice format in SSE', async () => {
      const sseBody = `data: {"choices":[{"delta":{"content":"Test"}}]}\n\n`;

      const mockResponse = { body: sseBody, base64Encoded: false };
      mockWebContents.debugger.sendCommand
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(undefined);

      const params = {
        requestId: 'req-123',
        request: { url: 'https://api.openai.com/v1/chat/completions', method: 'POST' },
        responseStatusCode: 200,
        responseHeaders: [{ name: 'content-type', value: 'text/event-stream' }],
      };

      (mockWebContents.debugger as any).emit('message', null, 'Fetch.requestPaused', params);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockCreateCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          response: 'Test',
        })
      );
    });

    it('should continue request even if processing fails', async () => {
      mockWebContents.debugger.sendCommand.mockRejectedValueOnce(new Error('Failed to get body'));

      const params = {
        requestId: 'req-123',
        request: { url: 'https://claude.ai/api/test', method: 'POST' },
        responseStatusCode: 200,
        responseHeaders: [],
      };

      (mockWebContents.debugger as any).emit('message', null, 'Fetch.requestPaused', params);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should attempt to continue request despite error
      expect(mockWebContents.debugger.sendCommand).toHaveBeenCalledWith('Fetch.continueRequest', {
        requestId: 'req-123',
      });
    });

    it('should handle multiple concurrent requests', async () => {
      const mockResponse = {
        body: JSON.stringify({ completion: 'Response' }),
        base64Encoded: false,
      };

      mockWebContents.debugger.sendCommand.mockResolvedValue(mockResponse);

      const params1 = {
        requestId: 'req-1',
        request: { url: 'https://claude.ai/api/test1', method: 'POST' },
        responseStatusCode: 200,
        responseHeaders: [],
      };

      const params2 = {
        requestId: 'req-2',
        request: { url: 'https://claude.ai/api/test2', method: 'POST' },
        responseStatusCode: 200,
        responseHeaders: [],
      };

      // Trigger multiple events
      (mockWebContents.debugger as any).emit('message', null, 'Fetch.requestPaused', params1);
      (mockWebContents.debugger as any).emit('message', null, 'Fetch.requestPaused', params2);

      await new Promise(resolve => setTimeout(resolve, 20));

      // Should handle both requests
      expect(mockCreateCapture).toHaveBeenCalledTimes(2);
    });
  });

  describe('Prompt Extraction', () => {
    beforeEach(async () => {
      interceptor = new ResponseInterceptor(mockWebContents as any, sessionId, 'claude');
      await interceptor.enable();
      vi.clearAllMocks();
    });

    it('should extract prompt from messages array', async () => {
      const requestBody = JSON.stringify({
        messages: [{ content: 'First message' }, { content: 'Last message' }],
      });

      const mockResponse = {
        body: JSON.stringify({ completion: 'Response' }),
        base64Encoded: false,
      };

      mockWebContents.debugger.sendCommand
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(undefined);

      const params = {
        requestId: 'req-123',
        request: {
          url: 'https://claude.ai/api/test',
          method: 'POST',
          postData: requestBody,
        },
        responseStatusCode: 200,
        responseHeaders: [],
      };

      (mockWebContents.debugger as any).emit('message', null, 'Fetch.requestPaused', params);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockCreateCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Last message',
        })
      );
    });

    it('should extract prompt from direct prompt field', async () => {
      const requestBody = JSON.stringify({ prompt: 'Direct prompt' });

      const mockResponse = {
        body: JSON.stringify({ completion: 'Response' }),
        base64Encoded: false,
      };

      mockWebContents.debugger.sendCommand
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(undefined);

      const params = {
        requestId: 'req-123',
        request: {
          url: 'https://claude.ai/api/test',
          method: 'POST',
          postData: requestBody,
        },
        responseStatusCode: 200,
        responseHeaders: [],
      };

      (mockWebContents.debugger as any).emit('message', null, 'Fetch.requestPaused', params);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockCreateCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Direct prompt',
        })
      );
    });

    it('should handle malformed request body gracefully', async () => {
      const mockResponse = {
        body: JSON.stringify({ completion: 'Response' }),
        base64Encoded: false,
      };

      mockWebContents.debugger.sendCommand
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(undefined);

      const params = {
        requestId: 'req-123',
        request: {
          url: 'https://claude.ai/api/test',
          method: 'POST',
          postData: 'not valid JSON {{{',
        },
        responseStatusCode: 200,
        responseHeaders: [],
      };

      (mockWebContents.debugger as any).emit('message', null, 'Fetch.requestPaused', params);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should still create capture with partial request body
      expect(mockCreateCapture).toHaveBeenCalled();
    });
  });

  describe('Model Extraction', () => {
    beforeEach(async () => {
      interceptor = new ResponseInterceptor(mockWebContents as any, sessionId, 'claude');
      await interceptor.enable();
      vi.clearAllMocks();
    });

    it('should extract model from response data', async () => {
      const mockResponse = {
        body: JSON.stringify({ model: 'claude-3-opus', completion: 'Response' }),
        base64Encoded: false,
      };

      mockWebContents.debugger.sendCommand
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(undefined);

      const params = {
        requestId: 'req-123',
        request: { url: 'https://claude.ai/api/test', method: 'POST' },
        responseStatusCode: 200,
        responseHeaders: [],
      };

      (mockWebContents.debugger as any).emit('message', null, 'Fetch.requestPaused', params);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockCreateCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-opus',
        })
      );
    });

    it('should extract model from request data', async () => {
      const requestBody = JSON.stringify({ model: 'gpt-4' });

      // Create and enable interceptor first
      interceptor = new ResponseInterceptor(mockWebContents as any, sessionId, 'openai');
      await interceptor.enable();
      vi.clearAllMocks();

      // Now set up mocks for the actual request handling
      const mockResponse = {
        body: JSON.stringify({ completion: 'Response' }),
        base64Encoded: false,
      };

      mockWebContents.debugger.sendCommand
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(undefined);

      const params = {
        requestId: 'req-123',
        request: {
          url: 'https://api.openai.com/v1/chat/completions',
          method: 'POST',
          postData: requestBody,
        },
        responseStatusCode: 200,
        responseHeaders: [],
      };

      (mockWebContents.debugger as any).emit('message', null, 'Fetch.requestPaused', params);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockCreateCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
        })
      );
    });
  });

  describe('Debugger Detach Handling', () => {
    beforeEach(async () => {
      interceptor = new ResponseInterceptor(mockWebContents as any, sessionId, 'claude');
      await interceptor.enable();
    });

    it('should handle debugger detach event', () => {
      // Emit detach event - this should trigger the registered handler
      (mockWebContents.debugger as any).emit('detach', null, 'target closed');

      // The event handler should have been registered during enable()
      // We verify this by checking that 'on' was called with 'detach'
      const detachHandlerCall = (mockWebContents.debugger.on as any).mock.calls.find(
        (call: any[]) => call[0] === 'detach'
      );

      expect(detachHandlerCall).toBeDefined();
      expect(detachHandlerCall[1]).toBeTypeOf('function');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      interceptor = new ResponseInterceptor(mockWebContents as any, sessionId, 'claude');
    });

    it('should handle missing response headers', async () => {
      await interceptor.enable();
      vi.clearAllMocks();

      const mockResponse = {
        body: JSON.stringify({ completion: 'Response' }),
        base64Encoded: false,
      };

      mockWebContents.debugger.sendCommand
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(undefined);

      const params = {
        requestId: 'req-123',
        request: { url: 'https://claude.ai/api/test', method: 'POST' },
        responseStatusCode: 200,
        responseHeaders: undefined,
      };

      (mockWebContents.debugger as any).emit('message', null, 'Fetch.requestPaused', params);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockCreateCapture).toHaveBeenCalled();
    });

    it('should handle empty response body', async () => {
      await interceptor.enable();
      vi.clearAllMocks();

      const mockResponse = { body: '', base64Encoded: false };

      mockWebContents.debugger.sendCommand
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(undefined);

      const params = {
        requestId: 'req-123',
        request: { url: 'https://claude.ai/api/test', method: 'POST' },
        responseStatusCode: 200,
        responseHeaders: [],
      };

      (mockWebContents.debugger as any).emit('message', null, 'Fetch.requestPaused', params);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockCreateCapture).toHaveBeenCalled();
    });

    it('should estimate token count correctly', async () => {
      await interceptor.enable();
      vi.clearAllMocks();

      const longText = 'word '.repeat(100); // 500 characters
      const mockResponse = {
        body: JSON.stringify({ completion: longText }),
        base64Encoded: false,
      };

      mockWebContents.debugger.sendCommand
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(undefined);

      const params = {
        requestId: 'req-123',
        request: { url: 'https://claude.ai/api/test', method: 'POST' },
        responseStatusCode: 200,
        responseHeaders: [],
      };

      (mockWebContents.debugger as any).emit('message', null, 'Fetch.requestPaused', params);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockCreateCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          token_count: expect.any(Number),
        })
      );

      const tokenCount = mockCreateCapture.mock.calls[0][0].token_count;
      expect(tokenCount).toBeGreaterThan(100);
    });
  });
});
