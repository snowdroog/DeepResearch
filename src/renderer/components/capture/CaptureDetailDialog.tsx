import * as React from 'react'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/renderer/components/ui/dialog'
import { ScrollArea } from '@/renderer/components/ui/scroll-area'
import { Button } from '@/renderer/components/ui/button'
import { Textarea } from '@/renderer/components/ui/textarea'
import { Badge } from '@/renderer/components/ui/badge'
import {
  Archive,
  ArchiveRestore,
  Copy,
  Trash2,
  Check,
  Microscope,
} from 'lucide-react'
import { DeleteCaptureDialog } from './DeleteCaptureDialog'
import { toast } from '@/renderer/lib/toast'
import type { CaptureData } from '@/renderer/components/organisms/ResearchDataTable'
import TagBadge from '../ui/tag-badge'
import TagAutocomplete from '../ui/tag-autocomplete'
import {
  parseAndEnhanceTags,
  enhancedTagsToStrings,
  formatTagsForAutocomplete,
  type EnhancedTag,
} from '../../utils/tagUtils'

interface CaptureDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  capture: CaptureData | null
  onUpdate?: () => void
}

export function CaptureDetailDialog({
  open,
  onOpenChange,
  capture,
  onUpdate,
}: CaptureDetailDialogProps) {
  const [notes, setNotes] = React.useState('')
  const [enhancedTags, setEnhancedTags] = React.useState<EnhancedTag[]>([])
  const [availableTags, setAvailableTags] = React.useState<EnhancedTag[]>([])
  const [newTag, setNewTag] = React.useState('')
  const [isEditingNotes, setIsEditingNotes] = React.useState(false)
  const [isSavingNotes, setIsSavingNotes] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  // Fetch available tags on mount
  React.useEffect(() => {
    const fetchTags = async () => {
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
    fetchTags()
  }, [])

  // Initialize state when capture changes
  React.useEffect(() => {
    if (capture) {
      setNotes(capture.notes || '')
      // Parse and enhance tags with context from capture
      const parsed = parseAndEnhanceTags(
        capture.tags || null,
        capture.provider,
        capture.message_type,
        capture.topic
      )
      setEnhancedTags(parsed)
      setIsEditingNotes(false)
    }
  }, [capture])

  if (!capture) return null

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
      type: 'custom' // Will be properly typed by backend on next load
    }

    const updatedEnhancedTags = [...enhancedTags, newEnhancedTag]
    const updatedTagStrings = enhancedTagsToStrings(updatedEnhancedTags)

    setEnhancedTags(updatedEnhancedTags)
    setNewTag('')

    try {
      const result = await window.electronAPI.data.updateTags(
        capture.id,
        updatedTagStrings
      )
      if (result.success) {
        toast.success('Tag added', 'Tag has been added successfully')
        onUpdate?.()
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
    const updatedEnhancedTags = enhancedTags.filter((t) => t.text !== tagToRemove)
    const previousTags = [...enhancedTags]
    const updatedTagStrings = enhancedTagsToStrings(updatedEnhancedTags)

    setEnhancedTags(updatedEnhancedTags)

    try {
      const result = await window.electronAPI.data.updateTags(
        capture.id,
        updatedTagStrings
      )
      if (result.success) {
        toast.success('Tag removed', 'Tag has been removed successfully')
        onUpdate?.()
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
      const result = await window.electronAPI.data.updateNotes(
        capture.id,
        notes
      )
      if (result.success) {
        toast.success('Notes saved', 'Notes have been updated successfully')
        setIsEditingNotes(false)
        onUpdate?.()
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
    const newArchivedState = !capture.is_archived
    try {
      const result = await window.electronAPI.data.setArchived(
        capture.id,
        newArchivedState
      )
      if (result.success) {
        toast.success(
          newArchivedState ? 'Capture archived' : 'Capture restored',
          newArchivedState
            ? 'The capture has been archived'
            : 'The capture has been restored'
        )
        onUpdate?.()
      } else {
        toast.error('Update failed', result.error || 'Failed to update capture')
      }
    } catch (error) {
      toast.error('Update failed', 'An unexpected error occurred')
    }
  }

  // Handle delete
  const handleDeleted = () => {
    onOpenChange(false)
    onUpdate?.()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center gap-2">
              <DialogTitle>Capture Details</DialogTitle>
              {capture.message_type === 'deep_research' && (
                <Badge variant="secondary" className="gap-1">
                  <Microscope className="h-3 w-3" />
                  Deep Research
                </Badge>
              )}
            </div>
            <DialogDescription>
              {format(new Date(capture.timestamp * 1000), 'MMM dd, yyyy HH:mm:ss')} •{' '}
              {capture.provider} {capture.model ? `• ${capture.model}` : ''}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-8rem)] px-6">
            <div className="space-y-6 pb-6">
              {/* Prompt Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Prompt</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(capture.prompt, 'Prompt')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="rounded-md border bg-muted/50 p-4">
                  <p className="text-sm whitespace-pre-wrap">{capture.prompt}</p>
                </div>
              </div>

              {/* Response Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Response</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(capture.response, 'Response')
                    }
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="rounded-md border bg-muted/50 p-6">
                  <ReactMarkdown
                    className="prose prose-sm dark:prose-invert max-w-none"
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1 className="text-2xl font-bold mt-6 mb-4 first:mt-0" {...props} />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 className="text-xl font-bold mt-5 mb-3 first:mt-0" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0" {...props} />
                      ),
                      p: ({ node, ...props }) => (
                        <p className="mb-4 leading-relaxed" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="leading-relaxed" {...props} />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          className="text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        />
                      ),
                      code: ({ node, inline, ...props }: any) =>
                        inline ? (
                          <code
                            className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                            {...props}
                          />
                        ) : (
                          <code
                            className="block bg-muted p-4 rounded-md overflow-x-auto text-sm font-mono mb-4"
                            {...props}
                          />
                        ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          className="border-l-4 border-primary/30 pl-4 italic my-4 text-muted-foreground"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {capture.response}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Sources Section (Deep Research) */}
              {capture.metadata_json && (() => {
                try {
                  const metadata = JSON.parse(capture.metadata_json)
                  if (metadata.sources && metadata.sources.length > 0) {
                    return (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold">
                          Sources ({metadata.sources.length})
                        </h3>
                        <div className="rounded-md border bg-muted/50 p-4 space-y-3">
                          {metadata.sources.map((source: any, index: number) => (
                            <div
                              key={index}
                              className="pb-3 border-b last:border-b-0 last:pb-0"
                            >
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-primary hover:underline"
                              >
                                {source.title}
                              </a>
                              <p className="text-xs text-muted-foreground mt-1 break-all">
                                {source.url}
                              </p>
                              {source.snippet && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {source.snippet}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                } catch (error) {
                  console.error('Failed to parse metadata_json:', error)
                }
                return null
              })()}

              {/* Tags Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {enhancedTags.map((tag) => (
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
              </div>

              {/* Notes Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Notes</h3>
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
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this capture..."
                      rows={6}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        size="sm"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {isSavingNotes ? 'Saving...' : 'Save'}
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
                  <div className="rounded-md border bg-muted/50 p-4 min-h-[100px]">
                    {notes ? (
                      <p className="text-sm whitespace-pre-wrap">{notes}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No notes added
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Metadata Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Metadata</h3>
                <div className="rounded-md border bg-muted/50 p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Session ID:</span>
                      <p className="font-mono text-xs break-all">
                        {capture.session_id}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Capture ID:</span>
                      <p className="font-mono text-xs break-all">
                        {capture.id}
                      </p>
                    </div>
                    {capture.token_count && (
                      <div>
                        <span className="text-muted-foreground">Tokens:</span>
                        <p>{capture.token_count.toLocaleString()}</p>
                      </div>
                    )}
                    {capture.response_format && (
                      <div>
                        <span className="text-muted-foreground">Format:</span>
                        <p>{capture.response_format}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Actions Footer */}
          <div className="flex items-center justify-between border-t p-4 bg-muted/30">
            <div className="flex gap-2">
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
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteCaptureDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        captureId={capture.id}
        onDeleted={handleDeleted}
      />
    </>
  )
}
