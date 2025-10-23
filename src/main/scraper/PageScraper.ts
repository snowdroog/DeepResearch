/**
 * PageScraper - Scrapes conversation content from AI provider pages
 *
 * Executes JavaScript in WebContentsView to extract conversations
 * from the DOM when user wants to manually capture a page.
 */

import { WebContentsView } from 'electron'
import { randomUUID } from 'crypto'
import { db } from '../database/db.js'

export interface ScrapedConversation {
  prompt: string
  response: string
  provider: string
  url: string
  isDeepResearch?: boolean
  artifactUrl?: string  // URL to download artifact file
  sources?: Array<{
    title: string
    url: string
    snippet?: string
  }>
}

export class PageScraper {
  /**
   * Extract deep research specific content (sources only)
   * NOTE: We use the already-parsed assistant message as the report content
   */
  private static async extractDeepResearchContent(view: WebContentsView): Promise<Partial<ScrapedConversation>> {
    try {
      const result = await view.webContents.executeJavaScript(`
        (function() {
          try {
            const deepResearch = {
              isDeepResearch: false,
              sources: []
            };

            // Detect if this is a deep research conversation by looking for the research toggle
            // Look for the actual "research" toggle in Claude's UI (button or toggle element)
            const researchToggle = document.querySelector('button[aria-label*="esearch"], button[aria-label*="Research"], [data-testid*="research"], button:has-text("Research")');

            // Also check for visual indicators that research mode was used
            const hasResearchUI = researchToggle !== null;

            // Additional check: look for the specific research completion message
            const pageText = document.body.textContent || '';
            const hasResearchComplete =
              pageText.includes('Research complete') ||
              /\d+\s*minutes?\s*of\s*research/i.test(pageText);

            // Only mark as deep research if we find the toggle OR the completion message
            if (!hasResearchUI && !hasResearchComplete) {
              return deepResearch;
            }

            deepResearch.isDeepResearch = true;
            console.log('[PageScraper] Deep research detected via', hasResearchUI ? 'UI toggle' : 'completion message');

            // Look for Claude Artifacts - we'll store the URL for download later
            deepResearch.artifactUrl = null;

            // Look for artifact buttons or links that might indicate downloadable content
            const artifactElements = Array.from(document.querySelectorAll('button, a, div[role="button"]')).filter(el => {
              const text = el.textContent?.toLowerCase() || '';
              const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
              return text.includes('artifact') ||
                     ariaLabel.includes('artifact') ||
                     text.includes('view report') ||
                     text.includes('research report') ||
                     text.includes('download');
            });

            if (artifactElements.length > 0) {
              console.log('[PageScraper] Found', artifactElements.length, 'potential artifact elements');

              // Check if any of them have href or data attributes with URLs
              for (const el of artifactElements) {
                const href = el.getAttribute('href');
                const dataUrl = el.getAttribute('data-url') || el.getAttribute('data-artifact-url');

                if (href && href.startsWith('http')) {
                  deepResearch.artifactUrl = href;
                  console.log('[PageScraper] Found artifact URL:', href);
                  break;
                } else if (dataUrl) {
                  deepResearch.artifactUrl = dataUrl;
                  console.log('[PageScraper] Found artifact data URL:', dataUrl);
                  break;
                }
              }
            }

            if (!deepResearch.artifactUrl) {
              console.log('[PageScraper] No artifact download URL found - artifact may need manual download');
            }

            // Extract sources
            // Look for links in the page, especially those that look like citations
            const links = Array.from(document.querySelectorAll('a[href^="http"]'));
            const sources = [];

            links.forEach(link => {
              const href = link.getAttribute('href');
              const text = link.textContent?.trim() || '';

              // Filter out navigation links and internal links
              if (href && text && !href.includes('claude.ai') && text.length > 5) {
                sources.push({
                  title: text,
                  url: href,
                  snippet: link.parentElement?.textContent?.substring(0, 200) || null
                });
              }
            });

            // Deduplicate sources by URL
            const uniqueSources = [];
            const seenUrls = new Set();
            sources.forEach(source => {
              if (!seenUrls.has(source.url)) {
                seenUrls.add(source.url);
                uniqueSources.push(source);
              }
            });

            deepResearch.sources = uniqueSources;

            return deepResearch;
          } catch (error) {
            console.error('Deep research extraction error:', error);
            return { isDeepResearch: false };
          }
        })()
      `);

      return result;
    } catch (error) {
      console.error('[PageScraper] Error extracting deep research content:', error);
      return { isDeepResearch: false };
    }
  }

