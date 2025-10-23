/**
 * ConversationThread Component
 * Displays a grouped conversation thread with visual connectors
 */

import { useState, useMemo } from 'react'
import { ChatMessage, type ChatMessageData } from './ChatMessage'
import { ChevronDown, ChevronRight, MessageSquare } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { getConversationColor, getConversationDisplayId } from '../../utils/conversationColors'

export interface ConversationThreadProps {
  conversationId: string
  messages: ChatMessageData[]
  defaultExpanded?: boolean
  className?: string
  onCopy?: (captureId: string, content: string) => void
  onEdit?: (captureId: string) => void
  onViewDetails?: (captureId: string) => void
}

export function ConversationThread({
  conversationId,
  messages,
  defaultExpanded = false,
  className,
  onCopy,
  onEdit,
  onViewDetails,
}: ConversationThreadProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Sort messages by timestamp
  const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp)

  // Get conversation metadata
  const firstMessage = sortedMessages[0]
  const lastMessage = sortedMessages[sortedMessages.length - 1]
  const messageCount = sortedMessages.length
  const provider = firstMessage?.provider || 'unknown'

  // Get consistent colors for this conversation
  const colors = useMemo(() => getConversationColor(conversationId), [conversationId])

  // Format time range
  const formatTimeRange = () => {
    if (!firstMessage || !lastMessage) return ''
    const first = new Date(firstMessage.timestamp * 1000)
    const last = new Date(lastMessage.timestamp * 1000)

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }

    if (first.toDateString() === last.toDateString()) {
      return formatDate(first)
    }

    return `${formatDate(first)} - ${formatDate(last)}`
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden border-l-4', colors.border, colors.bg, className)}>
      {/* Thread Header */}
      <div
        className="bg-muted/30 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          <MessageSquare className="h-4 w-4 text-muted-foreground" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                Conversation Thread
              </span>
              <Badge variant="secondary" className="text-xs">
                {provider}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {messageCount} {messageCount === 1 ? 'message' : 'messages'}
              </Badge>
              <Badge variant="outline" className={cn("text-xs font-mono", colors.text)}>
                {getConversationDisplayId(conversationId)}...
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {formatTimeRange()}
            </div>
          </div>
        </div>

        {firstMessage?.prompt && (
          <div className="hidden md:block max-w-md truncate text-sm text-muted-foreground ml-4">
            {firstMessage.prompt.substring(0, 60)}...
          </div>
        )}
      </div>

      {/* Thread Messages */}
      {isExpanded && (
        <div className="relative">
          {/* Vertical connector line - thicker and more prominent */}
          <div className={cn('absolute left-8 top-0 bottom-0 w-1', colors.line)} />

          {sortedMessages.map((message, index) => (
            <div key={message.id} className="relative">
              {/* Horizontal connector line */}
              <div className={cn('absolute left-8 top-1/2 w-6 h-1', colors.line)} />

              {/* Message bubble indicator - larger and colored */}
              <div className={cn('absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2', colors.dot)} />

              <div className="pl-16 pr-4">
                <ChatMessage
                  capture={message}
                  showAvatar={false}
                  showTimestamp={true}
                  showProviderBadge={false}
                  showTags={true}
                  compact={true}
                  onCopy={onCopy}
                  onEdit={onEdit}
                  onViewDetails={onViewDetails}
                />
              </div>

              {/* Separator between messages (except last) */}
              {index < sortedMessages.length - 1 && (
                <div className="ml-16 mr-4 border-b border-border/50" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

ConversationThread.displayName = 'ConversationThread'

export default ConversationThread
