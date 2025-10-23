/**
 * ConversationGroupView Component
 * Groups and displays captures by conversation thread
 */

import { useMemo, useState } from 'react'
import { ConversationThread } from './ConversationThread'
import { ConversationAggregate } from './ConversationAggregate'
import { ChatMessage, type ChatMessageData } from './ChatMessage'
import { Button } from '../ui/button'
import { List, GitBranch, MessageSquare, Layers } from 'lucide-react'
import { cn } from '../../lib/utils'
import { getConversationColor } from '../../utils/conversationColors'

export interface ConversationGroupViewProps {
  captures: ChatMessageData[]
  defaultViewMode?: 'threaded' | 'flat' | 'aggregate'
  className?: string
  onCopy?: (captureId: string, content: string) => void
  onEdit?: (captureId: string) => void
  onViewDetails?: (captureId: string) => void
}

export function ConversationGroupView({
  captures,
  defaultViewMode = 'threaded',
  className,
  onCopy,
  onEdit,
  onViewDetails,
}: ConversationGroupViewProps) {
  const [viewMode, setViewMode] = useState<'threaded' | 'flat' | 'aggregate'>(defaultViewMode)
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set())

  // Group captures by conversation_id
  const { threads, standalone } = useMemo(() => {
    const threadsMap = new Map<string, ChatMessageData[]>()
    const standaloneMessages: ChatMessageData[] = []

    for (const capture of captures) {
      if (capture.conversation_id) {
        const existing = threadsMap.get(capture.conversation_id) || []
        existing.push(capture)
        threadsMap.set(capture.conversation_id, existing)
      } else {
        standaloneMessages.push(capture)
      }
    }

    // Convert map to array and sort by most recent message in each thread
    const threadsList = Array.from(threadsMap.entries()).map(([id, messages]) => ({
      conversationId: id,
      messages: messages.sort((a, b) => a.timestamp - b.timestamp), // Sort messages within thread chronologically
      lastTimestamp: Math.max(...messages.map(m => m.timestamp))
    })).sort((a, b) => b.lastTimestamp - a.lastTimestamp) // Sort threads by most recent

    return {
      threads: threadsList,
      standalone: standaloneMessages.sort((a, b) => b.timestamp - a.timestamp)
    }
  }, [captures])

  const totalThreads = threads.length
  const totalMessages = threads.reduce((sum, t) => sum + t.messages.length, 0) + standalone.length

  return (
    <div className={cn('space-y-4', className)}>
      {/* View Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {viewMode === 'aggregate' || viewMode === 'threaded' ? (
            <>
              {totalThreads} {totalThreads === 1 ? 'conversation' : 'conversations'} •{' '}
              {totalMessages} {totalMessages === 1 ? 'message' : 'messages'}
              {standalone.length > 0 && ` (${standalone.length} standalone)`}
            </>
          ) : (
            <>
              {totalMessages} {totalMessages === 1 ? 'message' : 'messages'}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'aggregate' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('aggregate')}
            className="gap-2"
          >
            <Layers className="h-4 w-4" />
            Aggregate
          </Button>
          <Button
            variant={viewMode === 'threaded' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('threaded')}
            className="gap-2"
          >
            <GitBranch className="h-4 w-4" />
            Threaded
          </Button>
          <Button
            variant={viewMode === 'flat' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('flat')}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            Flat
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'aggregate' ? (
        <div className="space-y-4">
          {/* Aggregate Cards - Show n aggregate cards */}
          {threads.map(({ conversationId, messages }) => (
            <div key={conversationId} className="space-y-2">
              <ConversationAggregate
                conversationId={conversationId}
                messages={messages}
                onExpand={(id) => {
                  setExpandedThreads(prev => {
                    const newSet = new Set(prev)
                    if (newSet.has(id)) {
                      newSet.delete(id)
                    } else {
                      newSet.add(id)
                    }
                    return newSet
                  })
                }}
              />

              {/* Show full thread when expanded */}
              {expandedThreads.has(conversationId) && (
                <ConversationThread
                  conversationId={conversationId}
                  messages={messages}
                  defaultExpanded={true}
                  onCopy={onCopy}
                  onEdit={onEdit}
                  onViewDetails={onViewDetails}
                />
              )}
            </div>
          ))}

          {/* Standalone Messages */}
          {standalone.length > 0 && (
            <div className="space-y-2">
              {threads.length > 0 && (
                <div className="text-sm font-medium text-muted-foreground px-2">
                  Standalone Messages
                </div>
              )}
              {standalone.map((message) => (
                <div key={message.id} className="border rounded-lg overflow-hidden">
                  <ChatMessage
                    capture={message}
                    showAvatar={true}
                    showTimestamp={true}
                    showProviderBadge={true}
                    showTags={true}
                    compact={false}
                    onCopy={onCopy}
                    onEdit={onEdit}
                    onViewDetails={onViewDetails}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {threads.length === 0 && standalone.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">
                Start a conversation to see aggregate summaries
              </p>
            </div>
          )}
        </div>
      ) : viewMode === 'threaded' ? (
        <div className="space-y-6">
          {/* Conversation Threads */}
          {threads.map(({ conversationId, messages }) => (
            <ConversationThread
              key={conversationId}
              conversationId={conversationId}
              messages={messages}
              defaultExpanded={threads.length === 1} // Auto-expand if only one thread
              onCopy={onCopy}
              onEdit={onEdit}
              onViewDetails={onViewDetails}
            />
          ))}

          {/* Standalone Messages */}
          {standalone.length > 0 && (
            <div className="space-y-2">
              {threads.length > 0 && (
                <div className="text-sm font-medium text-muted-foreground px-2">
                  Standalone Messages
                </div>
              )}
              {standalone.map((message) => (
                <div key={message.id} className="border rounded-lg overflow-hidden">
                  <ChatMessage
                    capture={message}
                    showAvatar={true}
                    showTimestamp={true}
                    showProviderBadge={true}
                    showTags={true}
                    compact={false}
                    onCopy={onCopy}
                    onEdit={onEdit}
                    onViewDetails={onViewDetails}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {threads.length === 0 && standalone.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">
                Start a conversation to see messages grouped by thread
              </p>
            </div>
          )}
        </div>
      ) : (
        // Flat View - All messages in chronological order with conversation indicators
        <div className="space-y-2">
          {[...captures].sort((a, b) => b.timestamp - a.timestamp).map((message, index, sortedMessages) => {
            const colors = getConversationColor(message.conversation_id)

            // Check if previous and next messages have same conversation_id
            const prevMessage = sortedMessages[index - 1]
            const nextMessage = sortedMessages[index + 1]
            const hasPrevInConversation = prevMessage?.conversation_id === message.conversation_id && message.conversation_id
            const hasNextInConversation = nextMessage?.conversation_id === message.conversation_id && message.conversation_id

            return (
              <div key={message.id} className="relative">
                {/* Conversation indicator column */}
                {message.conversation_id && (
                  <div className={cn('absolute left-0 top-0 bottom-0 w-1', colors.line)} />
                )}

                {/* Message card with left padding for indicator */}
                <div className={cn(
                  'border rounded-lg overflow-hidden',
                  message.conversation_id ? 'ml-3' : ''
                )}>
                  <ChatMessage
                    capture={message}
                    showAvatar={true}
                    showTimestamp={true}
                    showProviderBadge={true}
                    showTags={true}
                    compact={false}
                    onCopy={onCopy}
                    onEdit={onEdit}
                    onViewDetails={onViewDetails}
                  />
                </div>
              </div>
            )
          })}

          {/* Empty State */}
          {captures.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No messages yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

ConversationGroupView.displayName = 'ConversationGroupView'

export default ConversationGroupView
