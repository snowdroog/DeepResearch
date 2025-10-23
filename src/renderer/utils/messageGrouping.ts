/**
 * Message Grouping Utilities for DeepResearch
 *
 * Provides flexible grouping strategies for organizing captured messages
 * into meaningful conversation threads and collections.
 *
 * Supports grouping by:
 * - Session (conversation context)
 * - Topic (content similarity)
 * - Time windows (temporal proximity)
 * - Message type (chat, deep_research, image, code)
 * - Provider (Claude, OpenAI, Gemini, etc.)
 */

import type { Capture } from '../../../src/main/database/db'

// ==================== TYPE DEFINITIONS ====================

/**
 * Represents a group of related messages
 */
export interface MessageGroup {
  /** Unique identifier for the group */
  id: string
  /** Human-readable title for the group */
  title: string
  /** Array of capture IDs in this group */
  captureIds: string[]
  /** First (oldest) capture in the group */
  firstCapture: Capture
  /** Last (newest) capture in the group */
  lastCapture: Capture
  /** Provider for this group (if single provider) */
  provider: string
  /** Number of messages in the group */
  messageCount: number
  /** Timestamp of first message (ms) */
  createdAt: number
  /** Timestamp of last message (ms) */
  lastActiveAt: number
  /** Unique topics across all messages */
  topics: string[]
  /** Unique tags across all messages */
  tags: string[]
  /** UI state: whether group is collapsed */
  isCollapsed?: boolean
}

/**
 * Configuration options for grouping behavior
 */
export interface GroupingOptions {
  /** Grouping strategy to use */
  mode: 'session' | 'topic' | 'timeWindow' | 'messageType' | 'provider'
  /** Time window in milliseconds for timeWindow mode (default: 1 hour) */
  timeWindowMs?: number
  /** Whether groups should start collapsed in UI */
  collapseGroups?: boolean
}

// ==================== CORE GROUPING FUNCTION ====================

/**
 * Main grouping function that routes to specific grouping strategies
 *
 * @param captures Array of captures to group
 * @param options Grouping configuration
 * @returns Array of message groups, sorted by lastActiveAt (descending)
 *
 * @example
 * ```typescript
 * const groups = groupCaptures(captures, { mode: 'session' })
 * const timeGroups = groupCaptures(captures, {
 *   mode: 'timeWindow',
 *   timeWindowMs: 7200000  // 2 hours
 * })
 * ```
 */
export function groupCaptures(
  captures: Capture[],
  options: GroupingOptions
): MessageGroup[] {
  // Handle empty input
  if (!captures || captures.length === 0) {
    return []
  }

  // Sort captures by timestamp (ascending) for chronological processing
  const sortedCaptures = [...captures].sort((a, b) => a.timestamp - b.timestamp)

  // Route to appropriate grouping function
  let groups: MessageGroup[]

  switch (options.mode) {
    case 'session':
      groups = groupBySession(sortedCaptures)
      break
    case 'topic':
      groups = groupByTopic(sortedCaptures)
      break
    case 'timeWindow':
      groups = groupByTimeWindow(
        sortedCaptures,
        options.timeWindowMs ?? 3600000  // Default: 1 hour
      )
      break
    case 'messageType':
      groups = groupByMessageType(sortedCaptures)
      break
    case 'provider':
      groups = groupByProvider(sortedCaptures)
      break
    default:
      // Fallback to session grouping
      groups = groupBySession(sortedCaptures)
  }

  // Apply collapse state if requested
  if (options.collapseGroups) {
    groups = groups.map(group => ({ ...group, isCollapsed: true }))
  }

  // Sort groups by last activity (most recent first)
  return groups.sort((a, b) => b.lastActiveAt - a.lastActiveAt)
}

// ==================== SPECIFIC GROUPING STRATEGIES ====================

/**
 * Group captures by session_id
 *
 * Creates one group per unique session, maintaining conversation context.
 * This is the most common grouping mode for chat interfaces.
 *
 * @param captures Sorted array of captures
 * @returns Array of session-based groups
 */
