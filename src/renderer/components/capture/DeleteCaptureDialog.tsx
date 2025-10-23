import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/renderer/components/ui/alert-dialog'
import { toast } from '@/renderer/lib/toast'
import { useSessionStore } from '@/renderer/stores/sessionStore'
import { useCapturesStore } from '@/renderer/stores/capturesStore'

interface DeleteCaptureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  captureId: string
  onDeleted?: () => void
}

export function DeleteCaptureDialog({
  open,
  onOpenChange,
  captureId,
  onDeleted,
}: DeleteCaptureDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isViewHidden, setIsViewHidden] = React.useState(false)
  const { activeSessionId } = useSessionStore()
  const { deleteCapture } = useCapturesStore()

  // Hide WebContentsView when dialog opens, show when it closes
  React.useEffect(() => {
    const handleViewVisibility = async () => {
      if (!activeSessionId) {
        setIsViewHidden(true) // If no active session, we can show the dialog
        return
      }

      if (open) {
        // Hide the WebContentsView FIRST
        await window.electronAPI.views.setVisible(activeSessionId, false)
        // Small delay to ensure view is hidden
        await new Promise(resolve => setTimeout(resolve, 100))
        setIsViewHidden(true) // Now safe to show dialog
      } else {
        setIsViewHidden(false)
        // Show the WebContentsView when dialog closes
        await window.electronAPI.views.setVisible(activeSessionId, true)
      }
    }

    handleViewVisibility()
  }, [open, activeSessionId])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // Use store method which updates local state automatically
      await deleteCapture(captureId)

      toast.success('Capture deleted', 'The capture has been permanently deleted')
      onOpenChange(false)
      onDeleted?.()
    } catch (error) {
      console.error('Error deleting capture:', error)
      toast.error('Delete failed', 'An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  // Only render dialog after view is hidden
  return (
    <AlertDialog open={open && isViewHidden} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            capture and remove it from the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
