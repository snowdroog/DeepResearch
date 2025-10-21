/**
 * Smoke test for React Testing Library integration
 */

import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils/test-helpers';

// Simple test component
function TestComponent({ name }: { name: string }) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <button>Click me</button>
    </div>
  );
}

describe('React Testing Library Integration', () => {
  it('should render a simple component', () => {
    renderWithProviders(<TestComponent name="World" />);
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });

  it('should find elements by role', () => {
    renderWithProviders(<TestComponent name="Test" />);
    const heading = screen.getByRole('heading', { name: /hello, test/i });
    expect(heading).toBeInTheDocument();
  });

  it('should find button elements', () => {
    renderWithProviders(<TestComponent name="Test" />);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should handle component props', () => {
    const customName = 'Custom Name';
    renderWithProviders(<TestComponent name={customName} />);
    expect(screen.getByText(`Hello, ${customName}!`)).toBeInTheDocument();
  });

  it('should support queries', () => {
    renderWithProviders(<TestComponent name="Test" />);

    // getBy - throws error if not found
    expect(screen.getByText('Hello, Test!')).toBeInTheDocument();

    // queryBy - returns null if not found
    expect(screen.queryByText('Non-existent')).not.toBeInTheDocument();
  });
});

describe('Custom Test Helpers', () => {
  it('should render with router context', () => {
    // This test verifies that renderWithProviders includes BrowserRouter
    renderWithProviders(
      <div>
        <a href="/test">Test Link</a>
      </div>
    );
    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });
});