export function groupBySession(captures: Capture[]): MessageGroup[] {
  const sessionMap = new Map<string, Capture[]>()

  // Group by session_id
  for (const capture of captures) {
    const sessionId = capture.session_id
    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, [])
    }
    sessionMap.get(sessionId)!.push(capture)
  }

  // Convert to MessageGroup array
  const groups: MessageGroup[] = []

  for (const [sessionId, sessionCaptures] of sessionMap) {
    const firstCapture = sessionCaptures[0]
    const lastCapture = sessionCaptures[sessionCaptures.length - 1]

    const group: MessageGroup = {
      id: `session-${sessionId}`,
      title: generateSessionTitle(sessionCaptures),
      captureIds: sessionCaptures.map(c => c.id),
      firstCapture,
      lastCapture,
      provider: firstCapture.provider,
      messageCount: sessionCaptures.length,
      createdAt: firstCapture.timestamp,
      lastActiveAt: lastCapture.timestamp,
      topics: mergeGroupTopics(sessionCaptures),
      tags: mergeGroupTags(sessionCaptures),
    }

    groups.push(group)
  }

  return groups
}

/**
 * Group captures by topic field
 *
 * Creates one group per unique topic. Captures without topics
 * are placed in an "Uncategorized" group.
 *
 * @param captures Sorted array of captures
 * @returns Array of topic-based groups
 */
export function groupByTopic(captures: Capture[]): MessageGroup[] {
  const topicMap = new Map<string, Capture[]>()

  // Group by topic (or 'uncategorized')
  for (const capture of captures) {
    const topic = capture.topic || 'uncategorized'
    if (!topicMap.has(topic)) {
      topicMap.set(topic, [])
    }
    topicMap.get(topic)!.push(capture)
  }

  // Convert to MessageGroup array
  const groups: MessageGroup[] = []

  for (const [topic, topicCaptures] of topicMap) {
    const firstCapture = topicCaptures[0]
    const lastCapture = topicCaptures[topicCaptures.length - 1]

    // Determine if group has mixed providers
    const providers = new Set(topicCaptures.map(c => c.provider))
    const providerLabel = providers.size === 1
      ? firstCapture.provider
      : `${providers.size} providers`

    const group: MessageGroup = {
      id: `topic-${topic}`,
      title: topic === 'uncategorized'
        ? `Uncategorized • ${topicCaptures.length} messages`
        : `${topic} • ${topicCaptures.length} messages`,
      captureIds: topicCaptures.map(c => c.id),
      firstCapture,
      lastCapture,
      provider: providerLabel,
      messageCount: topicCaptures.length,
      createdAt: firstCapture.timestamp,
      lastActiveAt: lastCapture.timestamp,
      topics: [topic],
      tags: mergeGroupTags(topicCaptures),
    }

    groups.push(group)
  }

  return groups
}

/**
 * Group captures by time windows
 *
 * Creates groups of messages that occurred within a specified time window.
 * Useful for organizing messages by day, hour, or custom time periods.
 *
 * @param captures Sorted array of captures
 * @param windowMs Time window in milliseconds
 * @returns Array of time-based groups
 *
 * @example
 * ```typescript
 * // Group by hour
 * groupByTimeWindow(captures, 3600000)
 *
 * // Group by day
 * groupByTimeWindow(captures, 86400000)
 * ```
 */
export function groupByTimeWindow(
  captures: Capture[],
  windowMs: number
): MessageGroup[] {
  if (captures.length === 0) return []

  const groups: MessageGroup[] = []
  let currentGroup: Capture[] = [captures[0]]
  let windowStart = captures[0].timestamp

  // Iterate through sorted captures
  for (let i = 1; i < captures.length; i++) {
    const capture = captures[i]
    const timeSinceWindowStart = capture.timestamp - windowStart

    // If within window, add to current group
    if (timeSinceWindowStart <= windowMs) {
      currentGroup.push(capture)
    } else {
      // Close current group and start new one
      groups.push(createGroupFromCaptures(currentGroup, 'time'))
      currentGroup = [capture]
      windowStart = capture.timestamp
    }
  }

  // Add final group
  if (currentGroup.length > 0) {
    groups.push(createGroupFromCaptures(currentGroup, 'time'))
  }

  return groups
}

