/**
 * Conversation Color Utilities
 * Provides consistent color-coding for conversations across the app
 */

export interface ConversationColors {
  border: string
  bg: string
  line: string
  dot: string
  text: string
}

/**
 * Generate a consistent color for a conversation ID
 * Uses a simple hash to pick from a palette of colors
 */
export function getConversationColor(conversationId: string | null | undefined): ConversationColors {
  // Default color for messages without conversation_id
  if (!conversationId) {
    return {
      border: 'border-l-gray-400',
      bg: 'bg-gray-400/5',
      line: 'bg-gray-400/30',
      dot: 'bg-gray-400 border-gray-500',
      text: 'text-gray-600'
    }
  }

  // Simple hash function
  let hash = 0
  for (let i = 0; i < conversationId.length; i++) {
    hash = conversationId.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Color palette - distinct, accessible colors
  const colors: ConversationColors[] = [
    {
      border: 'border-l-blue-500',
      bg: 'bg-blue-500/5',
      line: 'bg-blue-500/30',
      dot: 'bg-blue-500 border-blue-600',
      text: 'text-blue-600'
    },
    {
      border: 'border-l-purple-500',
      bg: 'bg-purple-500/5',
      line: 'bg-purple-500/30',
      dot: 'bg-purple-500 border-purple-600',
      text: 'text-purple-600'
    },
    {
      border: 'border-l-emerald-500',
      bg: 'bg-emerald-500/5',
      line: 'bg-emerald-500/30',
      dot: 'bg-emerald-500 border-emerald-600',
      text: 'text-emerald-600'
    },
    {
      border: 'border-l-orange-500',
      bg: 'bg-orange-500/5',
      line: 'bg-orange-500/30',
      dot: 'bg-orange-500 border-orange-600',
      text: 'text-orange-600'
    },
    {
      border: 'border-l-pink-500',
      bg: 'bg-pink-500/5',
      line: 'bg-pink-500/30',
      dot: 'bg-pink-500 border-pink-600',
      text: 'text-pink-600'
    },
    {
      border: 'border-l-cyan-500',
      bg: 'bg-cyan-500/5',
      line: 'bg-cyan-500/30',
      dot: 'bg-cyan-500 border-cyan-600',
      text: 'text-cyan-600'
    },
    {
      border: 'border-l-amber-500',
      bg: 'bg-amber-500/5',
      line: 'bg-amber-500/30',
      dot: 'bg-amber-500 border-amber-600',
      text: 'text-amber-600'
    },
    {
      border: 'border-l-teal-500',
      bg: 'bg-teal-500/5',
      line: 'bg-teal-500/30',
      dot: 'bg-teal-500 border-teal-600',
      text: 'text-teal-600'
    },
  ]

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

/**
 * Get a short display ID for a conversation
 */
export function getConversationDisplayId(conversationId: string | null | undefined): string {
  if (!conversationId) return 'N/A'
  return conversationId.substring(0, 8)
}
