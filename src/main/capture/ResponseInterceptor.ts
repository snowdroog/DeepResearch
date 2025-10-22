/**
 * ResponseInterceptor - Captures AI provider responses using Chrome DevTools Protocol
 *
 * Features:
 * - Uses CDP Fetch domain to intercept network responses
 * - Pattern matches URLs for Claude, OpenAI, Gemini
 * - Extracts response bodies from API calls
 * - Parses streaming (SSE) responses
 * - Stores captured data in database
 */

import { WebContents } from 'electron';
import { randomUUID } from 'crypto';
import { db } from '../database/db.js';

// Provider-specific URL patterns
const PROVIDER_PATTERNS = {
  claude: {
    name: 'claude',
    patterns: [
      '*://claude.ai/api/organizations/*/chat_conversations/*/completion',
      '*://claude.ai/api/append_message',
      '*://api.anthropic.com/v1/messages'
    ]
  },
  openai: {
    name: 'openai',
    patterns: [
      '*://chat.openai.com/backend-api/conversation',
      '*://api.openai.com/v1/chat/completions'
    ]
  },
  gemini: {
    name: 'gemini',
    patterns: [
      '*://gemini.google.com/*/conversation',
      '*://generativelanguage.googleapis.com/*/models/*:generateContent'
    ]
  }
};

interface CapturedResponse {
  url: string;
  method: string;
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  requestBody?: string;
}

export class ResponseInterceptor {
  private webContents: WebContents;
  private sessionId: string;
  private provider: string;
  private enabled: boolean = false;
  private debuggerAttached: boolean = false;

  constructor(webContents: WebContents, sessionId: string, provider: string) {
    this.webContents = webContents;
    this.sessionId = sessionId;
    this.provider = provider;
  }

