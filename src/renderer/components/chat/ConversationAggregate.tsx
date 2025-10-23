/**
 * ConversationAggregate Component
 * Shows a combined/aggregate view of all messages in a conversation thread
 * This is the "+1" in the "n+1" approach - one aggregate card for the whole conversation
 */

import { useMemo } from 'react'
import { MessageSquare, User, Bot, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { getConversationColor, getConversationDisplayId } from '../../utils/conversationColors'
import type { ChatMessageData } from './ChatMessage'

export interface ConversationAggregateProps {
  conversationId: string
  messages: ChatMessageData[]
  className?: string
  onExpand?: (conversationId: string) => void
}

export function ConversationAggregate({
  conversationId,
  messages,
  className,
  onExpand,
}: ConversationAggregateProps) {
  // Get conversation colors
  const colors = useMemo(() => getConversationColor(conversationId), [conversationId])

  // Sort messages chronologically
  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.timestamp - b.timestamp),
    [messages]
  )

  // Get conversation metadata
  const firstMessage = sortedMessages[0]
  const lastMessage = sortedMessages[sortedMessages.length - 1]
  const messageCount = sortedMessages.length
  const provider = firstMessage?.provider || 'unknown'

  // Calculate time span
  const timeSpan = useMemo(() => {
    if (!firstMessage || !lastMessage) return 'N/A'
    const firstDate = new Date(firstMessage.timestamp * 1000)
    const lastDate = new Date(lastMessage.timestamp * 1000)
    const diffMs = lastDate.getTime() - firstDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hr`
    return `${Math.floor(diffMins / 1440)} days`
  }, [firstMessage, lastMessage])

  // Aggregate all responses into one text
  const aggregatedContent = useMemo(() => {
    return sortedMessages
      .map((msg, idx) => {
        const turn = idx + 1
        return `[Turn ${turn}]\nQ: ${msg.prompt}\nA: ${msg.response.substring(0, 200)}...`
      })
      .join('\n\n')
  }, [sortedMessages])

  // Get total token count
  const totalTokens = useMemo(() => {
    return sortedMessages.reduce((sum, msg) => {
      // Assuming the token_count is estimated in captures
      return sum + (msg.timestamp || 0) // This should be token_count if available
    }, 0)
  }, [sortedMessages])

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden border-l-4 cursor-pointer hover:shadow-md transition-all',
        colors.border,
        colors.bg,
        className
      )}
      onClick={() => onExpand?.(conversationId)}
    >
      {/* Header */}
      <div className="bg-muted/30 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', colors.dot)}>
              <MessageSquare className="h-5 w-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">
                  Conversation Thread
                </span>
                <Badge variant="secondary" className="text-xs">
                  {provider}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {messageCount} {messageCount === 1 ? 'turn' : 'turns'}
                </Badge>
                <Badge variant="outline" className={cn("text-xs font-mono", colors.text)}>
                  {getConversationDisplayId(conversationId)}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Duration: {timeSpan}</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onExpand?.(conversationId)
            }}
          >
            Expand
          </Button>
        </div>
      </div>

      {/* Content Preview */}
      <div className="px-4 py-3 space-y-3">
        {/* First Exchange Preview */}
        {firstMessage && (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground line-clamp-1">
                {firstMessage.prompt}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Bot className="h-4 w-4 mt-0.5 text-secondary-foreground flex-shrink-0" />
              <p className="text-sm line-clamp-2">
                {firstMessage.response.substring(0, 150)}...
              </p>
            </div>
          </div>
        )}

        {/* Show indicator if there are more messages */}
        {messageCount > 1 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground italic">
              + {messageCount - 1} more {messageCount - 1 === 1 ? 'exchange' : 'exchanges'}
            </p>
          </div>
        )}
      </div>

      {/* Footer - Tags and Stats */}
      {firstMessage?.tags && (
        <div className="px-4 py-2 bg-muted/20 border-t border-border/50">
          <div className="flex items-center gap-2 flex-wrap">
            {JSON.parse(firstMessage.tags || '[]').slice(0, 3).map((tag: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

ConversationAggregate.displayName = 'ConversationAggregate'

export default ConversationAggregate
