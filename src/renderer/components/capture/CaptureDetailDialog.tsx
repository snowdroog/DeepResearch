import * as React from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/renderer/components/ui/dialog'
import { ScrollArea } from '@/renderer/components/ui/scroll-area'
import { Button } from '@/renderer/components/ui/button'
import { Input } from '@/renderer/components/ui/input'
import { Textarea } from '@/renderer/components/ui/textarea'
import { Badge } from '@/renderer/components/ui/badge'
import {
  Archive,
  ArchiveRestore,
  Copy,
  Trash2,
  X,
  Plus,
  Check,
} from 'lucide-react'
import { DeleteCaptureDialog } from './DeleteCaptureDialog'
import { toast } from '@/renderer/lib/toast'
import type { CaptureData } from '@/renderer/components/organisms/ResearchDataTable'

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
  const [tags, setTags] = React.useState<string[]>([])
  const [newTag, setNewTag] = React.useState('')
  const [isEditingNotes, setIsEditingNotes] = React.useState(false)
  const [isSavingNotes, setIsSavingNotes] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  // Parse tags from JSON string
  const parseTags = (tagsStr?: string): string[] => {
    if (!tagsStr) return []
    try {
      return JSON.parse(tagsStr)
    } catch {
      return []
    }
  }

  // Initialize state when capture changes
  React.useEffect(() => {
    if (capture) {
      setNotes(capture.notes || '')
      setTags(parseTags(capture.tags))
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
  const handleAddTag = async () => {
    const trimmedTag = newTag.trim()
    if (!trimmedTag) return

    if (tags.includes(trimmedTag)) {
      toast.warning('Tag exists', 'This tag is already added')
      setNewTag('')
      return
    }

    const updatedTags = [...tags, trimmedTag]
    setTags(updatedTags)
    setNewTag('')

    try {
      const result = await window.electronAPI.data.updateTags(
        capture.id,
        updatedTags
      )
      if (result.success) {
        toast.success('Tag added', 'Tag has been added successfully')
        onUpdate?.()
      } else {
        // Revert on error
        setTags(tags)
        toast.error('Update failed', result.error || 'Failed to add tag')
      }
    } catch (error) {
      setTags(tags)
      toast.error('Update failed', 'An unexpected error occurred')
    }
  }

  // Handle tag removal
  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove)
    const previousTags = [...tags]
    setTags(updatedTags)

    try {
      const result = await window.electronAPI.data.updateTags(
        capture.id,
        updatedTags
      )
      if (result.success) {
        toast.success('Tag removed', 'Tag has been removed successfully')
        onUpdate?.()
      } else {
        // Revert on error
        setTags(previousTags)
        toast.error('Update failed', result.error || 'Failed to remove tag')
      }
    } catch (error) {
      setTags(previousTags)
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
            <DialogTitle>Capture Details</DialogTitle>
            <DialogDescription>
              {format(new Date(capture.timestamp), 'MMM dd, yyyy HH:mm:ss')} •{' '}
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
                <div className="rounded-md border bg-muted/50 p-4">
                  <p className="text-sm whitespace-pre-wrap">
                    {capture.response}
                  </p>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {tags.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tags</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button onClick={handleAddTag} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
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