/**
 * Group captures by message_type
 *
 * Creates groups for each message type: chat, deep_research, image, code.
 * Useful for filtering and organizing by interaction type.
 *
 * @param captures Sorted array of captures
 * @returns Array of message-type groups
 */
export function groupByMessageType(captures: Capture[]): MessageGroup[] {
  const typeMap = new Map<string, Capture[]>()

  // Group by message_type
  for (const capture of captures) {
    const messageType = capture.message_type || 'chat'
    if (!typeMap.has(messageType)) {
      typeMap.set(messageType, [])
    }
    typeMap.get(messageType)!.push(capture)
  }

  // Convert to MessageGroup array
  const groups: MessageGroup[] = []

  for (const [messageType, typeCaptures] of typeMap) {
    const firstCapture = typeCaptures[0]
    const lastCapture = typeCaptures[typeCaptures.length - 1]

    // Determine if group has mixed providers
    const providers = new Set(typeCaptures.map(c => c.provider))
    const providerLabel = providers.size === 1
      ? firstCapture.provider
      : `${providers.size} providers`

    const group: MessageGroup = {
      id: `type-${messageType}`,
      title: formatMessageTypeTitle(messageType, typeCaptures.length),
      captureIds: typeCaptures.map(c => c.id),
      firstCapture,
      lastCapture,
      provider: providerLabel,
      messageCount: typeCaptures.length,
      createdAt: firstCapture.timestamp,
      lastActiveAt: lastCapture.timestamp,
      topics: mergeGroupTopics(typeCaptures),
      tags: mergeGroupTags(typeCaptures),
    }

    groups.push(group)
  }

  return groups
}

/**
 * Group captures by provider
 *
 * Creates one group per provider (Claude, OpenAI, Gemini, etc.).
 * Useful for comparing interactions across different AI models.
 *
 * @param captures Sorted array of captures
 * @returns Array of provider-based groups
 */
export function groupByProvider(captures: Capture[]): MessageGroup[] {
  const providerMap = new Map<string, Capture[]>()

  // Group by provider
  for (const capture of captures) {
    const provider = capture.provider
    if (!providerMap.has(provider)) {
      providerMap.set(provider, [])
    }
    providerMap.get(provider)!.push(capture)
  }

  // Convert to MessageGroup array
  const groups: MessageGroup[] = []

  for (const [provider, providerCaptures] of providerMap) {
    const firstCapture = providerCaptures[0]
    const lastCapture = providerCaptures[providerCaptures.length - 1]

    const group: MessageGroup = {
      id: `provider-${provider}`,
      title: `${provider} • ${providerCaptures.length} messages`,
      captureIds: providerCaptures.map(c => c.id),
      firstCapture,
      lastCapture,
      provider,
      messageCount: providerCaptures.length,
      createdAt: firstCapture.timestamp,
      lastActiveAt: lastCapture.timestamp,
      topics: mergeGroupTopics(providerCaptures),
      tags: mergeGroupTags(providerCaptures),
    }

    groups.push(group)
  }

  return groups
}

// ==================== CONVERSATION THREAD DETECTION ====================

/**
 * Intelligently detect conversation threads using multiple heuristics
 *
 * This function uses a combination of:
 * - Timestamp proximity (messages within maxGapMs)
 * - Session continuity (same session_id)
 * - Topic similarity (same or related topics)
 * - Message type consistency
 *
 * This is more sophisticated than simple time-based grouping and attempts
 * to identify natural conversation boundaries.
 *
 * @param captures Array of captures to analyze
 * @param maxGapMs Maximum time gap between messages in same thread (default: 1 hour)
 * @returns Array of detected conversation threads
 *
 * @example
 * ```typescript
 * // Detect threads with 30-minute gap tolerance
 * const threads = detectConversationThreads(captures, 1800000)
 * ```
 */
