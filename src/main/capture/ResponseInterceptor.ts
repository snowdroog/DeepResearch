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

import { WebContents, BrowserWindow } from 'electron';
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
      '*://chatgpt.com/backend-api/conversation',  // New ChatGPT domain
      '*://api.openai.com/v1/chat/completions'
    ]
  },
  gemini: {
    name: 'gemini',
    patterns: [
      '*://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate*',
      '*://generativelanguage.googleapis.com/*/models/*:generateContent',
      '*://generativelanguage.googleapis.com/*/models/*:streamGenerateContent'
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
  private pendingRequests: Map<string, string> = new Map(); // requestId -> POST body

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
      // Enable Fetch domain with patterns for BOTH Request and Response stages
      // We need Request stage to capture POST data, Response stage to capture response body
      const patterns = [
        // Request stage patterns (to capture POST data)
        ...providerConfig.patterns.map(pattern => ({
          urlPattern: pattern,
          requestStage: 'Request'
        })),
        // Response stage patterns (to capture response body)
        ...providerConfig.patterns.map(pattern => ({
          urlPattern: pattern,
          requestStage: 'Response'
        }))
      ];

      await this.webContents.debugger.sendCommand('Fetch.enable', {
        patterns
      });

      console.log('[ResponseInterceptor] ✓ Fetch domain enabled successfully (Request + Response stages)');
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

    // Determine if this is Request or Response stage
    const isRequestStage = responseStatusCode === undefined;

    if (isRequestStage) {
      // REQUEST STAGE: Capture POST data and continue immediately
      console.log(`[ResponseInterceptor] Request stage: ${request.method} ${request.url}`);

      try {
        // Store POST data if available
        if (request.postData) {
          this.pendingRequests.set(requestId, request.postData);
          console.log(`[ResponseInterceptor] Stored POST data for ${this.provider}, length: ${request.postData.length}`);
        }

        // Continue request immediately
        await this.webContents.debugger.sendCommand('Fetch.continueRequest', {
          requestId
        });
      } catch (error) {
        console.error('[ResponseInterceptor] Failed to handle request stage:', error);
        try {
          await this.webContents.debugger.sendCommand('Fetch.continueRequest', { requestId });
        } catch (continueError) {
          console.error('[ResponseInterceptor] Failed to continue request:', continueError);
        }
      }
    } else {
      // RESPONSE STAGE: Capture response body and process
      console.log(`[ResponseInterceptor] Response stage: ${request.method} ${request.url}`);

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

        // Retrieve stored POST data
        const requestBody = this.pendingRequests.get(requestId);
        if (requestBody) {
          console.log(`[ResponseInterceptor] Retrieved stored POST data for ${this.provider}, length: ${requestBody.length}`);
          this.pendingRequests.delete(requestId); // Clean up
        } else {
          console.log(`[ResponseInterceptor] No stored POST data for ${this.provider} request`);
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
        console.error('[ResponseInterceptor] Failed to process response stage:', error);

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
   * Parse Gemini's special response format
   * Format: )]}\'\nLENGTH [["wrb.fr",null,"ESCAPED_JSON"]]\n...
   */
  private parseGeminiResponse(body: string): any {
    let fullText = '';
    const chunks: any[] = [];

    try {
      // Strip the )]}' prefix and split into lines
      const cleanBody = body.substring(4).trim();
      const lines = cleanBody.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          // Each line is: LENGTH [["wrb.fr",null,"ESCAPED_JSON"]]
          // Extract the JSON array part (after the length number)
          const jsonMatch = line.match(/^\d+\s+(\[\[.+\]\])$/);
          if (!jsonMatch) continue;

          const outerArray = JSON.parse(jsonMatch[1]);
          if (!Array.isArray(outerArray) || outerArray.length === 0) continue;

          // The structure is [["wrb.fr", null, "ESCAPED_JSON_STRING"]]
          const innerArray = outerArray[0];
          if (!Array.isArray(innerArray) || innerArray.length < 3) continue;

          // The third element is the escaped JSON string
          const escapedJson = innerArray[2];
          if (typeof escapedJson !== 'string') continue;

          // Parse the inner JSON
          const innerData = JSON.parse(escapedJson);
          chunks.push(innerData);

          // Extract text from the deeply nested structure
          // Structure: [null, [...ids], null, null, [[["rc_xxx", ["text"], [], ...]]]]
          if (Array.isArray(innerData) && innerData.length >= 5) {
            const textArray = innerData[4]; // Position 4 contains the content
            if (Array.isArray(textArray)) {
              const extracted = this.extractTextFromGeminiArray(textArray);
              if (extracted) {
                fullText += extracted;
              }
            }
          }
        } catch (error) {
          // Skip malformed chunks
          console.warn('[ResponseInterceptor] Failed to parse Gemini chunk:', error);
        }
      }
    } catch (error) {
      console.error('[ResponseInterceptor] Failed to parse Gemini response:', error);
      return { fullText: body, chunks: [], error: String(error) };
    }

    return {
      fullText: fullText.trim(),
      chunks,
      chunkCount: chunks.length
    };
  }

  /**
   * Recursively extract text from Gemini's nested array structure
   */
  private extractTextFromGeminiArray(arr: any): string {
    let text = '';

    if (Array.isArray(arr)) {
      for (const item of arr) {
        if (typeof item === 'string') {
          text += item;
        } else if (Array.isArray(item)) {
          // Look for text in nested arrays
          // Pattern: [["rc_xxx", ["text content"], [], ...]]
          if (item.length >= 2 && Array.isArray(item[1])) {
            for (const textItem of item[1]) {
              if (typeof textItem === 'string') {
                text += textItem;
              }
            }
          } else {
            // Recurse into nested arrays
            text += this.extractTextFromGeminiArray(item);
          }
        }
      }
    }

    return text;
  }

  /**
   * Extract conversation ID from provider API URLs
   */
  private extractConversationId(url: string, requestBody?: string): string | undefined {
    if (this.provider === 'claude') {
      // Claude URL pattern: https://claude.ai/api/organizations/.../chat_conversations/{conversation_id}/completion
      const match = url.match(/chat_conversations\/([a-f0-9-]{36})\//i);
      if (match) {
        console.log(`[ResponseInterceptor] Extracted Claude conversation_id: ${match[1]}`);
        return match[1];
      }
    } else if (this.provider === 'openai') {
      // OpenAI URL pattern: https://chat.openai.com/backend-api/conversation or chatgpt.com/backend-api/conversation
      // The conversation ID may be in the response or request body
      if (requestBody) {
        try {
          const parsed = JSON.parse(requestBody);
          if (parsed.conversation_id) {
            console.log(`[ResponseInterceptor] Extracted OpenAI conversation_id: ${parsed.conversation_id}`);
            return parsed.conversation_id;
          }
        } catch {
          // Not JSON
        }
      }
    } else if (this.provider === 'gemini') {
      // Gemini: conversation ID is in the f.req parameter
      if (requestBody) {
        try {
          const params = new URLSearchParams(requestBody);
          const fReq = params.get('f.req');
          if (fReq) {
            const outerArray = JSON.parse(fReq);
            if (Array.isArray(outerArray) && outerArray.length > 1) {
              const innerArray = JSON.parse(outerArray[1]);
              // Structure: [["prompt"], null, ["conv_id", "resp_id", "choice_id"]]
              if (Array.isArray(innerArray) && innerArray.length > 2 && Array.isArray(innerArray[2])) {
                const convId = innerArray[2][0]; // First ID is conversation ID
                if (convId) {
                  console.log(`[ResponseInterceptor] Extracted Gemini conversation_id: ${convId}`);
                  return convId;
                }
              }
            }
          }
        } catch (error) {
          console.warn('[ResponseInterceptor] Failed to extract Gemini conversation_id:', error);
        }
      }
    }

    return undefined;
  }

  /**
   * Detect message type based on prompt content and response characteristics
   */
  private detectMessageType(prompt: string, responseText: string): 'chat' | 'deep_research' | 'image' | 'code' {
    const lowerPrompt = prompt.toLowerCase();
    const lowerResponse = responseText.toLowerCase();

    // Check for image-related content
    if (lowerPrompt.includes('image') || lowerPrompt.includes('picture') ||
        lowerPrompt.includes('photo') || lowerPrompt.includes('generate image')) {
      return 'image';
    }

    // Check for code-related content
    if (lowerPrompt.includes('write code') || lowerPrompt.includes('implement') ||
        lowerPrompt.includes('function') || lowerPrompt.includes('debug') ||
        (responseText.includes('```') && responseText.split('```').length > 3)) {
      return 'code';
    }

    // Check for deep research indicators
    const deepResearchKeywords = [
      'research', 'analyze', 'analysis', 'deep dive', 'investigate',
      'explore', 'comprehensive', 'detailed', 'thorough', 'examine',
      'study', 'review', 'survey', 'compare', 'evaluate', 'assess'
    ];

    const hasResearchKeywords = deepResearchKeywords.some(keyword =>
      lowerPrompt.includes(keyword)
    );

    // Deep research typically has:
    // 1. Keywords in prompt
    // 2. Long responses (>3000 chars)
    // 3. Structured content with multiple sections
    const isLongResponse = responseText.length > 3000;
    const hasStructuredContent = (responseText.match(/\n\n/g) || []).length > 5 ||
                                  (responseText.match(/#+\s/g) || []).length > 3;

    if (hasResearchKeywords && (isLongResponse || hasStructuredContent)) {
      return 'deep_research';
    }

    // Default to chat
    return 'chat';
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

      // ALWAYS extract prompt from request body first (independent of response format)
      prompt = this.extractPromptFromRequest(response.requestBody);

      // Extract conversation ID from URL or request body
      const conversationId = this.extractConversationId(response.url, response.requestBody);

      // Handle Gemini's special format (starts with )]}\')
      if (this.provider === 'gemini' && response.body.startsWith(')]}\'')) {
        const parsed = this.parseGeminiResponse(response.body);
        responseText = parsed.fullText;
        parsedData = parsed;
        console.log(`[ResponseInterceptor] Gemini response parsed: ${responseText.length} chars`);
      } else if (isStreaming) {
        // Parse SSE stream
        const parsed = this.parseSSEStream(response.body);
        parsedData = parsed;
        responseText = parsed.fullText || response.body;
      } else {
        // Try to parse as JSON
        try {
          parsedData = JSON.parse(response.body);
          responseText = this.extractResponseText(parsedData);
        } catch {
          // Not JSON, use raw body
          responseText = response.body;
        }
      }

      // Detect message type based on prompt and response
      const messageType = this.detectMessageType(prompt, responseText);
      console.log(`[ResponseInterceptor] Detected message type: ${messageType}`);

      // Auto-generate tags based on message type
      const autoTags = [messageType];
      if (messageType === 'deep_research') {
        autoTags.push('research');
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
        tags: JSON.stringify(autoTags),
        notes: undefined,
        conversation_id: conversationId,
        message_type: messageType
      });

      console.log(`[ResponseInterceptor] Captured response saved: ${captureId}`);

      // Broadcast to all windows to trigger auto-refresh in main window
      const allWindows = BrowserWindow.getAllWindows();
      for (const window of allWindows) {
        window.webContents.send('response:captured', {
          captureId,
          sessionId: this.sessionId,
          provider: this.provider,
          preview: responseText.substring(0, 200)
        });
      }
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

    // Handle Gemini's special format (form data with f.req parameter)
    if (this.provider === 'gemini') {
      try {
        // Gemini sends form-urlencoded data with f.req parameter
        // Format: f.req=[null,"[[\"user prompt\"],null,[\"conv_id\",\"resp_id\",\"choice_id\"]]"]
        const params = new URLSearchParams(requestBody);
        const fReq = params.get('f.req');

        if (fReq) {
          // First parse: [null, "inner_json"]
          const outerArray = JSON.parse(fReq);
          if (Array.isArray(outerArray) && outerArray.length > 1) {
            // Second parse: [["user prompt"], null, [...ids]]
            const innerArray = JSON.parse(outerArray[1]);
            if (Array.isArray(innerArray) && Array.isArray(innerArray[0]) && innerArray[0].length > 0) {
              const prompt = innerArray[0][0];
              console.log('[ResponseInterceptor] ✓ Gemini prompt extracted:', prompt.substring(0, 100));
              return prompt;
            }
          }
        }
      } catch (error) {
        console.warn('[ResponseInterceptor] Failed to parse Gemini f.req format:', error);
      }
    }

    // Try standard JSON formats for other providers
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
