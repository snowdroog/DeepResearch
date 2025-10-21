import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'

interface CloseSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionName: string
  onConfirm: () => void
}

export function CloseSessionDialog({
  open,
  onOpenChange,
  sessionName,
  onConfirm,
}: CloseSessionDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Close Session?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to close the session "{sessionName}"?
            <br />
            <br />
            The session will be removed, but all captured data will be preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Close Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