  /**
   * Enable response interception
   */
  async enable(): Promise<void> {
    if (this.enabled) {
      console.log(`[ResponseInterceptor] Already enabled for session ${this.sessionId}`);
      return;
    }

    console.log(`[ResponseInterceptor] Starting enable process for session ${this.sessionId} (${this.provider})`);

    try {
      // Attach CDP debugger
      console.log(`[ResponseInterceptor] Step 1/3: Attaching CDP debugger...`);
      await this.attachDebugger();

      // Enable Fetch domain with interception
      console.log(`[ResponseInterceptor] Step 2/3: Enabling Fetch domain...`);
      await this.enableFetchDomain();

      // Set up event listeners
      console.log(`[ResponseInterceptor] Step 3/3: Setting up event listeners...`);
      this.setupEventListeners();

      this.enabled = true;
      console.log(`[ResponseInterceptor] ✓ Successfully enabled for session ${this.sessionId} (${this.provider})`);
    } catch (error) {
      console.error(`[ResponseInterceptor] ✗ Failed to enable for session ${this.sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Disable response interception
   */
  async disable(): Promise<void> {
    if (!this.enabled) return;

    try {
      if (this.debuggerAttached) {
        this.webContents.debugger.detach();
        this.debuggerAttached = false;
      }

      this.enabled = false;
      console.log(`[ResponseInterceptor] Disabled for session ${this.sessionId}`);
    } catch (error) {
      console.error('[ResponseInterceptor] Failed to disable:', error);
    }
  }

  /**
   * Attach CDP debugger to webContents
   */
  private async attachDebugger(): Promise<void> {
    if (this.debuggerAttached) {
      console.log('[ResponseInterceptor] Debugger already attached, skipping');
      return;
    }

    try {
      console.log('[ResponseInterceptor] Attaching CDP debugger version 1.3...');
      this.webContents.debugger.attach('1.3');
      this.debuggerAttached = true;
      console.log('[ResponseInterceptor] ✓ Debugger attached successfully');
    } catch (error) {
      console.error('[ResponseInterceptor] ✗ Failed to attach debugger:', error);
      throw error;
    }
  }

  /**
   * Enable CDP Fetch domain for response interception
   */
  private async enableFetchDomain(): Promise<void> {
    const providerConfig = PROVIDER_PATTERNS[this.provider as keyof typeof PROVIDER_PATTERNS];

    if (!providerConfig) {
      const errorMsg = `Unknown provider: ${this.provider}`;
      console.error(`[ResponseInterceptor] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    console.log(`[ResponseInterceptor] Enabling Fetch domain for provider: ${this.provider}`);
    console.log(`[ResponseInterceptor] URL patterns to intercept:`, providerConfig.patterns);

    try {
      // Enable Fetch domain with request patterns
      await this.webContents.debugger.sendCommand('Fetch.enable', {
        patterns: providerConfig.patterns.map(pattern => ({
          urlPattern: pattern,
          requestStage: 'Response'
        }))
      });

      console.log('[ResponseInterceptor] ✓ Fetch domain enabled successfully');
    } catch (error) {
      console.error('[ResponseInterceptor] ✗ Failed to enable Fetch domain:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners for CDP events
   */
  private setupEventListeners(): void {
    // Listen for requestPaused events (Fetch domain)
    this.webContents.debugger.on('message', async (_event, method, params) => {
      if (method === 'Fetch.requestPaused') {
        await this.handleRequestPaused(params);
      }
    });

    // Listen for debugger detach
    this.webContents.debugger.on('detach', (_event, reason) => {
      console.log(`[ResponseInterceptor] Debugger detached: ${reason}`);
      this.debuggerAttached = false;
      this.enabled = false;
    });
  }

  /**
   * Handle Fetch.requestPaused event
   */
  private async handleRequestPaused(params: any): Promise<void> {
    const { requestId, request, responseStatusCode, responseHeaders } = params;

    console.log(`[ResponseInterceptor] Request paused: ${request.method} ${request.url}`);

    try {
      // Get response body
      const response = await this.webContents.debugger.sendCommand('Fetch.getResponseBody', {
        requestId
      });

      // Decode body
      let body: string;
      if (response.base64Encoded) {
        body = Buffer.from(response.body, 'base64').toString('utf-8');
      } else {
        body = response.body;
      }

      // Get request body if available
      let requestBody: string | undefined;
      try {
        if (request.postData) {
          requestBody = request.postData;
        }
      } catch (error) {
        console.warn('[ResponseInterceptor] Could not get request body:', error);
      }

      // Parse and store the captured response
      await this.processResponse({
        url: request.url,
        method: request.method,
        statusCode: responseStatusCode,
        headers: this.parseHeaders(responseHeaders),
        body,
        requestBody
      });

      // Continue the request (don't block)
      await this.webContents.debugger.sendCommand('Fetch.continueRequest', {
        requestId
      });
    } catch (error) {
      console.error('[ResponseInterceptor] Failed to process paused request:', error);

      // Continue request even if processing failed
      try {
        await this.webContents.debugger.sendCommand('Fetch.continueRequest', {
          requestId
        });
      } catch (continueError) {
        console.error('[ResponseInterceptor] Failed to continue request:', continueError);
      }
    }
  }

  /**
   * Parse headers from CDP format
   */
  private parseHeaders(headers: any): Record<string, string> {
    const parsed: Record<string, string> = {};

    if (Array.isArray(headers)) {
      for (const header of headers) {
        parsed[header.name.toLowerCase()] = header.value;
      }
    } else if (typeof headers === 'object') {
      for (const [key, value] of Object.entries(headers)) {
        parsed[key.toLowerCase()] = String(value);
      }
    }

    return parsed;
  }

  /**
   * Process captured response and store in database
   */
  private async processResponse(response: CapturedResponse): Promise<void> {
    console.log(`[ResponseInterceptor] Processing response from ${response.url}`);

    try {
      // Check if this is a streaming response (SSE)
      const contentType = response.headers['content-type'] || '';
      const isStreaming = contentType.includes('text/event-stream') ||
                          contentType.includes('text/plain') ||
                          response.body.includes('data: ');

      let parsedData: any;
      let prompt = '';
      let responseText = '';

      if (isStreaming) {
        // Parse SSE stream
        const parsed = this.parseSSEStream(response.body);
        parsedData = parsed;
        responseText = parsed.fullText || response.body;
        prompt = this.extractPromptFromRequest(response.requestBody);
      } else {
        // Try to parse as JSON
        try {
          parsedData = JSON.parse(response.body);
          responseText = this.extractResponseText(parsedData);
          prompt = this.extractPromptFromRequest(response.requestBody);
        } catch {
          // Not JSON, use raw body
          responseText = response.body;
        }
      }

      // Create capture in database
      const captureId = randomUUID();
      db.createCapture({
        id: captureId,
        session_id: this.sessionId,
        provider: this.provider,
        prompt: prompt,
        response: responseText,
        response_format: isStreaming ? 'sse' : 'json',
        model: this.extractModel(parsedData, response.requestBody),
        token_count: this.estimateTokens(prompt + responseText),
        tags: undefined,
        notes: undefined
      });

      console.log(`[ResponseInterceptor] Captured response saved: ${captureId}`);

      // Emit event to notify renderer (optional)
      this.webContents.send('response:captured', {
        captureId,
        sessionId: this.sessionId,
        provider: this.provider,
        preview: responseText.substring(0, 200)
      });
    } catch (error) {
      console.error('[ResponseInterceptor] Failed to process response:', error);
    }
  }

  /**
   * Parse Server-Sent Events (SSE) stream
   */
  private parseSSEStream(body: string): any {
    const lines = body.split('\n');
    const events: any[] = [];
    let fullText = '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.substring(6).trim();

        // Skip keep-alive messages
        if (data === '[DONE]' || data === '') continue;

        try {
          const parsed = JSON.parse(data);
          events.push(parsed);

          // Extract text content from various formats
          if (parsed.completion) {
            fullText += parsed.completion;
          } else if (parsed.delta?.text) {
            fullText += parsed.delta.text;
          } else if (parsed.choices?.[0]?.delta?.content) {
            fullText += parsed.choices[0].delta.content;
          } else if (parsed.choices?.[0]?.text) {
            fullText += parsed.choices[0].text;
          }
        } catch {
          // Not JSON, might be plain text
          fullText += data + ' ';
        }
      }
    }

    return {
      events,
      fullText: fullText.trim(),
      eventCount: events.length
    };
  }

  /**
   * Extract prompt from request body
   */
  private extractPromptFromRequest(requestBody?: string): string {
    if (!requestBody) return '';

    try {
      const parsed = JSON.parse(requestBody);

      // Try various common formats
      if (parsed.prompt) return parsed.prompt;
      if (parsed.messages) {
        const lastMessage = parsed.messages[parsed.messages.length - 1];
        return lastMessage?.content || '';
      }
      if (parsed.text) return parsed.text;
      if (parsed.input) return parsed.input;

      return '';
    } catch {
      return requestBody.substring(0, 500); // Return first 500 chars if not JSON
    }
  }

  /**
   * Extract response text from parsed data
   */
  private extractResponseText(data: any): string {
    // Try various response formats
    if (data.completion) return data.completion;
    if (data.response) return data.response;
    if (data.text) return data.text;
    if (data.content) return data.content;
    if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
    if (data.choices?.[0]?.text) return data.choices[0].text;

    // Fallback to stringified JSON
    return JSON.stringify(data);
  }

  /**
   * Extract model name from request or response
   */
  private extractModel(responseData: any, requestBody?: string): string | undefined {
    // Try response
    if (responseData?.model) return responseData.model;

    // Try request
    if (requestBody) {
      try {
        const parsed = JSON.parse(requestBody);
        if (parsed.model) return parsed.model;
      } catch {
        // Ignore
      }
    }

    return undefined;
  }

  /**
   * Estimate token count (very rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