export function detectConversationThreads(
  captures: Capture[],
  maxGapMs: number = 3600000  // 1 hour default
): MessageGroup[] {
  if (captures.length === 0) return []

  // Sort by timestamp
  const sorted = [...captures].sort((a, b) => a.timestamp - b.timestamp)

  const threads: MessageGroup[] = []
  let currentThread: Capture[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const previous = sorted[i - 1]

    // Calculate thread continuity score
    const timeDelta = current.timestamp - previous.timestamp
    const sameSession = current.session_id === previous.session_id
    const sameTopic = current.topic && current.topic === previous.topic
    const sameMessageType = current.message_type === previous.message_type

    // Decide if current message continues the thread
    const continuesThread =
      timeDelta <= maxGapMs &&  // Within time window
      sameSession &&             // Same session
      (sameTopic || !current.topic || !previous.topic) &&  // Topic compatible
      sameMessageType            // Same interaction type

    if (continuesThread) {
      currentThread.push(current)
    } else {
      // Close current thread and start new one
      threads.push(createGroupFromCaptures(currentThread, 'thread'))
      currentThread = [current]
    }
  }

  // Add final thread
  if (currentThread.length > 0) {
    threads.push(createGroupFromCaptures(currentThread, 'thread'))
  }

  return threads
}

// ==================== HELPER UTILITIES ====================

/**
 * Create a MessageGroup from a set of captures
 *
 * @param captures Array of captures in the group
 * @param groupType Type identifier for the group
 * @returns Formatted MessageGroup object
 */
function createGroupFromCaptures(
  captures: Capture[],
  groupType: string
): MessageGroup {
  const firstCapture = captures[0]
  const lastCapture = captures[captures.length - 1]

  // Determine provider label
  const providers = new Set(captures.map(c => c.provider))
  const providerLabel = providers.size === 1
    ? firstCapture.provider
    : `${providers.size} providers`

  return {
    id: `${groupType}-${firstCapture.id}`,
    title: generateGroupTitleFromCaptures(captures),
    captureIds: captures.map(c => c.id),
    firstCapture,
    lastCapture,
    provider: providerLabel,
    messageCount: captures.length,
    createdAt: firstCapture.timestamp,
    lastActiveAt: lastCapture.timestamp,
    topics: mergeGroupTopics(captures),
    tags: mergeGroupTags(captures),
  }
}

/**
 * Generate a human-readable title for a message group
 *
 * Creates titles like:
 * - "Claude conversation • 5 messages • 2h ago"
 * - "Deep Research • 3 messages • Today"
 * - "OpenAI chat • 12 messages • Yesterday"
 *
 * @param captures Array of captures in the group (used for context)
 * @returns Formatted group title string
 */
function generateGroupTitleFromCaptures(captures: Capture[]): string {
  const messageCount = captures.length
  const lastCapture = captures[captures.length - 1]
  const provider = captures[0].provider
  const messageType = captures[0].message_type || 'chat'

  // Format relative time
  const timeAgo = formatRelativeTime(lastCapture.timestamp)

  // Determine conversation type label
  let typeLabel = 'conversation'
  if (captures.every(c => c.message_type === messageType)) {
    switch (messageType) {
      case 'deep_research':
        typeLabel = 'research'
        break
      case 'image':
        typeLabel = 'image chat'
        break
      case 'code':
        typeLabel = 'code chat'
        break
      default:
        typeLabel = 'chat'
    }
  }

  return `${provider} ${typeLabel} • ${messageCount} message${messageCount !== 1 ? 's' : ''} • ${timeAgo}`
}

/**
 * Generate a title specifically for session groups
 *
 * @param captures Array of captures in the session
 * @returns Formatted session title
 */
