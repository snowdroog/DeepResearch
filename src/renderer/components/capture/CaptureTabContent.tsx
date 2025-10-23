/**
 * CaptureTabContent Component
 * Displays capture details in a tab (not a dialog) with inline editing capabilities
 */

import * as React from 'react'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import {
  Archive,
  ArchiveRestore,
  Copy,
  Trash2,
  Check,
  X,
  AlertCircle,
  Loader2,
  Bot,
  User,
} from 'lucide-react'
import { Button } from '@/renderer/components/ui/button'
import { Textarea } from '@/renderer/components/ui/textarea'
import { Badge } from '@/renderer/components/ui/badge'
import { ScrollArea } from '@/renderer/components/ui/scroll-area'
import TagBadge from '../ui/tag-badge'
import TagAutocomplete from '../ui/tag-autocomplete'
import { toast } from '@/renderer/lib/toast'
import { useCapturesStore } from '@/renderer/stores/capturesStore'
import {
  parseAndEnhanceTags,
  enhancedTagsToStrings,
  formatTagsForAutocomplete,
  type EnhancedTag,
} from '@/renderer/utils/tagUtils'
import {
  markdownComponents,
  defaultRemarkPlugins,
  defaultRehypePlugins,
} from '@/renderer/config/markdown.config'
import { cn } from '@/renderer/lib/utils'

interface CaptureTabContentProps {
  captureId: string
  onClose?: () => void
}

// Utility: Get provider color
function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    claude: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    openai: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100',
    gemini: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    custom: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
  }
  return colors[provider.toLowerCase()] || colors.custom
}