  /**
   * Scrape the current conversation from a Claude.ai page
   */
  static async scrapeClaudeConversation(view: WebContentsView): Promise<ScrapedConversation | null> {
    try {
      const result = await view.webContents.executeJavaScript(`
        (function() {
          try {
            // Collect debug info
            const debug = {};

            // DEBUG: Log all divs with substantial text
            const allDivs = document.querySelectorAll('div');
            const bigDivs = Array.from(allDivs)
              .map(div => ({
                textLength: (div.textContent?.trim() || '').length,
                nestedDivs: div.querySelectorAll('div').length
              }))
              .filter(d => d.textLength > 1000)
              .sort((a, b) => b.textLength - a.textLength);

            debug.bigDivsCount = bigDivs.length;
            debug.biggestDivLength = bigDivs[0]?.textLength || 0;
            debug.biggestDivNested = bigDivs[0]?.nestedDivs || 0;

            // Try multiple selector strategies for Claude.ai messages
            let messages = [];
            let strategy = '';

            // Strategy 1: data-testid attributes (old Claude)
            const testIdMessages = document.querySelectorAll('[data-testid^="user-message"], [data-testid^="message-"]');
            debug.strategy1Count = testIdMessages.length;
            if (testIdMessages.length > 0) {
              messages = Array.from(testIdMessages);
              strategy = 'data-testid';
            }

            // Strategy 2: Look for divs with specific classes that contain user/assistant content
            if (messages.length === 0) {
              // Claude often uses a structure like: div with class containing "font-user" or similar
              const allDivs = document.querySelectorAll('div[class*="font-"], div[data-is-streaming]');
              debug.strategy2Count = allDivs.length;
              if (allDivs.length > 0) {
                messages = Array.from(allDivs);
                strategy = 'font-classes';
              }
            }

            // Strategy 3: Look for the conversation structure - find all direct children of main content area
            if (messages.length === 0) {
              const main = document.querySelector('main');
              debug.hasMain = !!main;
              if (main) {
                // Look for groups of messages - usually in a specific container
                const messageContainers = main.querySelectorAll('div[class*="group"], div[role="presentation"]');
                debug.strategy3Count = messageContainers.length;
                if (messageContainers.length > 0) {
                  messages = Array.from(messageContainers);
                  strategy = 'main-containers';
                }
              }
            }

            // Strategy 4: Generic - find all paragraphs and divs with substantial text
            if (messages.length === 0) {
              const textElements = document.querySelectorAll('p, div');
              const filtered = Array.from(textElements).filter(el => {
                const text = el.textContent?.trim() || '';
                return text.length > 20 && text.length < 10000 && !el.querySelector('p, div');
              });
              debug.strategy4Count = filtered.length;
              if (filtered.length > 0) {
                messages = filtered;
                strategy = 'text-content';
              }
            }

            if (messages.length === 0) {
              return {
                error: 'No messages found on page',
                debug: {
                  ...debug,
                  url: window.location.href,
                  divCount: document.querySelectorAll('div').length,
                  pCount: document.querySelectorAll('p').length
                }
              };
            }

            debug.selectedStrategy = strategy;
            debug.messageCount = messages.length;

            const conversation = {
              messages: [],
              url: window.location.href,
              strategy
            };

            messages.forEach((msg, index) => {
              const text = msg.textContent || '';

              // Try to determine if it's a user message with multiple strategies
              const testId = msg.getAttribute('data-testid') || '';
              const className = msg.className || '';

              // Strategy 1: Check data-testid - but avoid matching "user-message" (which is just the component name)
              // Look for "human-message" or specific user indicators
              const testIdIsUser = testId.includes('human') ||
                                   testId.includes('Human') ||
                                   (testId.includes('user') && !testId.includes('message-text'));

              // Strategy 2: Check if element contains a "role" attribute
              const roleAttr = msg.getAttribute('role');

              // Strategy 3: Alternate messages (user, assistant, user, assistant...)
              // This works if messages are in chronological order
              const alternateRole = index % 2 === 0 ? 'user' : 'assistant';

              // Strategy 4: Check parent or sibling elements for clues
              const parent = msg.parentElement;
              const parentTestId = parent?.getAttribute('data-testid') || '';
              const parentIsUser = parentTestId.includes('human') || parentTestId.includes('Human');

              // Determine role with priority
              let isUser;
              if (testIdIsUser || parentIsUser) {
                isUser = true;
              } else if (roleAttr) {
                isUser = roleAttr === 'user' || roleAttr === 'human';
              } else {
                // Fallback to alternating pattern
                isUser = alternateRole === 'user';
              }

              if (text.trim().length > 0) {
                conversation.messages.push({
                  role: isUser ? 'user' : 'assistant',
                  content: text.trim(),
                  debug: { testId, className, index, strategy }
                });
              }
            });

            // Attach debug info to conversation
            conversation.debug = debug;

            return conversation;
          } catch (error) {
            return { error: error.message };
          }
        })()
      `)

      if (!result || result.error) {
        console.error('[PageScraper] Failed to scrape:', result?.error)
        if (result?.debug) {
          console.error('[PageScraper] Debug info:', JSON.stringify(result.debug, null, 2))
        }
        return null
      }

      // Log debug information
      if (result.debug) {
        console.log('[PageScraper] === DEBUG INFO ===')
        console.log(`[PageScraper] Biggest div: ${result.debug.biggestDivLength} chars with ${result.debug.biggestDivNested} nested divs`)
        console.log(`[PageScraper] Found ${result.debug.bigDivsCount} divs with >1000 chars`)
        console.log(`[PageScraper] Strategy 1 (data-testid): ${result.debug.strategy1Count} elements`)
        console.log(`[PageScraper] Strategy 2 (font-classes): ${result.debug.strategy2Count} elements`)
        console.log(`[PageScraper] Strategy 3 (main-containers): ${result.debug.strategy3Count || 0} elements (hasMain: ${result.debug.hasMain})`)
        console.log(`[PageScraper] Strategy 4 (text-content): ${result.debug.strategy4Count} elements`)
        console.log(`[PageScraper] Selected strategy: ${result.debug.selectedStrategy}`)
        console.log(`[PageScraper] Message count: ${result.debug.messageCount}`)
        console.log('[PageScraper] === END DEBUG ===')
      }

      console.log(`[PageScraper] Successfully scraped using strategy: ${result.strategy}`)
      console.log(`[PageScraper] Found ${result.messages.length} message elements`)

      // Extract first user message as prompt and last assistant message as response
      const userMessages = result.messages.filter((m: any) => m.role === 'user')
      const assistantMessages = result.messages.filter((m: any) => m.role === 'assistant')

      console.log(`[PageScraper] Parsed ${userMessages.length} user messages and ${assistantMessages.length} assistant messages`)

      // If message classification failed, try extracting from conversation container (exclude sidebars)
      if (userMessages.length === 0 || assistantMessages.length === 0) {
        console.log('[PageScraper] Message classification failed, attempting to extract from conversation container...')

        const conversationContent = await view.webContents.executeJavaScript(`
          (function() {
            // Filter out common navigation/sidebar keywords
            const excludeKeywords = [
              'New chat', 'All chats', 'Recents', 'Projects', 'Artifacts',
              'Upgrade', 'Settings', 'Sign out', 'Code', 'Chats',
              'Account', 'Help', 'Support', 'Feedback'
            ];

            function containsExcludedKeywords(text) {
              const firstLine = text.split('\\n')[0];
              return excludeKeywords.some(keyword => firstLine.includes(keyword));
            }

            function isLikelySidebar(element) {
              // Check if element or its parents have sidebar-related attributes
              let current = element;
              for (let i = 0; i < 5 && current; i++) {
                const classes = current.className || '';
                const id = current.id || '';
                if (
                  classes.includes('sidebar') ||
                  classes.includes('nav') ||
                  classes.includes('menu') ||
                  id.includes('sidebar') ||
                  id.includes('nav')
                ) {
                  return true;
                }
                current = current.parentElement;
              }
              return false;
            }

            // Strategy: Find the main conversation area
            // 1. Look for main tag or role="main"
            let conversationArea = document.querySelector('main') ||
                                   document.querySelector('[role="main"]');

            if (!conversationArea) {
              // 2. Find the largest content area that's not a sidebar
              const allDivs = Array.from(document.querySelectorAll('div'));
              const candidates = allDivs
                .map(div => ({
                  div,
                  text: div.textContent?.trim() || '',
                  nested: div.querySelectorAll('div').length
                }))
                .filter(d =>
                  d.text.length > 1000 &&
                  !isLikelySidebar(d.div) &&
                  !containsExcludedKeywords(d.text)
                )
                .sort((a, b) => {
                  // Prefer elements with moderate nesting (actual content)
                  // Over highly nested (page wrapper) or barely nested (fragments)
                  const aNestScore = Math.abs(a.nested - 50);
                  const bNestScore = Math.abs(b.nested - 50);
                  if (Math.abs(aNestScore - bNestScore) > 20) {
                    return aNestScore - bNestScore;
                  }
                  return b.text.length - a.text.length;
                });

              conversationArea = candidates[0]?.div;
            }

            if (!conversationArea) {
              return { error: 'Could not find conversation area' };
            }

            // Extract text from conversation area only
            const text = conversationArea.textContent?.trim() || '';

            // Try to split into prompt and response
            // Look for common patterns
            const lines = text.split('\\n').filter(l => l.trim().length > 10);

            // Strategy: Find the user's prompt (usually shorter, at the beginning)
            // and the assistant's response (usually much longer, especially for deep research)
            let promptEndIndex = -1;

            // Look for the first user message (typically short, clear question)
            for (let i = 0; i < Math.min(15, lines.length); i++) {
              const line = lines[i];
              // User prompts are typically:
              // - Between 20-500 chars (questions)
              // - Not containing research indicators
              if (
                line.length > 20 &&
                line.length < 500 &&
                !line.includes('Research complete') &&
                !line.includes('Sources:') &&
                !line.includes('Analyzing') &&
                !line.toLowerCase().includes('researching')
              ) {
                promptEndIndex = i;
                break;
              }
            }

            // If we found a likely prompt, use it; otherwise use first few lines
            const prompt = promptEndIndex > -1
              ? lines.slice(0, promptEndIndex + 1).join(' ').substring(0, 1000)
              : lines.slice(0, 2).join(' ').substring(0, 500);

            // The response is everything after the prompt
            // For deep research, this should include the full report
            const responseLines = promptEndIndex > -1 ? lines.slice(promptEndIndex + 1) : lines.slice(2);
            const response = responseLines.join('\\n').trim() || text;

            return {
              prompt,
              response,
              fullText: text,
              linesFound: lines.length
            };
          })()
        `)

        if (conversationContent && !conversationContent.error && conversationContent.response) {
          console.log(`[PageScraper] Extracted conversation: ${conversationContent.response.length} chars response`)
          console.log(`[PageScraper] Prompt: ${conversationContent.prompt.substring(0, 100)}...`)
          console.log(`[PageScraper] Response preview: ${conversationContent.response.substring(0, 200)}...`)
          console.log(`[PageScraper] Found ${conversationContent.linesFound} lines`)

          // Check for deep research BEFORE returning
          const deepResearchData = await this.extractDeepResearchContent(view)

          console.log(`[PageScraper] Deep research detected: ${deepResearchData.isDeepResearch}`)
          if (deepResearchData.isDeepResearch) {
            console.log(`[PageScraper] Found ${deepResearchData.sources?.length || 0} sources`)
            if (deepResearchData.artifactUrl) {
              console.log(`[PageScraper] Found artifact URL: ${deepResearchData.artifactUrl}`)
            }
          }

          return {
            prompt: conversationContent.prompt,
            response: conversationContent.response,
            provider: 'claude',
            url: result.url,
            ...deepResearchData
          }
        }

        console.error('[PageScraper] No user or assistant messages found')
        console.error('[PageScraper] Conversation extraction failed:', conversationContent?.error)
        return null
      }

      // Extract deep research content if applicable
      const deepResearchData = await this.extractDeepResearchContent(view)

      console.log(`[PageScraper] Deep research detected: ${deepResearchData.isDeepResearch}`)
      if (deepResearchData.isDeepResearch) {
        console.log(`[PageScraper] Found ${deepResearchData.sources?.length || 0} sources`)
        console.log(`[PageScraper] Response length: ${assistantMessages[assistantMessages.length - 1].content.length} chars`)
      }

      return {
        prompt: userMessages[0].content,
        response: assistantMessages[assistantMessages.length - 1].content,
        provider: 'claude',
        url: result.url,
        ...deepResearchData
      }
    } catch (error) {
      console.error('[PageScraper] Error scraping Claude conversation:', error)
      return null
    }
  }

