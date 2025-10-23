/**
 * ChatMessage Component
 * Beautiful Claude-like chat message display with markdown rendering
 */

import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Bot, User, Copy, Check, MoreHorizontal, Microscope } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  markdownComponents,
  defaultRemarkPlugins,
  defaultRehypePlugins,
} from '../../config/markdown.config'
import { getConversationColor, getConversationDisplayId } from '../../utils/conversationColors'

// Types
export interface ChatMessageData {
  id: string
  session_id: string
  provider: string
  prompt: string
  response: string
  timestamp: number
  conversation_id?: string | null
  tags?: string // JSON array
  model?: string
  message_type?: 'chat' | 'deep_research' | 'image' | 'code'
  topic?: string
  notes?: string
}

export interface ChatMessageProps {
  capture: ChatMessageData
  showAvatar?: boolean
  showTimestamp?: boolean
  showProviderBadge?: boolean
  showTags?: boolean
  compact?: boolean
  className?: string
  onCopy?: (captureId: string, content: string) => void
  onEdit?: (captureId: string) => void
  onViewDetails?: (captureId: string) => void
}

// Utility: Format timestamp
function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  // Convert Unix timestamp (seconds) to milliseconds
  const timestampMs = timestamp * 1000
  const diffMs = now - timestampMs
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`

  const date = new Date(timestampMs)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

// Utility: Parse tags
function parseTags(tagsJson?: string): string[] {
  if (!tagsJson) return []
  try {
    return JSON.parse(tagsJson)
  } catch {
    return []
  }
}

// Utility: Get provider color
function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    claude: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    openai: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100',
    gemini: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    custom: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
  }
  return colors[provider] || colors.custom
}

// Component: Copy Button
function CopyButton({
  content,
  onCopy
}: {
  content: string
  onCopy?: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent parent click handlers from firing
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : 'Copy to clipboard'}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  )
}

// Component: Message Actions
function MessageActions({
  captureId,
  content,
  onCopy,
  onEdit,
  onViewDetails,
}: {
  captureId: string
  content: string
  onCopy?: (captureId: string, content: string) => void
  onEdit?: (captureId: string) => void
  onViewDetails?: (captureId: string) => void
}) {
  return (
    <div
      role="group"
      aria-label="Message actions"
      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 sm:opacity-100"
    >
      <CopyButton
        content={content}
        onCopy={() => onCopy?.(captureId, content)}
      />

      {(onEdit || onViewDetails) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="More actions"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onEdit(captureId)
              }}>
                Edit prompt
              </DropdownMenuItem>
            )}
            {onViewDetails && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onViewDetails(captureId)
              }}>
                View details
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

// Main Component
export function ChatMessage({
  capture,
  showAvatar = true,
  showTimestamp = true,
  showProviderBadge = true,
  showTags = true,
  compact = false,
  className,
  onCopy,
  onEdit,
  onViewDetails,
}: ChatMessageProps) {
  const tags = parseTags(capture.tags)
  const colors = useMemo(() => getConversationColor(capture.conversation_id), [capture.conversation_id])

  return (
    <div className={cn('w-full border-l-4', colors.border, colors.bg, className)}>
      {/* User Prompt */}
      {capture.prompt && (
        <article
          id={`message-prompt-${capture.id}`}
          role="article"
          aria-label="User prompt"
          className={cn(
            'w-full group',
            compact ? 'py-4' : 'py-6',
            'bg-muted/50'
          )}
        >
          <div className={cn(
            'max-w-3xl mx-auto',
            compact ? 'px-4' : 'px-6'
          )}>
            {/* Header */}
            <header className="flex items-center gap-3 mb-3">
              {showAvatar && (
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-medium text-sm">You</span>
              </div>

              <MessageActions
                captureId={capture.id}
                content={capture.prompt}
                onCopy={onCopy}
                onEdit={onEdit}
                onViewDetails={onViewDetails}
              />
            </header>

            {/* Body */}
            <div className="text-foreground">
              <p className="whitespace-pre-wrap leading-7">{capture.prompt}</p>
            </div>
          </div>
        </article>
      )}

      {/* Assistant Response */}
      <article
        id={`message-response-${capture.id}`}
        role="article"
        aria-label="Assistant response"
        className={cn(
          'w-full group',
          compact ? 'py-4' : 'py-6',
          'bg-background'
        )}
      >
        <div className={cn(
          'max-w-3xl mx-auto',
          compact ? 'px-4' : 'px-6'
        )}>
          {/* Header */}
          <header className="flex items-center gap-3 mb-3">
            {showAvatar && (
              <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
              <span className="font-medium text-sm">Assistant</span>

              {showProviderBadge && (
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  getProviderColor(capture.provider)
                )}>
                  {capture.provider}
                </span>
              )}

              {capture.model && (
                <Badge variant="outline" className="text-xs">
                  {capture.model}
                </Badge>
              )}

              {capture.message_type && capture.message_type !== 'chat' && (
                <Badge variant="secondary" className="text-xs capitalize gap-1">
                  {capture.message_type === 'deep_research' && (
                    <Microscope className="h-3 w-3" />
                  )}
                  {capture.message_type.replace('_', ' ')}
                </Badge>
              )}

              {capture.conversation_id && (
                <Badge variant="outline" className={cn("text-xs font-mono", colors.text)}>
                  {getConversationDisplayId(capture.conversation_id)}
                </Badge>
              )}
            </div>

            <MessageActions
              captureId={capture.id}
              content={capture.response}
              onCopy={onCopy}
              onViewDetails={onViewDetails}
            />
          </header>

          {/* Body - Markdown Rendered */}
          <div className="text-foreground prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={defaultRemarkPlugins}
              rehypePlugins={defaultRehypePlugins}
              components={markdownComponents}
            >
              {capture.response}
            </ReactMarkdown>
          </div>

          {/* Footer with tags and timestamp */}
          {(showTags || showTimestamp) && (
            <footer className="mt-4 flex items-center justify-between gap-4 flex-wrap">
              {showTags && tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {showTimestamp && (
                <time
                  dateTime={new Date(capture.timestamp * 1000).toISOString()}
                  className="text-xs text-muted-foreground ml-auto"
                  title={new Date(capture.timestamp * 1000).toLocaleString()}
                >
                  {formatTimeAgo(capture.timestamp)}
                </time>
              )}
            </footer>
          )}

          {/* Topic badge if present */}
          {capture.topic && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Topic: {capture.topic}
              </Badge>
            </div>
          )}
        </div>
      </article>
    </div>
  )
}

// Export for compound component pattern (future extensibility)
ChatMessage.displayName = 'ChatMessage'

export default ChatMessage