export function CaptureTabContent({ captureId, onClose }: CaptureTabContentProps) {
  // State
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [capture, setCapture] = React.useState<any>(null)
  const [notes, setNotes] = React.useState('')
  const [enhancedTags, setEnhancedTags] = React.useState<EnhancedTag[]>([])
  const [availableTags, setAvailableTags] = React.useState<EnhancedTag[]>([])
  const [newTag, setNewTag] = React.useState('')
  const [isEditingNotes, setIsEditingNotes] = React.useState(false)
  const [isSavingNotes, setIsSavingNotes] = React.useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Get store actions
  const capturesStore = useCapturesStore()

  // Fetch capture data on mount
  React.useEffect(() => {
    fetchCaptureData()
    fetchAvailableTags()
  }, [captureId])

  const fetchCaptureData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Check if capture exists in store
      let captureData = capturesStore.captures.find(c => c.id === captureId)

      // If not in store, fetch from database
      if (!captureData) {
        const result = await window.electronAPI.data.getCaptures()
        if (result.success) {
          captureData = result.captures.find((c: any) => c.id === captureId)
        }
      }

      if (!captureData) {
        setError('Capture not found')
        setLoading(false)
        return
      }

      setCapture(captureData)
      setNotes(captureData.notes || '')

      // Parse and enhance tags
      const parsed = parseAndEnhanceTags(
        captureData.tags || null,
        captureData.provider,
        captureData.message_type,
        captureData.topic
      )
      setEnhancedTags(parsed)
      setLoading(false)
    } catch (err) {
      setError((err as Error).message || 'Failed to load capture')
      setLoading(false)
    }
  }

  const fetchAvailableTags = async () => {
    try {
      const result = await window.electronAPI.data.getAllTags()
      if (result.success && result.tags) {
        const formatted = formatTagsForAutocomplete(result.tags)
        setAvailableTags(formatted)
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  // Copy to clipboard helper
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied!', `${label} copied to clipboard`)
    } catch (error) {
      toast.error('Copy failed', 'Failed to copy to clipboard')
    }
  }

  // Handle tag addition
  const handleAddTag = async (tagText: string) => {
    const trimmedTag = tagText.trim()
    if (!trimmedTag) return

    // Check if tag already exists
    if (enhancedTags.some(t => t.text.toLowerCase() === trimmedTag.toLowerCase())) {
      toast.warning('Tag exists', 'This tag is already added')
      setNewTag('')
      return
    }

    // Create new enhanced tag with context
    const newEnhancedTag: EnhancedTag = {
      text: trimmedTag,
      type: 'custom', // Will be properly typed by backend on next load
    }

    const updatedEnhancedTags = [...enhancedTags, newEnhancedTag]
    const updatedTagStrings = enhancedTagsToStrings(updatedEnhancedTags)

    setEnhancedTags(updatedEnhancedTags)
    setNewTag('')

    try {
      const result = await window.electronAPI.data.updateTags(captureId, updatedTagStrings)
      if (result.success) {
        toast.success('Tag added', 'Tag has been added successfully')
        // Update local capture state
        if (capture) {
          setCapture({ ...capture, tags: JSON.stringify(updatedTagStrings) })
        }
      } else {
        // Revert on error
        setEnhancedTags(enhancedTags)
        toast.error('Update failed', result.error || 'Failed to add tag')
      }
    } catch (error) {
      setEnhancedTags(enhancedTags)
      toast.error('Update failed', 'An unexpected error occurred')
    }
  }

  // Handle tag removal
  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedEnhancedTags = enhancedTags.filter(t => t.text !== tagToRemove)
    const previousTags = [...enhancedTags]
    const updatedTagStrings = enhancedTagsToStrings(updatedEnhancedTags)

    setEnhancedTags(updatedEnhancedTags)

    try {
      const result = await window.electronAPI.data.updateTags(captureId, updatedTagStrings)
      if (result.success) {
        toast.success('Tag removed', 'Tag has been removed successfully')
        // Update local capture state
        if (capture) {
          setCapture({ ...capture, tags: JSON.stringify(updatedTagStrings) })
        }
      } else {
        // Revert on error
        setEnhancedTags(previousTags)
        toast.error('Update failed', result.error || 'Failed to remove tag')
      }
    } catch (error) {
      setEnhancedTags(previousTags)
      toast.error('Update failed', 'An unexpected error occurred')
    }
  }

  // Handle notes save
  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    try {
      const result = await window.electronAPI.data.updateNotes(captureId, notes)
      if (result.success) {
        toast.success('Notes saved', 'Notes have been updated successfully')
        setIsEditingNotes(false)
        // Update local capture state
        if (capture) {
          setCapture({ ...capture, notes })
        }
      } else {
        toast.error('Save failed', result.error || 'Failed to save notes')
      }
    } catch (error) {
      toast.error('Save failed', 'An unexpected error occurred')
    } finally {
      setIsSavingNotes(false)
    }
  }

  // Handle archive toggle
  const handleToggleArchive = async () => {
    if (!capture) return

    const newArchivedState = !capture.is_archived
    try {
      const result = await window.electronAPI.data.setArchived(captureId, newArchivedState)
      if (result.success) {
        toast.success(
          newArchivedState ? 'Capture archived' : 'Capture restored',
          newArchivedState
            ? 'The capture has been archived'
            : 'The capture has been restored'
        )
        // Update local capture state
        setCapture({ ...capture, is_archived: newArchivedState ? 1 : 0 })
      } else {
        toast.error('Update failed', result.error || 'Failed to update capture')
      }
    } catch (error) {
      toast.error('Update failed', 'An unexpected error occurred')
    }
  }

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await window.electronAPI.data.deleteCapture(captureId)
      if (result.success) {
        toast.success('Deleted', 'Capture has been deleted successfully')
        onClose?.()
      } else {
        toast.error('Delete failed', result.error || 'Failed to delete capture')
        setIsDeleting(false)
        setShowDeleteConfirmation(false)
      }
    } catch (error) {
      toast.error('Delete failed', 'An unexpected error occurred')
      setIsDeleting(false)
      setShowDeleteConfirmation(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading capture...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !capture) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold">Failed to Load Capture</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error || 'Capture not found'}
            </p>
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose} className="mt-2">
              Close
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with metadata */}
      <div className="border-b bg-muted/30 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={cn(
                'rounded-full px-3 py-1 text-xs font-medium',
                getProviderColor(capture.provider)
              )}>
                {capture.provider}
              </span>

              {capture.model && (
                <Badge variant="outline" className="text-xs">
                  {capture.model}
                </Badge>
              )}

              {capture.message_type && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {capture.message_type.replace('_', ' ')}
                </Badge>
              )}

              {capture.is_archived === 1 && (
                <Badge variant="secondary" className="text-xs">
                  Archived
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {format(new Date(capture.timestamp), 'MMM dd, yyyy HH:mm:ss')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleArchive}
            >
              {capture.is_archived ? (
                <>
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                  Restore
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </>
              )}
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirmation(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="space-y-8">
            {/* User Prompt Section */}
            {capture.prompt && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-semibold">User Prompt</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(capture.prompt, 'Prompt')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4 ml-11">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {capture.prompt}
                  </p>
                </div>
              </section>
            )}

            {/* AI Response Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-semibold">AI Response</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(capture.response, 'Response')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <div className="rounded-lg border bg-background p-6 ml-11">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={defaultRemarkPlugins}
                    rehypePlugins={defaultRehypePlugins}
                    components={markdownComponents}
                  >
                    {capture.response}
                  </ReactMarkdown>
                </div>
              </div>
            </section>

            {/* Tags Section */}
            <section className="space-y-3">
              <h2 className="text-base font-semibold">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {enhancedTags.map(tag => (
                  <TagBadge
                    key={tag.text}
                    tag={tag.text}
                    type={tag.type}
                    onRemove={() => handleRemoveTag(tag.text)}
                  />
                ))}
                {enhancedTags.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tags</p>
                )}
              </div>
              <TagAutocomplete
                value={newTag}
                onChange={setNewTag}
                onAddTag={handleAddTag}
                suggestions={availableTags}
                placeholder="Add a tag..."
              />
            </section>

            {/* Notes Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Notes</h2>
                {!isEditingNotes && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingNotes(true)}
                  >
                    Edit
                  </Button>
                )}
              </div>
              {isEditingNotes ? (
                <>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add notes about this capture..."
                    rows={6}
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      size="sm"
                    >
                      {isSavingNotes ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNotes(capture.notes || '')
                        setIsEditingNotes(false)
                      }}
                      disabled={isSavingNotes}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border bg-muted/50 p-4 min-h-[100px]">
                  {notes ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {notes}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No notes added</p>
                  )}
                </div>
              )}
            </section>

            {/* Metadata Section */}
            <section className="space-y-3">
              <h2 className="text-base font-semibold">Metadata</h2>
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Session ID</span>
                    <p className="font-mono text-xs break-all bg-background px-2 py-1 rounded">
                      {capture.session_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Capture ID</span>
                    <p className="font-mono text-xs break-all bg-background px-2 py-1 rounded">
                      {capture.id}
                    </p>
                  </div>
                  {capture.token_count && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Tokens</span>
                      <p>{capture.token_count.toLocaleString()}</p>
                    </div>
                  )}
                  {capture.response_format && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Format</span>
                      <p>{capture.response_format}</p>
                    </div>
                  )}
                  {capture.topic && (
                    <div>
                      <span className="text-muted-foreground block mb-1">Topic</span>
                      <p>{capture.topic}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </ScrollArea>

      {/* Delete Confirmation (Inline) */}
      {showDeleteConfirmation && (
        <div className="border-t bg-destructive/10 px-6 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">Delete this capture?</h3>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirmation(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CaptureTabContent