  /**
   * Scrape the current conversation from a ChatGPT page
   */
  static async scrapeChatGPTConversation(view: WebContentsView): Promise<ScrapedConversation | null> {
    try {
      const result = await view.webContents.executeJavaScript(`
        (function() {
          try {
            // ChatGPT uses different selectors
            const messages = document.querySelectorAll('[data-message-author-role]');

            if (messages.length === 0) {
              return { error: 'No messages found on page' };
            }

            const conversation = {
              messages: [],
              url: window.location.href
            };

            messages.forEach((msg) => {
              const role = msg.getAttribute('data-message-author-role');
              const text = msg.textContent || '';

              conversation.messages.push({
                role: role,
                content: text.trim()
              });
            });

            return conversation;
          } catch (error) {
            return { error: error.message };
          }
        })()
      `)

      if (!result || result.error) {
        console.error('[PageScraper] Failed to scrape ChatGPT:', result?.error)
        return null
      }

      const userMessages = result.messages.filter((m: any) => m.role === 'user')
      const assistantMessages = result.messages.filter((m: any) => m.role === 'assistant')

      if (userMessages.length === 0 || assistantMessages.length === 0) {
        return null
      }

      return {
        prompt: userMessages[0].content,
        response: assistantMessages[assistantMessages.length - 1].content,
        provider: 'openai',
        url: result.url
      }
    } catch (error) {
      console.error('[PageScraper] Error scraping ChatGPT conversation:', error)
      return null
    }
  }

