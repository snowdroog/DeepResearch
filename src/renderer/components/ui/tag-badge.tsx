import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

interface TagBadgeProps {
  tag: string
  type: 'provider' | 'topic' | 'message_type' | 'custom'
  onRemove?: () => void
  className?: string
}

const tagTypeStyles = {
  provider: {
    base: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    hover: 'hover:bg-blue-200 dark:hover:bg-blue-800'
  },
  topic: {
    base: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700',
    hover: 'hover:bg-purple-200 dark:hover:bg-purple-800'
  },
  message_type: {
    base: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
    hover: 'hover:bg-green-200 dark:hover:bg-green-800'
  },
  custom: {
    base: 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700',
    hover: 'hover:bg-gray-200 dark:hover:bg-gray-800'
  }
}

const TagBadge: React.FC<TagBadgeProps> = ({ tag, type, onRemove, className }) => {
  const styles = tagTypeStyles[type]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        styles.base,
        onRemove && styles.hover,
        className
      )}
    >
      <span>{tag}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'inline-flex items-center justify-center rounded-full p-0.5 transition-colors',
            'hover:bg-black/10 dark:hover:bg-white/10',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current'
          )}
          aria-label={`Remove ${tag} tag`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}

export default TagBadge
