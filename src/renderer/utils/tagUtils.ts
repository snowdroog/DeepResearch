/**
 * Tag Utilities Module
 * Provides automatic tag type detection and management for the application
 */

// Tag type definition
export type TagType = 'provider' | 'topic' | 'message_type' | 'custom'

export interface EnhancedTag {
  text: string
  type: TagType
}

// Known providers for detection
const KNOWN_PROVIDERS = [
  'claude',
  'openai',
  'gemini',
  'perplexity',
  'gpt',
  'anthropic'
]

// Known message types for detection
const KNOWN_MESSAGE_TYPES = [
  'chat',
  'deep_research',
  'deep research',
  'image',
  'code',
  'research'
]

/**
 * Detect tag type based on content and context
 * @param tag - The tag text to analyze
 * @param provider - Optional provider context
 * @param messageType - Optional message type context
 * @param topic - Optional topic context
 * @returns The detected tag type
 */
export function detectTagType(
  tag: string,
  provider?: string,
  messageType?: string,
  topic?: string
): TagType {
  const normalizedTag = tag.toLowerCase().trim()

  // Check if tag matches the provider
  if (provider && normalizedTag === provider.toLowerCase()) {
    return 'provider'
  }

  // Check if tag matches any known provider
  if (KNOWN_PROVIDERS.includes(normalizedTag)) {
    return 'provider'
  }

  // Check if tag matches the message type
  if (messageType && normalizedTag === messageType.toLowerCase()) {
    return 'message_type'
  }

  // Check if tag matches any known message type
  if (KNOWN_MESSAGE_TYPES.includes(normalizedTag)) {
    return 'message_type'
  }

  // Check if tag matches the topic
  if (topic && normalizedTag === topic.toLowerCase()) {
    return 'topic'
  }

  // Default to custom tag
  return 'custom'
}

/**
 * Parse tags from JSON string and enhance with types
 * @param tagsJson - JSON string containing array of tags
 * @param provider - Optional provider context
 * @param messageType - Optional message type context
 * @param topic - Optional topic context
 * @returns Array of enhanced tags with type information
 */
export function parseAndEnhanceTags(
  tagsJson: string | null,
  provider?: string,
  messageType?: string,
  topic?: string
): EnhancedTag[] {
  if (!tagsJson) {
    return []
  }

  try {
    const tags: string[] = JSON.parse(tagsJson)

    if (!Array.isArray(tags)) {
      console.warn('Tags JSON is not an array:', tagsJson)
      return []
    }

    return tags.map(tag => ({
      text: tag,
      type: detectTagType(tag, provider, messageType, topic)
    }))
  } catch (error) {
    console.error('Error parsing tags JSON:', error)
    return []
  }
}

/**
 * Convert enhanced tags back to plain string array for storage
 * @param tags - Array of enhanced tags
 * @returns Plain string array suitable for JSON storage
 */
export function enhancedTagsToStrings(tags: EnhancedTag[]): string[] {
  return tags.map(tag => tag.text)
}

/**
 * Format tags for autocomplete with automatic type detection
 * @param tags - Array of tag strings from database
 * @returns Array of enhanced tags for autocomplete suggestions
 */
export function formatTagsForAutocomplete(tags: string[]): EnhancedTag[] {
  return tags.map(tag => ({
    text: tag,
    type: detectTagType(tag)
  }))
}

/**
 * Get unique tags from an array of enhanced tags
 * @param tags - Array of enhanced tags
 * @returns Array of unique enhanced tags
 */
export function getUniqueTags(tags: EnhancedTag[]): EnhancedTag[] {
  const seen = new Set<string>()
  return tags.filter(tag => {
    const key = `${tag.text.toLowerCase()}:${tag.type}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

/**
 * Filter tags by type
 * @param tags - Array of enhanced tags
 * @param type - Tag type to filter by
 * @returns Filtered array of enhanced tags
 */
export function filterTagsByType(tags: EnhancedTag[], type: TagType): EnhancedTag[] {
  return tags.filter(tag => tag.type === type)
}

/**
 * Sort tags by type priority (provider > message_type > topic > custom)
 * @param tags - Array of enhanced tags
 * @returns Sorted array of enhanced tags
 */
export function sortTagsByType(tags: EnhancedTag[]): EnhancedTag[] {
  const typePriority: Record<TagType, number> = {
    provider: 0,
    message_type: 1,
    topic: 2,
    custom: 3
  }

  return [...tags].sort((a, b) => {
    const priorityDiff = typePriority[a.type] - typePriority[b.type]
    if (priorityDiff !== 0) {
      return priorityDiff
    }
    // If same type, sort alphabetically
    return a.text.localeCompare(b.text)
  })
}

/**
 * Create a tag with automatic type detection
 * @param text - Tag text
 * @param provider - Optional provider context
 * @param messageType - Optional message type context
 * @param topic - Optional topic context
 * @returns Enhanced tag with detected type
 */
export function createEnhancedTag(
  text: string,
  provider?: string,
  messageType?: string,
  topic?: string
): EnhancedTag {
  return {
    text: text.trim(),
    type: detectTagType(text, provider, messageType, topic)
  }
}

/**
 * Merge and deduplicate tag arrays
 * @param tagArrays - Multiple arrays of enhanced tags
 * @returns Single deduplicated array of enhanced tags
 */
export function mergeTags(...tagArrays: EnhancedTag[][]): EnhancedTag[] {
  const merged = tagArrays.flat()
  return getUniqueTags(merged)
}