  /**
   * Auto-detect provider and scrape accordingly
   */
  static async scrapeCurrentPage(view: WebContentsView, sessionId: string, provider: string): Promise<boolean> {
    console.log(`[PageScraper] Scraping current page for provider: ${provider}`)

    let conversation: ScrapedConversation | null = null

    if (provider === 'claude') {
      conversation = await this.scrapeClaudeConversation(view)
    } else if (provider === 'openai') {
      conversation = await this.scrapeChatGPTConversation(view)
    } else {
      console.error(`[PageScraper] Unsupported provider: ${provider}`)
      return false
    }

    if (!conversation) {
      console.error('[PageScraper] Failed to scrape conversation')
      return false
    }

    // Save to database
    const captureId = randomUUID()

    // Prepare tags based on type
    const tags = ['manual-capture']
    if (conversation.isDeepResearch) {
      tags.push('deep_research')
      tags.push('research')
    }

    // Prepare metadata for deep research
    let metadataJson: string | undefined = undefined
    let notes = `Manually captured from ${conversation.url}`

    if (conversation.isDeepResearch) {
      const researchMetadata: any = {
        type: 'deep_research',
        capturedAt: new Date().toISOString(),
        captureMethod: 'dom-scraping',
        url: conversation.url,
        responseLength: conversation.response.length
      }

      if (conversation.sources && conversation.sources.length > 0) {
        researchMetadata.sources = conversation.sources
        researchMetadata.sourceCount = conversation.sources.length
      }

      if (conversation.artifactUrl) {
        researchMetadata.artifactUrl = conversation.artifactUrl
        researchMetadata.hasArtifact = true
      }

      metadataJson = JSON.stringify(researchMetadata, null, 2)

      // Update notes with human-readable summary
      const artifactNote = conversation.artifactUrl ? '\nArtifact available for download' : ''
      notes = `Deep Research captured from ${conversation.url}\n\nSources: ${conversation.sources?.length || 0}\nResponse length: ${conversation.response.length} characters${artifactNote}`
    }

    // Always use the response field (which contains the full assistant message)
    const responseText = conversation.response

    // Determine message type
    const messageType = conversation.isDeepResearch ? 'deep_research' : 'chat'

    db.createCapture({
      id: captureId,
      session_id: sessionId,
      provider: conversation.provider,
      prompt: conversation.prompt,
      response: responseText,
      response_format: conversation.isDeepResearch ? 'deep-research' : 'scraped',
      model: undefined,
      token_count: this.estimateTokens(conversation.prompt + responseText),
      tags: JSON.stringify(tags),
      notes: notes,
      message_type: messageType,
      metadata_json: metadataJson
    })

    console.log(`[PageScraper] Successfully captured conversation: ${captureId}`)
    console.log(`[PageScraper] Type: ${conversation.isDeepResearch ? 'Deep Research' : 'Standard'}`)
    console.log(`[PageScraper] Prompt length: ${conversation.prompt.length}, Response length: ${responseText.length}`)

    if (conversation.isDeepResearch) {
      console.log(`[PageScraper] Deep Research - Response: ${responseText.length} chars, Sources: ${conversation.sources?.length || 0}`)
    }

    return true
  }

  /**
   * Estimate token count (rough approximation)
   */
  private static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }
}
