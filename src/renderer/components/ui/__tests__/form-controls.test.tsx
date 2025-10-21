/**
 * Comprehensive unit tests for UI primitive form control components
 * Tests Button, Input, Label, Checkbox, Switch, and Textarea components
 * Coverage includes: rendering, variants, states, interactions, and accessibility
 * Target: 80-100 test cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithProviders, screen, waitFor } from '@/test-utils/test-helpers'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'
import { Input } from '../input'
import { Label } from '../label'
import { Checkbox } from '../checkbox'
import { Switch } from '../switch'
import { Textarea } from '../textarea'

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('should render with children text', () => {
      renderWithProviders(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('should render as a button element', () => {
      renderWithProviders(<Button>Test</Button>)
      const button = screen.getByRole('button')
      expect(button.tagName).toBe('BUTTON')
    })

    it('should apply custom className', () => {
      renderWithProviders(<Button className="custom-class">Test</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should forward ref correctly', () => {
      const ref = { current: null as HTMLButtonElement | null }
      renderWithProviders(<Button ref={ref}>Test</Button>)
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    })
  })

  describe('Variant Props', () => {
    it('should render default variant', () => {
      renderWithProviders(<Button variant="default">Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary')
    })

    it('should render destructive variant', () => {
      renderWithProviders(<Button variant="destructive">Delete</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive')
    })

    it('should render outline variant', () => {
      renderWithProviders(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border')
    })

    it('should render secondary variant', () => {
      renderWithProviders(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-secondary')
    })

    it('should render ghost variant', () => {
      renderWithProviders(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-accent')
    })

    it('should render link variant', () => {
      renderWithProviders(<Button variant="link">Link</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-primary', 'underline-offset-4')
    })
  })

  describe('Size Props', () => {
    it('should render default size', () => {
      renderWithProviders(<Button size="default">Default</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'px-4', 'py-2')
    })

    it('should render small size', () => {
      renderWithProviders(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9', 'px-3')
    })

    it('should render large size', () => {
      renderWithProviders(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-11', 'px-8')
    })

    it('should render icon size', () => {
      renderWithProviders(<Button size="icon">X</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'w-10')
    })
  })

  describe('States', () => {
    it('should render disabled state', () => {
      renderWithProviders(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      renderWithProviders(<Button disabled onClick={handleClick}>Disabled</Button>)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Interactions', () => {
    it('should call onClick handler when clicked', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      renderWithProviders(<Button onClick={handleClick}>Click me</Button>)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should handle keyboard activation with Enter', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      renderWithProviders(<Button onClick={handleClick}>Press me</Button>)

      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard('{Enter}')

      expect(handleClick).toHaveBeenCalled()
    })

    it('should handle keyboard activation with Space', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      renderWithProviders(<Button onClick={handleClick}>Press me</Button>)

      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard(' ')

      expect(handleClick).toHaveBeenCalled()
    })
  })

  describe('Button Types', () => {
    it('should be a button element (no explicit type needed)', () => {
      renderWithProviders(<Button>Test</Button>)
      const button = screen.getByRole('button')
      expect(button.tagName).toBe('BUTTON')
    })

    it('should render with type="submit"', () => {
      renderWithProviders(<Button type="submit">Submit</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should render with type="reset"', () => {
      renderWithProviders(<Button type="reset">Reset</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'reset')
    })
  })

  describe('Accessibility', () => {
    it('should have focus-visible styles', () => {
      renderWithProviders(<Button>Test</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('should accept aria-label', () => {
      renderWithProviders(<Button aria-label="Close dialog">X</Button>)
      const button = screen.getByRole('button', { name: /close dialog/i })
      expect(button).toBeInTheDocument()
    })

    it('should accept aria-describedby', () => {
      renderWithProviders(
        <>
          <Button aria-describedby="help-text">Help</Button>
          <div id="help-text">This is help text</div>
        </>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-describedby', 'help-text')
    })
  })
})

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('should render input element', () => {
      renderWithProviders(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      renderWithProviders(<Input className="custom-input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-input')
    })

    it('should forward ref correctly', () => {
      const ref = { current: null as HTMLInputElement | null }
      renderWithProviders(<Input ref={ref} />)
      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('should render with placeholder', () => {
      renderWithProviders(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })
  })

  describe('Input Types', () => {
    it('should render as textbox by default', () => {
      renderWithProviders(<Input />)
      const input = screen.getByRole('textbox')
      expect(input.tagName).toBe('INPUT')
    })

    it('should render email type', () => {
      renderWithProviders(<Input type="email" />)
      const input = document.querySelector('input[type="email"]')
      expect(input).toBeInTheDocument()
    })

    it('should render password type', () => {
      renderWithProviders(<Input type="password" />)
      const input = document.querySelector('input[type="password"]')
      expect(input).toBeInTheDocument()
    })

    it('should render number type', () => {
      renderWithProviders(<Input type="number" />)
      const input = document.querySelector('input[type="number"]')
      expect(input).toBeInTheDocument()
    })

    it('should render search type', () => {
      renderWithProviders(<Input type="search" />)
      const input = document.querySelector('input[type="search"]')
      expect(input).toBeInTheDocument()
    })

    it('should render tel type', () => {
      renderWithProviders(<Input type="tel" />)
      const input = document.querySelector('input[type="tel"]')
      expect(input).toBeInTheDocument()
    })

    it('should render url type', () => {
      renderWithProviders(<Input type="url" />)
      const input = document.querySelector('input[type="url"]')
      expect(input).toBeInTheDocument()
    })
  })

  describe('States', () => {
    it('should render disabled state', () => {
      renderWithProviders(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })

    it('should render readOnly state', () => {
      renderWithProviders(<Input readOnly value="Read only" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('readonly')
    })

    it('should render required state', () => {
      renderWithProviders(<Input required />)
      const input = screen.getByRole('textbox')
      expect(input).toBeRequired()
    })
  })

  describe('Controlled Input', () => {
    it('should render with value', () => {
      renderWithProviders(<Input value="Test value" onChange={() => {}} />)
      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('Test value')
    })

    it('should call onChange handler', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      renderWithProviders(<Input onChange={handleChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'Hello')

      expect(handleChange).toHaveBeenCalled()
      expect(handleChange).toHaveBeenCalledTimes(5) // Once per character
    })

    it('should update value on typing', async () => {
      const user = userEvent.setup()
      const TestComponent = () => {
        const [value, setValue] = React.useState('')
        return <Input value={value} onChange={(e) => setValue(e.target.value)} />
      }

      renderWithProviders(<TestComponent />)
      const input = screen.getByRole('textbox') as HTMLInputElement

      await user.type(input, 'test')
      expect(input.value).toBe('test')
    })
  })

  describe('Uncontrolled Input', () => {
    it('should accept defaultValue', () => {
      renderWithProviders(<Input defaultValue="Default text" />)
      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('Default text')
    })

    it('should allow typing without onChange', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Input />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      await user.type(input, 'test')

      expect(input.value).toBe('test')
    })
  })

  describe('Accessibility', () => {
    it('should have focus-visible styles', () => {
      renderWithProviders(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('should accept aria-label', () => {
      renderWithProviders(<Input aria-label="Username" />)
      const input = screen.getByRole('textbox', { name: /username/i })
      expect(input).toBeInTheDocument()
    })

    it('should accept aria-describedby', () => {
      renderWithProviders(
        <>
          <Input aria-describedby="error-message" />
          <div id="error-message">This field is required</div>
        </>
      )
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'error-message')
    })

    it('should accept aria-invalid for error states', () => {
      renderWithProviders(<Input aria-invalid="true" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })
  })
})

describe('Label Component', () => {
  describe('Basic Rendering', () => {
    it('should render label element', () => {
      renderWithProviders(<Label>Test Label</Label>)
      expect(screen.getByText('Test Label')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      renderWithProviders(<Label className="custom-label">Label</Label>)
      const label = screen.getByText('Label')
      expect(label).toHaveClass('custom-label')
    })

    it('should forward ref correctly', () => {
      const ref = { current: null as HTMLLabelElement | null }
      renderWithProviders(<Label ref={ref}>Label</Label>)
      expect(ref.current).toBeInstanceOf(HTMLLabelElement)
    })
  })

  describe('Label Association', () => {
    it('should associate with input using htmlFor', () => {
      renderWithProviders(
        <>
          <Label htmlFor="test-input">Username</Label>
          <Input id="test-input" />
        </>
      )

      const label = screen.getByText('Username')
      expect(label).toHaveAttribute('for', 'test-input')
    })

    it('should allow clicking label to focus input', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <>
          <Label htmlFor="clickable-input">Click me</Label>
          <Input id="clickable-input" />
        </>
      )

      const label = screen.getByText('Click me')
      const input = screen.getByRole('textbox')

      await user.click(label)
      expect(input).toHaveFocus()
    })
  })

  describe('Styles', () => {
    it('should have default label styles', () => {
      renderWithProviders(<Label>Styled Label</Label>)
      const label = screen.getByText('Styled Label')
      expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none')
    })

    it('should have peer-disabled styles', () => {
      renderWithProviders(<Label>Disabled peer</Label>)
      const label = screen.getByText('Disabled peer')
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70')
    })
  })

  describe('Accessibility', () => {
    it('should be accessible to screen readers', () => {
      renderWithProviders(<Label>Accessible Label</Label>)
      const label = screen.getByText('Accessible Label')
      expect(label.tagName).toBe('LABEL')
    })
  })
})

describe('Checkbox Component', () => {
  describe('Basic Rendering', () => {
    it('should render checkbox', () => {
      renderWithProviders(<Checkbox aria-label="Accept terms" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      renderWithProviders(<Checkbox className="custom-checkbox" aria-label="Test" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveClass('custom-checkbox')
    })

    it('should forward ref correctly', () => {
      const ref = { current: null }
      renderWithProviders(<Checkbox ref={ref} aria-label="Test" />)
      expect(ref.current).toBeTruthy()
    })
  })

  describe('States', () => {
    it('should render unchecked by default', () => {
      renderWithProviders(<Checkbox aria-label="Test" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()
    })

    it('should render checked state', () => {
      renderWithProviders(<Checkbox checked aria-label="Test" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('should render disabled state', () => {
      renderWithProviders(<Checkbox disabled aria-label="Test" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeDisabled()
      expect(checkbox).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })

    it('should not toggle when disabled', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      renderWithProviders(<Checkbox disabled onCheckedChange={handleChange} aria-label="Test" />)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('Controlled Mode', () => {
    it('should call onCheckedChange when toggled', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      renderWithProviders(<Checkbox onCheckedChange={handleChange} aria-label="Test" />)

      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      expect(handleChange).toHaveBeenCalledWith(true)
    })

    it('should toggle between checked states', async () => {
      const user = userEvent.setup()
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false)
        return <Checkbox checked={checked} onCheckedChange={setChecked} aria-label="Toggle" />
      }

      renderWithProviders(<TestComponent />)
      const checkbox = screen.getByRole('checkbox')

      expect(checkbox).not.toBeChecked()

      await user.click(checkbox)
      await waitFor(() => expect(checkbox).toBeChecked())

      await user.click(checkbox)
      await waitFor(() => expect(checkbox).not.toBeChecked())
    })
  })

  describe('Keyboard Interactions', () => {
    it('should toggle on Space key', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      renderWithProviders(<Checkbox onCheckedChange={handleChange} aria-label="Test" />)

      const checkbox = screen.getByRole('checkbox')
      checkbox.focus()
      await user.keyboard(' ')

      expect(handleChange).toHaveBeenCalledWith(true)
    })

    it('should be focusable', () => {
      renderWithProviders(<Checkbox aria-label="Test" />)
      const checkbox = screen.getByRole('checkbox')
      checkbox.focus()
      expect(checkbox).toHaveFocus()
    })
  })

  describe('With Label', () => {
    it('should work with associated label', async () => {
      const user = userEvent.setup()
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false)
        return (
          <div className="flex items-center">
            <Checkbox id="terms" checked={checked} onCheckedChange={setChecked} />
            <Label htmlFor="terms" className="ml-2">Accept terms</Label>
          </div>
        )
      }

      renderWithProviders(<TestComponent />)
      const checkbox = screen.getByRole('checkbox')
      const label = screen.getByText('Accept terms')

      await user.click(label)
      await waitFor(() => expect(checkbox).toBeChecked())
    })
  })

  describe('Accessibility', () => {
    it('should have role checkbox', () => {
      renderWithProviders(<Checkbox aria-label="Test" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('role', 'checkbox')
    })

    it('should have focus-visible styles', () => {
      renderWithProviders(<Checkbox aria-label="Test" />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('should support aria-label', () => {
      renderWithProviders(<Checkbox aria-label="Custom label" />)
      const checkbox = screen.getByRole('checkbox', { name: /custom label/i })
      expect(checkbox).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      renderWithProviders(
        <>
          <Checkbox aria-describedby="help-text" aria-label="Test" />
          <div id="help-text">This is help text</div>
        </>
      )
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('aria-describedby', 'help-text')
    })
  })
})

describe('Switch Component', () => {
  describe('Basic Rendering', () => {
    it('should render switch', () => {
      renderWithProviders(<Switch aria-label="Toggle feature" />)
      const switchElement = screen.getByRole('switch')
      expect(switchElement).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      renderWithProviders(<Switch className="custom-switch" aria-label="Test" />)
      const switchElement = screen.getByRole('switch')
      expect(switchElement).toHaveClass('custom-switch')
    })

    it('should forward ref correctly', () => {
      const ref = { current: null }
      renderWithProviders(<Switch ref={ref} aria-label="Test" />)
      expect(ref.current).toBeTruthy()
    })
  })

  describe('States', () => {
    it('should render unchecked by default', () => {
      renderWithProviders(<Switch aria-label="Test" />)
      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked()
    })

    it('should render checked state', () => {
      renderWithProviders(<Switch checked aria-label="Test" />)
      const switchElement = screen.getByRole('switch')
      expect(switchElement).toBeChecked()
    })

    it('should render disabled state', () => {
      renderWithProviders(<Switch disabled aria-label="Test" />)
      const switchElement = screen.getByRole('switch')
      expect(switchElement).toBeDisabled()
      expect(switchElement).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })

    it('should not toggle when disabled', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      renderWithProviders(<Switch disabled onCheckedChange={handleChange} aria-label="Test" />)

      const switchElement = screen.getByRole('switch')
      await user.click(switchElement)

      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('Controlled Mode', () => {
    it('should call onCheckedChange when toggled', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      renderWithProviders(<Switch onCheckedChange={handleChange} aria-label="Test" />)

      const switchElement = screen.getByRole('switch')
      await user.click(switchElement)

      expect(handleChange).toHaveBeenCalledWith(true)
    })

    it('should toggle between checked states', async () => {
      const user = userEvent.setup()
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false)
        return <Switch checked={checked} onCheckedChange={setChecked} aria-label="Toggle" />
      }

      renderWithProviders(<TestComponent />)
      const switchElement = screen.getByRole('switch')

      expect(switchElement).not.toBeChecked()

      await user.click(switchElement)
      await waitFor(() => expect(switchElement).toBeChecked())

      await user.click(switchElement)
      await waitFor(() => expect(switchElement).not.toBeChecked())
    })
  })

  describe('Keyboard Interactions', () => {
    it('should toggle on Space key', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      renderWithProviders(<Switch onCheckedChange={handleChange} aria-label="Test" />)

      const switchElement = screen.getByRole('switch')
      switchElement.focus()
      await user.keyboard(' ')

      expect(handleChange).toHaveBeenCalledWith(true)
    })

    it('should be focusable', () => {
      renderWithProviders(<Switch aria-label="Test" />)
      const switchElement = screen.getByRole('switch')
      switchElement.focus()
      expect(switchElement).toHaveFocus()
    })
  })

  describe('With Label', () => {
    it('should work with associated label', async () => {
      const user = userEvent.setup()
      const TestComponent = () => {
        const [checked, setChecked] = React.useState(false)
        return (
          <div className="flex items-center">
            <Switch id="notifications" checked={checked} onCheckedChange={setChecked} />
            <Label htmlFor="notifications" className="ml-2">Enable notifications</Label>
          </div>
        )
      }

      renderWithProviders(<TestComponent />)
      const switchElement = screen.getByRole('switch')
      const label = screen.getByText('Enable notifications')

      await user.click(label)
      await waitFor(() => expect(switchElement).toBeChecked())
    })
  })

  describe('Visual States', () => {
    it('should have checked background color', () => {
      renderWithProviders(<Switch checked aria-label="Test" />)
      const switchElement = screen.getByRole('switch')
      expect(switchElement).toHaveClass('data-[state=checked]:bg-primary')
    })

    it('should have unchecked background color', () => {
      renderWithProviders(<Switch aria-label="Test" />)
      const switchElement = screen.getByRole('switch')
      expect(switchElement).toHaveClass('data-[state=unchecked]:bg-input')
    })
  })

  describe('Accessibility', () => {
    it('should have role switch', () => {
      renderWithProviders(<Switch aria-label="Test" />)
      const switchElement = screen.getByRole('switch')
      expect(switchElement).toHaveAttribute('role', 'switch')
    })

    it('should have focus-visible styles', () => {
      renderWithProviders(<Switch aria-label="Test" />)
      const switchElement = screen.getByRole('switch')
      expect(switchElement).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('should support aria-label', () => {
      renderWithProviders(<Switch aria-label="Toggle dark mode" />)
      const switchElement = screen.getByRole('switch', { name: /toggle dark mode/i })
      expect(switchElement).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      renderWithProviders(
        <>
          <Switch aria-describedby="help-text" aria-label="Test" />
          <div id="help-text">This toggles the feature</div>
        </>
      )
      const switchElement = screen.getByRole('switch')
      expect(switchElement).toHaveAttribute('aria-describedby', 'help-text')
    })
  })
})

describe('Textarea Component', () => {
  describe('Basic Rendering', () => {
    it('should render textarea element', () => {
      renderWithProviders(<Textarea />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()
      expect(textarea.tagName).toBe('TEXTAREA')
    })

    it('should apply custom className', () => {
      renderWithProviders(<Textarea className="custom-textarea" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('custom-textarea')
    })

    it('should forward ref correctly', () => {
      const ref = { current: null as HTMLTextAreaElement | null }
      renderWithProviders(<Textarea ref={ref} />)
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
    })

    it('should render with placeholder', () => {
      renderWithProviders(<Textarea placeholder="Enter your message" />)
      expect(screen.getByPlaceholderText('Enter your message')).toBeInTheDocument()
    })
  })

  describe('States', () => {
    it('should render disabled state', () => {
      renderWithProviders(<Textarea disabled />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeDisabled()
      expect(textarea).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })

    it('should render readOnly state', () => {
      renderWithProviders(<Textarea readOnly value="Read only" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('readonly')
    })

    it('should render required state', () => {
      renderWithProviders(<Textarea required />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeRequired()
    })
  })

  describe('Controlled Textarea', () => {
    it('should render with value', () => {
      renderWithProviders(<Textarea value="Test content" onChange={() => {}} />)
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.value).toBe('Test content')
    })

    it('should call onChange handler', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      renderWithProviders(<Textarea onChange={handleChange} />)

      const textarea = screen.getByRole('textbox')
      await user.type(textarea, 'Test')

      expect(handleChange).toHaveBeenCalled()
      expect(handleChange).toHaveBeenCalledTimes(4) // Once per character
    })

    it('should update value on typing', async () => {
      const user = userEvent.setup()
      const TestComponent = () => {
        const [value, setValue] = React.useState('')
        return <Textarea value={value} onChange={(e) => setValue(e.target.value)} />
      }

      renderWithProviders(<TestComponent />)
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement

      await user.type(textarea, 'Multi\nline\ntext')
      expect(textarea.value).toBe('Multi\nline\ntext')
    })
  })

  describe('Uncontrolled Textarea', () => {
    it('should accept defaultValue', () => {
      renderWithProviders(<Textarea defaultValue="Default content" />)
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.value).toBe('Default content')
    })

    it('should allow typing without onChange', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Textarea />)

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      await user.type(textarea, 'Some text')

      expect(textarea.value).toBe('Some text')
    })
  })

  describe('Size Properties', () => {
    it('should have default min-height', () => {
      renderWithProviders(<Textarea />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('min-h-[80px]')
    })

    it('should accept rows attribute', () => {
      renderWithProviders(<Textarea rows={10} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('rows', '10')
    })

    it('should accept cols attribute', () => {
      renderWithProviders(<Textarea cols={50} />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('cols', '50')
    })
  })

  describe('Accessibility', () => {
    it('should have focus-visible styles', () => {
      renderWithProviders(<Textarea />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('should accept aria-label', () => {
      renderWithProviders(<Textarea aria-label="Message content" />)
      const textarea = screen.getByRole('textbox', { name: /message content/i })
      expect(textarea).toBeInTheDocument()
    })

    it('should accept aria-describedby', () => {
      renderWithProviders(
        <>
          <Textarea aria-describedby="char-count" />
          <div id="char-count">0/500 characters</div>
        </>
      )
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-describedby', 'char-count')
    })

    it('should accept aria-invalid for error states', () => {
      renderWithProviders(<Textarea aria-invalid="true" />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Multiline Support', () => {
    it('should support multiple lines of text', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Textarea />)

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      await user.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3')

      expect(textarea.value).toBe('Line 1\nLine 2\nLine 3')
    })

    it('should preserve line breaks in controlled mode', () => {
      const multilineText = 'First line\nSecond line\nThird line'
      renderWithProviders(<Textarea value={multilineText} onChange={() => {}} />)

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.value).toBe(multilineText)
    })
  })
})

// Import React for useState usage in tests
import * as React from 'react'
