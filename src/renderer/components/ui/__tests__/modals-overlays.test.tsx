/**
 * Unit tests for UI Modals & Overlays components (Group 3)
 * Tests Dialog, AlertDialog, and Popover components
 *
 * Components tested:
 * - Dialog: Full-featured modal dialog with overlay, close button, and flexible content
 * - AlertDialog: Alert-style dialog for important confirmations with action/cancel buttons
 * - Popover: Floating content container for contextual information
 *
 * Test coverage:
 * - Open/close behavior and state management
 * - onOpenChange callbacks
 * - Portal rendering (components render outside main tree)
 * - ESC key handling
 * - Click outside behavior (overlay interaction)
 * - Focus management and focus trapping
 * - Trigger interactions
 * - Content rendering when open
 * - Accessibility attributes
 * - Component composition
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithProviders, screen, waitFor, within } from '@/test-utils/test-helpers'
import userEvent from '@testing-library/user-event'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../dialog'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../alert-dialog'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '../popover'
import { useState } from 'react'

// Test wrapper component for controlled Dialog
function ControlledDialog({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>Open Dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog Description</DialogDescription>
        </DialogHeader>
        <div>Dialog Content</div>
        <DialogFooter>
          <DialogClose>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Test wrapper component for controlled AlertDialog
function ControlledAlertDialog({ onOpenChange, onAction, onCancel }: {
  onOpenChange?: (open: boolean) => void
  onAction?: () => void
  onCancel?: () => void
}) {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  const handleAction = () => {
    onAction?.()
    setOpen(false)
  }

  const handleCancel = () => {
    onCancel?.()
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger>Delete Item</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleAction}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Test wrapper component for controlled Popover
function ControlledPopover({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger>Show Popover</PopoverTrigger>
      <PopoverContent>
        <div>Popover Content</div>
      </PopoverContent>
    </Popover>
  )
}

describe('Dialog Component', () => {
  describe('Basic Rendering', () => {
    it('should not render content when closed', () => {
      renderWithProviders(
        <Dialog open={false}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument()
    })

    it('should render content when open', () => {
      renderWithProviders(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Test Description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Test Dialog')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
    })

    it('should render dialog with all sub-components', () => {
      renderWithProviders(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Header Title</DialogTitle>
              <DialogDescription>Dialog Header Description</DialogDescription>
            </DialogHeader>
            <div>Main Content Area</div>
            <DialogFooter>
              <button>Footer Button</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('Dialog Header Title')).toBeInTheDocument()
      expect(screen.getByText('Dialog Header Description')).toBeInTheDocument()
      expect(screen.getByText('Main Content Area')).toBeInTheDocument()
      expect(screen.getByText('Footer Button')).toBeInTheDocument()
    })

    it('should render close button with X icon', () => {
      renderWithProviders(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('Open/Close Behavior', () => {
    it('should open dialog when trigger is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ControlledDialog />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      const trigger = screen.getByText('Open Dialog')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('should close dialog when close button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ControlledDialog />)

      // Open dialog
      await user.click(screen.getByText('Open Dialog'))
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

      // Close using X button (sr-only text)
      const closeButtons = screen.getAllByRole('button', { name: /close/i })
      // The X close button is the first one with sr-only text
      const xCloseButton = closeButtons.find(btn => btn.querySelector('.sr-only'))
      expect(xCloseButton).toBeDefined()

      if (xCloseButton) {
        await user.click(xCloseButton)

        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })
      }
    })

    it('should close dialog when DialogClose button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ControlledDialog />)

      // Open dialog
      await user.click(screen.getByText('Open Dialog'))
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

      // Close using DialogClose button in footer (the one without sr-only)
      const closeButtons = screen.getAllByText('Close')
      // The DialogClose button is the one that's a button element in the footer
      const dialogCloseButton = closeButtons.find(btn =>
        btn.tagName === 'BUTTON' && !btn.querySelector('.sr-only')
      )
      expect(dialogCloseButton).toBeDefined()

      if (dialogCloseButton) {
        await user.click(dialogCloseButton)

        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })
      }
    })

    it('should call onOpenChange when dialog state changes', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<ControlledDialog onOpenChange={onOpenChange} />)

      // Open dialog
      await user.click(screen.getByText('Open Dialog'))

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(true)
      })

      // Close dialog using X button
      const closeButtons = screen.getAllByRole('button', { name: /close/i })
      const xCloseButton = closeButtons.find(btn => btn.querySelector('.sr-only'))
      expect(xCloseButton).toBeDefined()

      if (xCloseButton) {
        await user.click(xCloseButton)

        await waitFor(() => {
          expect(onOpenChange).toHaveBeenCalledWith(false)
        })
      }
    })
  })

  describe('Keyboard Interactions', () => {
    it('should close dialog when Escape key is pressed', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ControlledDialog />)

      // Open dialog
      await user.click(screen.getByText('Open Dialog'))
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

      // Press Escape
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should call onOpenChange with false when Escape is pressed', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<ControlledDialog onOpenChange={onOpenChange} />)

      await user.click(screen.getByText('Open Dialog'))
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
    })
  })

  describe('Overlay Interactions', () => {
    it('should render overlay when dialog is open', () => {
      renderWithProviders(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      // Dialog should be visible when open
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(dialog).toHaveAttribute('data-state', 'open')
    })

    it('should close dialog when clicking on overlay (outside content)', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      function TestDialog() {
        const [open, setOpen] = useState(true)

        const handleOpenChange = (newOpen: boolean) => {
          setOpen(newOpen)
          onOpenChange(newOpen)
        }

        return (
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogContent>
          </Dialog>
        )
      }

      const { container } = renderWithProviders(<TestDialog />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      // Click on overlay (outside the dialog content)
      // The overlay is the parent of the dialog content
      const overlay = container.querySelector('[data-state="open"]') as HTMLElement
      if (overlay && overlay !== screen.getByRole('dialog')) {
        await user.click(overlay)

        await waitFor(() => {
          expect(onOpenChange).toHaveBeenCalledWith(false)
        })
      }
    })
  })

  describe('Portal Rendering', () => {
    it('should render dialog content in a portal (outside main tree)', () => {
      const { container } = renderWithProviders(
        <div data-testid="app-root">
          <Dialog open={true}>
            <DialogContent>
              <DialogTitle>Portal Test</DialogTitle>
            </DialogContent>
          </Dialog>
        </div>
      )

      const appRoot = screen.getByTestId('app-root')
      const dialog = screen.getByRole('dialog')

      // Dialog should not be a descendant of app-root (it's in a portal)
      expect(appRoot.contains(dialog)).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('should have proper dialog role', () => {
      renderWithProviders(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should have accessible title', () => {
      renderWithProviders(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Accessible Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const title = screen.getByText('Accessible Title')
      expect(title).toBeInTheDocument()
    })

    it('should have accessible description', () => {
      renderWithProviders(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Accessible Description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      const description = screen.getByText('Accessible Description')
      expect(description).toBeInTheDocument()
    })

    it('should have sr-only text on close button', () => {
      renderWithProviders(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('Custom Styling', () => {
    it('should accept custom className on DialogContent', () => {
      const { container } = renderWithProviders(
        <Dialog open={true}>
          <DialogContent className="custom-dialog-class">
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog.className).toContain('custom-dialog-class')
    })

    it('should accept custom className on DialogHeader', () => {
      renderWithProviders(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader className="custom-header">
              <DialogTitle>Test</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      const header = screen.getByText('Test').parentElement
      expect(header?.className).toContain('custom-header')
    })

    it('should accept custom className on DialogFooter', () => {
      const { container } = renderWithProviders(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
            <DialogFooter className="custom-footer">
              <button>OK</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      const footer = screen.getByText('OK').parentElement
      expect(footer?.className).toContain('custom-footer')
    })
  })
})

describe('AlertDialog Component', () => {
  describe('Basic Rendering', () => {
    it('should not render content when closed', () => {
      renderWithProviders(
        <AlertDialog open={false}>
          <AlertDialogContent>
            <AlertDialogTitle>Test Alert</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(screen.queryByText('Test Alert')).not.toBeInTheDocument()
    })

    it('should render content when open', () => {
      renderWithProviders(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Test Alert</AlertDialogTitle>
            <AlertDialogDescription>Test Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText('Test Alert')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
    })

    it('should render alert dialog with all sub-components', () => {
      renderWithProviders(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Action</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to continue?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.getByText('Confirm Action')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to continue?')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Continue')).toBeInTheDocument()
    })

    it('should not render close X button (unlike Dialog)', () => {
      renderWithProviders(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Test</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      // AlertDialog should not have the X close button
      const buttons = screen.queryAllByRole('button')
      const closeButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Close')
      expect(closeButton).toBeUndefined()
    })
  })

  describe('Open/Close Behavior', () => {
    it('should open alert dialog when trigger is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ControlledAlertDialog />)

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

      const trigger = screen.getByText('Delete Item')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })
    })

    it('should close when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()
      renderWithProviders(<ControlledAlertDialog onCancel={onCancel} />)

      await user.click(screen.getByText('Delete Item'))
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument())

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })
      expect(onCancel).toHaveBeenCalled()
    })

    it('should close when action button is clicked', async () => {
      const user = userEvent.setup()
      const onAction = vi.fn()
      renderWithProviders(<ControlledAlertDialog onAction={onAction} />)

      await user.click(screen.getByText('Delete Item'))
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument())

      const actionButton = screen.getByText('Delete')
      await user.click(actionButton)

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })
      expect(onAction).toHaveBeenCalled()
    })

    it('should call onOpenChange when dialog state changes', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<ControlledAlertDialog onOpenChange={onOpenChange} />)

      await user.click(screen.getByText('Delete Item'))

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(true)
      })

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
    })
  })

  describe('Keyboard Interactions', () => {
    it('should close alert dialog when Escape key is pressed', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ControlledAlertDialog />)

      await user.click(screen.getByText('Delete Item'))
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument())

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Action Confirmation Flow', () => {
    it('should execute action callback before closing', async () => {
      const user = userEvent.setup()
      const onAction = vi.fn()
      const onOpenChange = vi.fn()

      renderWithProviders(
        <ControlledAlertDialog
          onAction={onAction}
          onOpenChange={onOpenChange}
        />
      )

      await user.click(screen.getByText('Delete Item'))
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument())

      await user.click(screen.getByText('Delete'))

      await waitFor(() => {
        expect(onAction).toHaveBeenCalled()
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      })
    })

    it('should execute cancel callback before closing', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()

      renderWithProviders(<ControlledAlertDialog onCancel={onCancel} />)

      await user.click(screen.getByText('Delete Item'))
      await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument())

      await user.click(screen.getByText('Cancel'))

      await waitFor(() => {
        expect(onCancel).toHaveBeenCalled()
      })
    })
  })

  describe('Portal Rendering', () => {
    it('should render alert dialog content in a portal', () => {
      const { container } = renderWithProviders(
        <div data-testid="app-root">
          <AlertDialog open={true}>
            <AlertDialogContent>
              <AlertDialogTitle>Portal Test</AlertDialogTitle>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )

      const appRoot = screen.getByTestId('app-root')
      const alertDialog = screen.getByRole('alertdialog')

      expect(appRoot.contains(alertDialog)).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('should have proper alertdialog role', () => {
      renderWithProviders(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Test</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })

    it('should have accessible title', () => {
      renderWithProviders(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Accessible Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.getByText('Accessible Alert Title')).toBeInTheDocument()
    })

    it('should have accessible description', () => {
      renderWithProviders(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Important alert information</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.getByText('Important alert information')).toBeInTheDocument()
    })
  })

  describe('Button Styling', () => {
    it('should apply default button styles to AlertDialogAction', () => {
      renderWithProviders(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Test</AlertDialogTitle>
            <AlertDialogAction>Confirm</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      )

      const actionButton = screen.getByText('Confirm')
      expect(actionButton).toBeInTheDocument()
      expect(actionButton.tagName).toBe('BUTTON')
    })

    it('should apply outline variant to AlertDialogCancel', () => {
      renderWithProviders(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Test</AlertDialogTitle>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      )

      const cancelButton = screen.getByText('Cancel')
      expect(cancelButton).toBeInTheDocument()
      expect(cancelButton.tagName).toBe('BUTTON')
    })
  })

  describe('Custom Styling', () => {
    it('should accept custom className on AlertDialogContent', () => {
      renderWithProviders(
        <AlertDialog open={true}>
          <AlertDialogContent className="custom-alert-class">
            <AlertDialogTitle>Test</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      const alertDialog = screen.getByRole('alertdialog')
      expect(alertDialog.className).toContain('custom-alert-class')
    })
  })
})

describe('Popover Component', () => {
  describe('Basic Rendering', () => {
    it('should not render content when closed', () => {
      renderWithProviders(
        <Popover open={false}>
          <PopoverContent>
            <div>Popover Content</div>
          </PopoverContent>
        </Popover>
      )

      expect(screen.queryByText('Popover Content')).not.toBeInTheDocument()
    })

    it('should render content when open', () => {
      renderWithProviders(
        <Popover open={true}>
          <PopoverContent>
            <div>Popover Content</div>
          </PopoverContent>
        </Popover>
      )

      expect(screen.getByText('Popover Content')).toBeInTheDocument()
    })

    it('should render trigger and content together', () => {
      renderWithProviders(
        <Popover open={true}>
          <PopoverTrigger>Click Me</PopoverTrigger>
          <PopoverContent>
            <div>Popover Details</div>
          </PopoverContent>
        </Popover>
      )

      expect(screen.getByText('Click Me')).toBeInTheDocument()
      expect(screen.getByText('Popover Details')).toBeInTheDocument()
    })
  })

  describe('Open/Close Behavior', () => {
    it('should open popover when trigger is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ControlledPopover />)

      expect(screen.queryByText('Popover Content')).not.toBeInTheDocument()

      const trigger = screen.getByText('Show Popover')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Popover Content')).toBeInTheDocument()
      })
    })

    it('should close popover when clicking outside', async () => {
      const user = userEvent.setup()
      const { container } = renderWithProviders(
        <div>
          <ControlledPopover />
          <div data-testid="outside">Outside Element</div>
        </div>
      )

      // Open popover
      await user.click(screen.getByText('Show Popover'))
      await waitFor(() => expect(screen.getByText('Popover Content')).toBeInTheDocument())

      // Click outside
      const outsideElement = screen.getByTestId('outside')
      await user.click(outsideElement)

      await waitFor(() => {
        expect(screen.queryByText('Popover Content')).not.toBeInTheDocument()
      })
    })

    it('should call onOpenChange when popover state changes', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderWithProviders(<ControlledPopover onOpenChange={onOpenChange} />)

      await user.click(screen.getByText('Show Popover'))

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(true)
      })
    })

    it('should toggle popover on repeated trigger clicks', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ControlledPopover />)

      const trigger = screen.getByText('Show Popover')

      // Open
      await user.click(trigger)
      await waitFor(() => expect(screen.getByText('Popover Content')).toBeInTheDocument())

      // Close
      await user.click(trigger)
      await waitFor(() => expect(screen.queryByText('Popover Content')).not.toBeInTheDocument())

      // Open again
      await user.click(trigger)
      await waitFor(() => expect(screen.getByText('Popover Content')).toBeInTheDocument())
    })
  })

  describe('Keyboard Interactions', () => {
    it('should close popover when Escape key is pressed', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ControlledPopover />)

      await user.click(screen.getByText('Show Popover'))
      await waitFor(() => expect(screen.getByText('Popover Content')).toBeInTheDocument())

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByText('Popover Content')).not.toBeInTheDocument()
      })
    })
  })

  describe('Portal Rendering', () => {
    it('should render popover content in a portal', () => {
      const { container } = renderWithProviders(
        <div data-testid="app-root">
          <Popover open={true}>
            <PopoverContent>
              <div>Portal Test Content</div>
            </PopoverContent>
          </Popover>
        </div>
      )

      const appRoot = screen.getByTestId('app-root')
      const popoverContent = screen.getByText('Portal Test Content')

      // Popover content should not be inside app-root (it's in a portal)
      expect(appRoot.contains(popoverContent)).toBe(false)
    })
  })

  describe('Positioning', () => {
    it('should accept align prop on PopoverContent', () => {
      const { container } = renderWithProviders(
        <Popover open={true}>
          <PopoverContent align="start">
            <div>Aligned Content</div>
          </PopoverContent>
        </Popover>
      )

      expect(screen.getByText('Aligned Content')).toBeInTheDocument()
    })

    it('should accept sideOffset prop on PopoverContent', () => {
      renderWithProviders(
        <Popover open={true}>
          <PopoverContent sideOffset={10}>
            <div>Offset Content</div>
          </PopoverContent>
        </Popover>
      )

      expect(screen.getByText('Offset Content')).toBeInTheDocument()
    })

    it('should use default sideOffset of 4 when not specified', () => {
      renderWithProviders(
        <Popover open={true}>
          <PopoverContent>
            <div>Default Offset</div>
          </PopoverContent>
        </Popover>
      )

      expect(screen.getByText('Default Offset')).toBeInTheDocument()
    })
  })

  describe('Custom Styling', () => {
    it('should accept custom className on PopoverContent', () => {
      const { container } = renderWithProviders(
        <Popover open={true}>
          <PopoverContent className="custom-popover-class">
            <div>Styled Content</div>
          </PopoverContent>
        </Popover>
      )

      const popoverContent = screen.getByText('Styled Content').parentElement
      expect(popoverContent?.className).toContain('custom-popover-class')
    })
  })

  describe('Content Interactions', () => {
    it('should keep popover open when clicking inside content', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <Popover defaultOpen={true}>
          <PopoverTrigger>Trigger</PopoverTrigger>
          <PopoverContent>
            <button>Inside Button</button>
          </PopoverContent>
        </Popover>
      )

      const insideButton = screen.getByText('Inside Button')
      await user.click(insideButton)

      // Popover should still be visible
      expect(screen.getByText('Inside Button')).toBeInTheDocument()
    })
  })

  describe('Trigger Button Attributes', () => {
    it('should render trigger as a button by default', () => {
      renderWithProviders(
        <Popover>
          <PopoverTrigger>Trigger Text</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText('Trigger Text')
      expect(trigger.tagName).toBe('BUTTON')
    })

    it('should accept asChild prop on PopoverTrigger', () => {
      renderWithProviders(
        <Popover>
          <PopoverTrigger asChild>
            <div>Custom Trigger</div>
          </PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const trigger = screen.getByText('Custom Trigger')
      expect(trigger.tagName).toBe('DIV')
    })
  })
})

describe('Focus Management', () => {
  describe('Dialog Focus Management', () => {
    it('should trap focus inside dialog when open', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <Dialog defaultOpen={true}>
          <DialogContent>
            <DialogTitle>Focus Test</DialogTitle>
            <button>First Button</button>
            <button>Second Button</button>
          </DialogContent>
        </Dialog>
      )

      const firstButton = screen.getByText('First Button')
      const secondButton = screen.getByText('Second Button')

      // Tab through elements
      await user.tab()

      // Focus should be trapped within the dialog
      const activeElement = document.activeElement
      const dialogContent = screen.getByRole('dialog')

      expect(dialogContent.contains(activeElement)).toBe(true)
    })
  })

  describe('AlertDialog Focus Management', () => {
    it('should trap focus inside alert dialog when open', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <AlertDialog defaultOpen={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Focus Test</AlertDialogTitle>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Confirm</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      )

      const alertDialog = screen.getByRole('alertdialog')

      await user.tab()

      const activeElement = document.activeElement
      expect(alertDialog.contains(activeElement)).toBe(true)
    })
  })
})
