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

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await window.electronAPI.data.deleteCapture(captureId)

      if (result.success) {
        toast.success('Capture deleted', 'The capture has been permanently deleted')
        onOpenChange(false)
        onDeleted?.()
      } else {
        toast.error('Delete failed', result.error || 'Failed to delete capture')
      }
    } catch (error) {
      console.error('Error deleting capture:', error)
      toast.error('Delete failed', 'An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