function generateSessionTitle(captures: Capture[]): string {
  const firstCapture = captures[0]
  const topic = firstCapture.topic

  if (topic) {
    return `${topic} • ${captures.length} message${captures.length !== 1 ? 's' : ''}`
  }

  // Fallback to extracting first few words from prompt
  const promptPreview = firstCapture.prompt
    .slice(0, 50)
    .trim()
    .replace(/\s+/g, ' ')

  return `${promptPreview}${firstCapture.prompt.length > 50 ? '...' : ''}`
}

/**
 * Format message type into readable title
 *
 * @param messageType The message type enum value
 * @param count Number of messages
 * @returns Formatted title string
 */
function formatMessageTypeTitle(messageType: string, count: number): string {
  const typeLabels: Record<string, string> = {
    'chat': 'Chat Messages',
    'deep_research': 'Deep Research',
    'image': 'Image Conversations',
    'code': 'Code Discussions',
  }

  const label = typeLabels[messageType] || 'Messages'
  return `${label} • ${count} message${count !== 1 ? 's' : ''}`
}

/**
 * Extract and merge unique tags from all captures in a group
 *
 * Parses the JSON tags field from each capture and deduplicates.
 *
 * @param captures Array of captures to extract tags from
 * @returns Sorted array of unique tags
 */
export function mergeGroupTags(captures: Capture[]): string[] {
  const tagSet = new Set<string>()

  for (const capture of captures) {
    if (!capture.tags) continue

    try {
      const tags = JSON.parse(capture.tags)
      if (Array.isArray(tags)) {
        tags.forEach(tag => {
          if (typeof tag === 'string' && tag.trim()) {
            tagSet.add(tag.trim())
          }
        })
      }
    } catch (error) {
      // Skip invalid JSON, silently continue
      console.warn('[messageGrouping] Failed to parse tags:', capture.tags)
    }
  }

  return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
}

/**
 * Extract and merge unique topics from all captures in a group
 *
 * @param captures Array of captures to extract topics from
 * @returns Sorted array of unique topics (excluding null/undefined)
 */
export function mergeGroupTopics(captures: Capture[]): string[] {
  const topicSet = new Set<string>()

  for (const capture of captures) {
    if (capture.topic && capture.topic.trim()) {
      topicSet.add(capture.topic.trim())
    }
  }

  return Array.from(topicSet).sort((a, b) => a.localeCompare(b))
}

/**
 * Format timestamp as relative time string
 *
 * @param timestamp Unix timestamp in milliseconds
 * @returns Human-readable relative time (e.g., "2h ago", "Yesterday", "3 days ago")
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const deltaMs = now - timestamp

  // Less than 1 minute
  if (deltaMs < 60000) {
    return 'Just now'
  }

  // Less than 1 hour
  if (deltaMs < 3600000) {
    const minutes = Math.floor(deltaMs / 60000)
    return `${minutes}m ago`
  }

  // Less than 24 hours
  if (deltaMs < 86400000) {
    const hours = Math.floor(deltaMs / 3600000)
    return `${hours}h ago`
  }

  // Less than 48 hours
  if (deltaMs < 172800000) {
    return 'Yesterday'
  }

  // Less than 7 days
  if (deltaMs < 604800000) {
    const days = Math.floor(deltaMs / 86400000)
    return `${days} days ago`
  }

  // Less than 30 days
  if (deltaMs < 2592000000) {
    const weeks = Math.floor(deltaMs / 604800000)
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  }

  // Format as date
  return new Date(timestamp).toLocaleDateString()
}

// ==================== EXPORTED PUBLIC API ====================

/**
 * Generate a human-readable title for an existing MessageGroup
 *
 * This is exported for use by UI components that need to regenerate
 * titles based on group state changes.
 *
 * @param group The MessageGroup to generate title for
 * @returns Formatted title string
 */
export function generateGroupTitle(group: MessageGroup): string {
  const timeAgo = formatRelativeTime(group.lastActiveAt)
  return `${group.provider} • ${group.messageCount} message${group.messageCount !== 1 ? 's' : ''} • ${timeAgo}`
}
