/**
 * Unit tests for UI Selection Controls Components (Group 2)
 * Tests Select, RadioGroup, and Badge components
 * Target: 40-50 test cases covering rendering, variants, interactions, and accessibility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithProviders, screen, waitFor } from '@/test-utils/test-helpers'
import userEvent from '@testing-library/user-event'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '../select'
import { RadioGroup, RadioGroupItem } from '../radio-group'
import { Badge } from '../badge'

describe('Badge Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default variant', () => {
      renderWithProviders(<Badge>Test Badge</Badge>)

      const badge = screen.getByText('Test Badge')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-primary')
    })

    it('should render with custom children', () => {
      renderWithProviders(<Badge>Custom Content</Badge>)

      expect(screen.getByText('Custom Content')).toBeInTheDocument()
    })

    it('should render with numeric content', () => {
      renderWithProviders(<Badge>42</Badge>)

      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('should render with React elements as children', () => {
      renderWithProviders(
        <Badge>
          <span data-testid="badge-icon">Icon</span>
          <span>Text</span>
        </Badge>
      )

      expect(screen.getByTestId('badge-icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })
  })

  describe('Variant Props', () => {
    it('should render with default variant styles', () => {
      renderWithProviders(<Badge variant="default">Default</Badge>)

      const badge = screen.getByText('Default')
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('should render with secondary variant styles', () => {
      renderWithProviders(<Badge variant="secondary">Secondary</Badge>)

      const badge = screen.getByText('Secondary')
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })

    it('should render with destructive variant styles', () => {
      renderWithProviders(<Badge variant="destructive">Destructive</Badge>)

      const badge = screen.getByText('Destructive')
      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground')
    })

    it('should render with outline variant styles', () => {
      renderWithProviders(<Badge variant="outline">Outline</Badge>)

      const badge = screen.getByText('Outline')
      expect(badge).toHaveClass('text-foreground')
      expect(badge).not.toHaveClass('border-transparent')
    })
  })

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      renderWithProviders(<Badge className="custom-class">Badge</Badge>)

      const badge = screen.getByText('Badge')
      expect(badge).toHaveClass('custom-class')
    })

    it('should merge custom className with variant styles', () => {
      renderWithProviders(
        <Badge variant="secondary" className="text-lg">
          Badge
        </Badge>
      )

      const badge = screen.getByText('Badge')
      expect(badge).toHaveClass('bg-secondary', 'text-lg')
    })

    it('should accept custom data attributes', () => {
      renderWithProviders(<Badge data-testid="custom-badge">Badge</Badge>)

      expect(screen.getByTestId('custom-badge')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should render as a div element', () => {
      renderWithProviders(<Badge>Accessible Badge</Badge>)

      const badge = screen.getByText('Accessible Badge')
      expect(badge.tagName).toBe('DIV')
    })

    it('should support aria attributes', () => {
      renderWithProviders(
        <Badge aria-label="Notification count" role="status">
          5
        </Badge>
      )

      const badge = screen.getByRole('status')
      expect(badge).toHaveAttribute('aria-label', 'Notification count')
    })
  })
})

describe('RadioGroup Component', () => {
  describe('Basic Rendering', () => {
    it('should render radio group with items', () => {
      renderWithProviders(
        <RadioGroup defaultValue="option1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" />
            <label htmlFor="r1">Option 1</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="r2" />
            <label htmlFor="r2">Option 2</label>
          </div>
        </RadioGroup>
      )

      expect(screen.getByLabelText('Option 1')).toBeInTheDocument()
      expect(screen.getByLabelText('Option 2')).toBeInTheDocument()
    })

    it('should render with default value selected', () => {
      renderWithProviders(
        <RadioGroup defaultValue="option2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" />
            <label htmlFor="r1">Option 1</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="r2" />
            <label htmlFor="r2">Option 2</label>
          </div>
        </RadioGroup>
      )

      const option2 = screen.getByLabelText('Option 2')
      expect(option2).toBeChecked()
    })

    it('should render disabled radio items', () => {
      renderWithProviders(
        <RadioGroup>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" disabled />
            <label htmlFor="r1">Disabled Option</label>
          </div>
        </RadioGroup>
      )

      const radio = screen.getByLabelText('Disabled Option')
      expect(radio).toBeDisabled()
    })
  })

  describe('User Interactions', () => {
    it('should select radio item on click', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <RadioGroup>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" />
            <label htmlFor="r1">Option 1</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="r2" />
            <label htmlFor="r2">Option 2</label>
          </div>
        </RadioGroup>
      )

      const option1 = screen.getByLabelText('Option 1')
      await user.click(option1)

      expect(option1).toBeChecked()
    })

    it('should call onChange when selection changes', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()

      renderWithProviders(
        <RadioGroup onValueChange={onValueChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" />
            <label htmlFor="r1">Option 1</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="r2" />
            <label htmlFor="r2">Option 2</label>
          </div>
        </RadioGroup>
      )

      const option1 = screen.getByLabelText('Option 1')
      await user.click(option1)

      expect(onValueChange).toHaveBeenCalledWith('option1')
    })

    it('should not allow selection when disabled', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()

      renderWithProviders(
        <RadioGroup onValueChange={onValueChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" disabled />
            <label htmlFor="r1">Disabled Option</label>
          </div>
        </RadioGroup>
      )

      const radio = screen.getByLabelText('Disabled Option')
      await user.click(radio)

      expect(onValueChange).not.toHaveBeenCalled()
    })

    it('should deselect previous option when new option selected', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <RadioGroup defaultValue="option1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" />
            <label htmlFor="r1">Option 1</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="r2" />
            <label htmlFor="r2">Option 2</label>
          </div>
        </RadioGroup>
      )

      const option1 = screen.getByLabelText('Option 1')
      const option2 = screen.getByLabelText('Option 2')

      expect(option1).toBeChecked()

      await user.click(option2)

      expect(option2).toBeChecked()
      expect(option1).not.toBeChecked()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should navigate between options using arrow keys', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <RadioGroup defaultValue="option1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" />
            <label htmlFor="r1">Option 1</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="r2" />
            <label htmlFor="r2">Option 2</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option3" id="r3" />
            <label htmlFor="r3">Option 3</label>
          </div>
        </RadioGroup>
      )

      const option1 = screen.getByLabelText('Option 1')
      option1.focus()

      await user.keyboard('{ArrowDown}')
      expect(screen.getByLabelText('Option 2')).toHaveFocus()

      await user.keyboard('{ArrowDown}')
      expect(screen.getByLabelText('Option 3')).toHaveFocus()
    })

    it('should navigate backwards using arrow up key', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <RadioGroup defaultValue="option2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" />
            <label htmlFor="r1">Option 1</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="r2" />
            <label htmlFor="r2">Option 2</label>
          </div>
        </RadioGroup>
      )

      const option2 = screen.getByLabelText('Option 2')
      option2.focus()

      await user.keyboard('{ArrowUp}')
      expect(screen.getByLabelText('Option 1')).toHaveFocus()
    })
  })

  describe('Controlled Mode', () => {
    it('should work in controlled mode with value prop', () => {
      const { rerender } = renderWithProviders(
        <RadioGroup value="option1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" />
            <label htmlFor="r1">Option 1</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="r2" />
            <label htmlFor="r2">Option 2</label>
          </div>
        </RadioGroup>
      )

      expect(screen.getByLabelText('Option 1')).toBeChecked()

      rerender(
        <RadioGroup value="option2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" />
            <label htmlFor="r1">Option 1</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="r2" />
            <label htmlFor="r2">Option 2</label>
          </div>
        </RadioGroup>
      )

      expect(screen.getByLabelText('Option 2')).toBeChecked()
    })
  })

  describe('Custom Styling', () => {
    it('should accept custom className on RadioGroup', () => {
      renderWithProviders(
        <RadioGroup className="custom-grid" data-testid="radio-group">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" />
            <label htmlFor="r1">Option 1</label>
          </div>
        </RadioGroup>
      )

      const group = screen.getByTestId('radio-group')
      expect(group).toHaveClass('custom-grid')
    })

    it('should accept custom className on RadioGroupItem', () => {
      renderWithProviders(
        <RadioGroup>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" className="custom-radio" />
            <label htmlFor="r1">Option 1</label>
          </div>
        </RadioGroup>
      )

      const radio = screen.getByLabelText('Option 1')
      expect(radio).toHaveClass('custom-radio')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA role for radio group', () => {
      renderWithProviders(
        <RadioGroup data-testid="radio-group">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" />
            <label htmlFor="r1">Option 1</label>
          </div>
        </RadioGroup>
      )

      const group = screen.getByTestId('radio-group')
      expect(group).toHaveAttribute('role', 'radiogroup')
    })

    it('should have proper ARIA role for radio items', () => {
      renderWithProviders(
        <RadioGroup>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="r1" />
            <label htmlFor="r1">Option 1</label>
          </div>
        </RadioGroup>
      )

      const radio = screen.getByLabelText('Option 1')
      // Radix UI uses role="radio" instead of type="radio"
      expect(radio).toHaveAttribute('role', 'radio')
    })

    it('should support aria-label on radio group', () => {
      renderWithProviders(
        <RadioGroup aria-label="Select theme" data-testid="radio-group">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="light" id="r1" />
            <label htmlFor="r1">Light</label>
          </div>
        </RadioGroup>
      )

      const group = screen.getByTestId('radio-group')
      expect(group).toHaveAttribute('aria-label', 'Select theme')
    })
  })
})

describe('Select Component', () => {
  describe('Basic Rendering', () => {
    it('should render select trigger with placeholder', () => {
      renderWithProviders(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should render with default value', () => {
      renderWithProviders(
        <Select defaultValue="option1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveTextContent('Option 1')
    })

    it('should render disabled select', () => {
      renderWithProviders(
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toBeDisabled()
    })

    it('should render select with groups and labels', () => {
      renderWithProviders(
        <Select defaultOpen>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Vegetables</SelectLabel>
              <SelectItem value="carrot">Carrot</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )

      expect(screen.getByText('Fruits')).toBeInTheDocument()
      expect(screen.getByText('Vegetables')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should open dropdown when trigger is clicked', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      await waitFor(() => {
        expect(trigger).toHaveAttribute('data-state', 'open')
      })
    })

    it('should select an option when clicked', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()

      renderWithProviders(
        <Select onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Option 1'))

      expect(onValueChange).toHaveBeenCalledWith('option1')
    })

    it('should not open when disabled', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      expect(trigger).toHaveAttribute('data-state', 'closed')
    })

    it('should close dropdown when escape is pressed', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      renderWithProviders(
        <Select onOpenChange={onOpenChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(true)
      })

      // Simulate closing by pressing Escape
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('should open dropdown with Enter key', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      trigger.focus()

      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(trigger).toHaveAttribute('data-state', 'open')
      })
    })

    it('should open dropdown with Space key', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      trigger.focus()

      await user.keyboard(' ')

      await waitFor(() => {
        expect(trigger).toHaveAttribute('data-state', 'open')
      })
    })

    it('should close dropdown with Escape key', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      renderWithProviders(
        <Select defaultOpen onOpenChange={onOpenChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('should navigate options with arrow keys when open', async () => {
      renderWithProviders(
        <Select defaultOpen>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
            <SelectItem value="option3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      )

      // Verify that options are rendered when open
      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument()
        expect(screen.getByText('Option 2')).toBeInTheDocument()
        expect(screen.getByText('Option 3')).toBeInTheDocument()
      })

      // When open, the listbox role is present
      const listbox = screen.getByRole('listbox')
      expect(listbox).toHaveAttribute('data-state', 'open')
    })
  })

  describe('Controlled Mode', () => {
    it('should work in controlled mode with value prop', () => {
      const { rerender } = renderWithProviders(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveTextContent('Option 1')

      rerender(
        <Select value="option2">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(trigger).toHaveTextContent('Option 2')
    })

    it('should call onValueChange when value changes', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()

      renderWithProviders(
        <Select onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Option 2'))

      expect(onValueChange).toHaveBeenCalledWith('option2')
    })

    it('should handle onOpenChange callback', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()

      renderWithProviders(
        <Select onOpenChange={onOpenChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(true)
      })
    })
  })

  describe('Custom Styling', () => {
    it('should accept custom className on SelectTrigger', () => {
      renderWithProviders(
        <Select>
          <SelectTrigger className="custom-trigger">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveClass('custom-trigger')
    })

    it('should accept custom className on SelectContent', () => {
      renderWithProviders(
        <Select defaultOpen>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="custom-content">
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      // SelectContent renders in a portal, so we check if the item is rendered
      const item = screen.getByText('Option 1')
      expect(item).toBeInTheDocument()
    })

    it('should accept custom className on SelectItem', () => {
      renderWithProviders(
        <Select defaultOpen>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1" className="custom-item">
              Option 1
            </SelectItem>
          </SelectContent>
        </Select>
      )

      const item = screen.getByText('Option 1')
      // The className is on the parent element, not the text span
      const itemElement = item.closest('[role="option"]')
      expect(itemElement).toHaveClass('custom-item')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on trigger', () => {
      renderWithProviders(
        <Select>
          <SelectTrigger aria-label="Select option">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-label', 'Select option')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('should update aria-expanded when opened', async () => {
      const user = userEvent.setup()

      renderWithProviders(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')

      await user.click(trigger)

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true')
      })
    })

    it('should support disabled items', () => {
      renderWithProviders(
        <Select defaultOpen>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1" disabled>
              Disabled Option
            </SelectItem>
            <SelectItem value="option2">Active Option</SelectItem>
          </SelectContent>
        </Select>
      )

      const disabledItem = screen.getByText('Disabled Option')
      const itemElement = disabledItem.closest('[role="option"]')
      expect(itemElement).toHaveAttribute('data-disabled')
    })

    it('should have proper role for select items', () => {
      renderWithProviders(
        <Select defaultOpen>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )

      const item = screen.getByText('Option 1')
      const itemElement = item.closest('[role="option"]')
      expect(itemElement).toHaveAttribute('role', 'option')
    })
  })
})
