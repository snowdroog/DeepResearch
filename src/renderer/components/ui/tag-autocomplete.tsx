import React, { useState, useRef, useEffect } from 'react'
import { Input } from './input'
import TagBadge from './tag-badge'
import { EnhancedTag } from '@renderer/utils/tagUtils'
import { cn } from '@renderer/lib/utils'

interface TagAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onAddTag: (tag: string) => void
  suggestions: EnhancedTag[]
  placeholder?: string
}

const TagAutocomplete: React.FC<TagAutocompleteProps> = ({
  value,
  onChange,
  onAddTag,
  suggestions,
  placeholder = 'Add tag...'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter suggestions based on input (case-insensitive), max 10 results
  const filteredSuggestions = React.useMemo(() => {
    if (!value.trim()) {
      return suggestions.slice(0, 10)
    }

    const searchTerm = value.toLowerCase().trim()
    return suggestions
      .filter(tag => tag.text.toLowerCase().includes(searchTerm))
      .slice(0, 10)
  }, [value, suggestions])

  // Show dropdown when there are filtered suggestions and input is focused
  useEffect(() => {
    setIsOpen(filteredSuggestions.length > 0 && value.length > 0)
    setSelectedIndex(0) // Reset selection when suggestions change
  }, [filteredSuggestions.length, value.length])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && e.key !== 'Enter' && e.key !== 'Escape') {
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        )
        break

      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0))
        break

      case 'Enter':
        e.preventDefault()
        if (isOpen && filteredSuggestions.length > 0) {
          // Add selected suggestion
          handleSelectTag(filteredSuggestions[selectedIndex].text)
        } else if (value.trim()) {
          // Add current input as tag
          handleAddCurrentInput()
        }
        break

      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSelectedIndex(0)
        break

      default:
        break
    }
  }

  // Handle selecting a tag from suggestions
  const handleSelectTag = (tagText: string) => {
    onAddTag(tagText)
    onChange('') // Clear input
    setIsOpen(false)
    setSelectedIndex(0)
    inputRef.current?.focus()
  }

  // Handle adding current input as tag
  const handleAddCurrentInput = () => {
    if (value.trim()) {
      onAddTag(value.trim())
      onChange('')
      setIsOpen(false)
      setSelectedIndex(0)
    }
  }

  // Handle click on suggestion
  const handleSuggestionClick = (tagText: string) => {
    handleSelectTag(tagText)
  }

  // Scroll selected item into view
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [selectedIndex, isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full"
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls="tag-suggestions"
        aria-expanded={isOpen}
        aria-activedescendant={
          isOpen ? `tag-suggestion-${selectedIndex}` : undefined
        }
      />

      {isOpen && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          id="tag-suggestions"
          role="listbox"
          className={cn(
            'absolute z-50 w-full mt-1 max-h-60 overflow-auto',
            'rounded-md border border-input bg-popover shadow-md',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          {filteredSuggestions.map((tag, index) => (
            <div
              key={`${tag.text}-${tag.type}`}
              id={`tag-suggestion-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              className={cn(
                'px-3 py-2 cursor-pointer transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus:bg-accent focus:text-accent-foreground',
                index === selectedIndex && 'bg-accent text-accent-foreground'
              )}
              onClick={() => handleSuggestionClick(tag.text)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <TagBadge
                tag={tag.text}
                type={tag.type}
                className="pointer-events-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TagAutocomplete
