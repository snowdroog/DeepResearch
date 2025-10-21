/**
 * Unit tests for ExportDialog component
 * Tests rendering, format selection, export operations, validation, and IPC communication
 * Target: 60%+ coverage with comprehensive test cases
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportDialog } from '@/renderer/components/export/ExportDialog'
import { createMockCaptureDataArray, resetMockIdCounter } from '@/test-utils/mock-factories'
import type { CaptureData } from '@/renderer/lib/export-utils'

describe('ExportDialog', () => {
  // Mock data
  let mockData: CaptureData[]
  let mockOnOpenChange: ReturnType<typeof vi.fn>

  // Mock electron API
  let mockShowSaveDialog: ReturnType<typeof vi.fn>
  let mockWriteJson: ReturnType<typeof vi.fn>
  let mockWriteJsonStream: ReturnType<typeof vi.fn>
  let mockWriteCsv: ReturnType<typeof vi.fn>
  let mockOnProgress: ReturnType<typeof vi.fn>

  beforeEach(() => {
    resetMockIdCounter()
    mockData = createMockCaptureDataArray(5)
    mockOnOpenChange = vi.fn()

    // Setup mock IPC functions
    mockShowSaveDialog = vi.fn(() =>
      Promise.resolve({
        success: true,
        filePath: '/mock/path/export.json',
        canceled: false,
      })
    )

    mockWriteJson = vi.fn(() =>
      Promise.resolve({
        success: true,
        recordsExported: 5,
      })
    )

    mockWriteJsonStream = vi.fn(() =>
      Promise.resolve({
        success: true,
        recordsExported: 5,
      })
    )

    mockWriteCsv = vi.fn(() =>
      Promise.resolve({
        success: true,
        recordsExported: 5,
      })
    )

    mockOnProgress = vi.fn(() => {
      // Return a cleanup function
      return () => {}
    })

    // Setup window.electronAPI.export
    global.window.electronAPI = {
      ...global.window.electronAPI,
      export: {
        showSaveDialog: mockShowSaveDialog,
        writeJson: mockWriteJson,
        writeJsonStream: mockWriteJsonStream,
        writeCsv: mockWriteCsv,
        onProgress: mockOnProgress,
      },
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers() // Ensure timers are always reset
  })

  describe('Component Rendering', () => {
    it('should render with all format options when open', () => {
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      expect(screen.getByText('Export Research Data')).toBeInTheDocument()
      expect(screen.getByText(/Export 5 research capture/)).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /JSON/i })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /CSV/i })).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<ExportDialog open={false} onOpenChange={mockOnOpenChange} data={mockData} />)

      expect(screen.queryByText('Export Research Data')).not.toBeInTheDocument()
    })

    it('should display correct record count in description', () => {
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      expect(screen.getByText(/Export 5 research captures to a file/)).toBeInTheDocument()
    })

    it('should display singular form for single record', () => {
      const singleRecord = createMockCaptureDataArray(1)
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={singleRecord} />)

      expect(screen.getByText(/Export 1 research capture to a file/)).toBeInTheDocument()
    })

    it('should display file info with record count and estimated size', () => {
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      expect(screen.getByText('Records:')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('Estimated size:')).toBeInTheDocument()
      // Size should be displayed in some format (KB, MB, etc.)
      expect(screen.getByText(/KB|MB|Bytes/)).toBeInTheDocument()
    })

    it('should render both Cancel and Export buttons', () => {
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument()
    })

    it('should disable Export button when data is empty', () => {
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={[]} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      expect(exportButton).toBeDisabled()
    })
  })

  describe('Format Selection', () => {
    it('should default to JSON format', () => {
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const jsonRadio = screen.getByRole('radio', { name: /JSON/i })
      expect(jsonRadio).toBeChecked()
    })

    it('should allow selecting CSV format', async () => {
      const user = userEvent.setup()
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const csvRadio = screen.getByRole('radio', { name: /CSV/i })
      await user.click(csvRadio)

      expect(csvRadio).toBeChecked()
    })

    it('should switch between JSON and CSV formats', async () => {
      const user = userEvent.setup()
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const jsonRadio = screen.getByRole('radio', { name: /JSON/i })
      const csvRadio = screen.getByRole('radio', { name: /CSV/i })

      // Start with JSON selected
      expect(jsonRadio).toBeChecked()

      // Switch to CSV
      await user.click(csvRadio)
      expect(csvRadio).toBeChecked()
      expect(jsonRadio).not.toBeChecked()

      // Switch back to JSON
      await user.click(jsonRadio)
      expect(jsonRadio).toBeChecked()
      expect(csvRadio).not.toBeChecked()
    })

    it('should display format descriptions', () => {
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      expect(screen.getByText(/Structured data format, best for re-importing/i)).toBeInTheDocument()
      expect(screen.getByText(/Spreadsheet format, best for Excel\/Sheets/i)).toBeInTheDocument()
    })
  })

  describe('Export Functionality - JSON', () => {
    it('should trigger JSON export with correct parameters for small datasets', async () => {
      const user = userEvent.setup()
      const smallData = createMockCaptureDataArray(10) // <= 100 records
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={smallData} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      // Should show save dialog
      await waitFor(() => {
        expect(mockShowSaveDialog).toHaveBeenCalledWith({
          defaultPath: expect.stringContaining('deepresearch_export_'),
          filters: [{ name: 'JSON Files', extensions: ['json'] }],
        })
      })

      // Should use writeJson for small datasets
      await waitFor(() => {
        expect(mockWriteJson).toHaveBeenCalledWith('/mock/path/export.json', smallData)
      })
    })

    it('should use streaming for large datasets (>100 records)', async () => {
      const user = userEvent.setup()
      const largeData = createMockCaptureDataArray(150) // > 100 records
      render(
        <ExportDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          data={largeData}
          exportFilters={{ archived: false }}
        />
      )

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      await waitFor(() => {
        expect(mockShowSaveDialog).toHaveBeenCalled()
      })

      // Should use writeJsonStream for large datasets
      await waitFor(() => {
        expect(mockWriteJsonStream).toHaveBeenCalledWith('/mock/path/export.json', { archived: false })
      })
    })

    it('should pass export filters to streaming export', async () => {
      const user = userEvent.setup()
      const largeData = createMockCaptureDataArray(150)
      const filters = { provider: 'claude', archived: false }

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={largeData} exportFilters={filters} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      await waitFor(() => {
        expect(mockWriteJsonStream).toHaveBeenCalledWith('/mock/path/export.json', filters)
      })
    })
  })

  describe('Export Functionality - CSV', () => {
    it('should trigger CSV export with correct parameters', async () => {
      const user = userEvent.setup()
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      // Select CSV format
      const csvRadio = screen.getByRole('radio', { name: /CSV/i })
      await user.click(csvRadio)

      // Click export
      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      // Should show save dialog with CSV filter
      await waitFor(() => {
        expect(mockShowSaveDialog).toHaveBeenCalledWith({
          defaultPath: expect.stringContaining('.csv'),
          filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        })
      })

      // Should call writeCsv
      await waitFor(() => {
        expect(mockWriteCsv).toHaveBeenCalledWith('/mock/path/export.json', undefined)
      })
    })

    it('should pass export filters to CSV export', async () => {
      const user = userEvent.setup()
      const filters = { provider: 'openai' }
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} exportFilters={filters} />)

      // Select CSV
      await user.click(screen.getByRole('radio', { name: /CSV/i }))

      // Export
      await user.click(screen.getByRole('button', { name: /Export/i }))

      await waitFor(() => {
        expect(mockWriteCsv).toHaveBeenCalledWith('/mock/path/export.json', filters)
      })
    })
  })

  describe('Export Progress and Status', () => {
    it('should show progress bar during export', async () => {
      const user = userEvent.setup()
      // Make the export take some time so we can see the progress state
      mockWriteJson.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, recordsExported: 5 }), 100)
          })
      )

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      // During export, should show progress
      await waitFor(() => {
        expect(screen.getByText(/Exporting 5 records/i)).toBeInTheDocument()
      })
    })

    it('should register progress listener during export', async () => {
      const user = userEvent.setup()
      // Make the export take some time
      mockWriteJson.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, recordsExported: 5 }), 100)
          })
      )

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      await waitFor(() => {
        expect(mockOnProgress).toHaveBeenCalled()
      })
    })

    it('should show success message after successful export', async () => {
      const user = userEvent.setup()
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/Successfully exported 5 records/i)).toBeInTheDocument()
      })
    })

    it('should auto-close dialog after successful export', async () => {
      const user = userEvent.setup()

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      // Wait for success message to appear
      await waitFor(() => {
        expect(screen.getByText(/Successfully exported/i)).toBeInTheDocument()
      })

      // Wait for auto-close to be called (component uses setTimeout(2000))
      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      }, { timeout: 3000 })
    })

    it('should update progress percentage when progress callback is invoked', async () => {
      const user = userEvent.setup()
      let progressCallback: ((progress: { processed: number; total: number; percentage: number }) => void) | null =
        null

      // Capture the progress callback
      mockOnProgress.mockImplementation((callback) => {
        progressCallback = callback
        return () => {}
      })

      // Make the export take some time so we can update progress
      mockWriteJson.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, recordsExported: 5 }), 200)
          })
      )

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      // Wait for export to start
      await waitFor(() => {
        expect(mockOnProgress).toHaveBeenCalled()
      })

      // Simulate progress update
      if (progressCallback) {
        progressCallback({ processed: 3, total: 5, percentage: 60 })
      }

      // Check that progress is displayed
      await waitFor(() => {
        expect(screen.getByText('60%')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error message when export validation fails', async () => {
      const user = userEvent.setup()
      // Empty data should fail validation
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={[]} />)

      // Force enable the button to test validation
      const exportButton = screen.getByRole('button', { name: /Export/i })

      // Button should be disabled
      expect(exportButton).toBeDisabled()
    })

    it('should show error message when data validation fails with invalid structure', async () => {
      const user = userEvent.setup()
      // Create invalid data (missing required fields)
      const invalidData = [
        {
          id: '',
          session_id: '',
          provider: '',
          prompt: 'test',
          response: 'test',
          timestamp: Date.now(),
          is_archived: 0,
        },
      ] as CaptureData[]

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={invalidData} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/Invalid data structure/i)).toBeInTheDocument()
      })
    })

    it('should show error when user cancels save dialog', async () => {
      const user = userEvent.setup()
      mockShowSaveDialog.mockResolvedValue({
        success: false,
        filePath: null,
        canceled: true,
      })

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      // Should not proceed with export
      await waitFor(() => {
        expect(mockWriteJson).not.toHaveBeenCalled()
      })

      // Status should return to idle
      expect(screen.queryByText(/Successfully exported/i)).not.toBeInTheDocument()
    })

    it('should show error message when export operation fails', async () => {
      const user = userEvent.setup()
      mockWriteJson.mockResolvedValue({
        success: false,
        error: 'Failed to write file',
      })

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/Failed to write file/i)).toBeInTheDocument()
      })
    })

    it('should handle unexpected errors during export', async () => {
      const user = userEvent.setup()
      mockWriteJson.mockRejectedValue(new Error('Unexpected error'))

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/Unexpected error/i)).toBeInTheDocument()
      })
    })

    it('should handle errors without error message', async () => {
      const user = userEvent.setup()
      mockWriteJson.mockRejectedValue('String error')

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      await waitFor(() => {
        expect(screen.getByText(/Unknown error occurred/i)).toBeInTheDocument()
      })
    })
  })

  describe('Dialog State Management', () => {
    it('should call onOpenChange when Cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      await user.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })

    it('should disable Cancel button during export', async () => {
      const user = userEvent.setup()
      // Make the export take some time but not too long
      mockWriteJson.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, recordsExported: 5 }), 200)
          })
      )

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      // Cancel button should be disabled during export
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /Cancel/i })
        expect(cancelButton).toBeDisabled()
      })
    })

    it('should disable Export button during export', async () => {
      const user = userEvent.setup()
      mockWriteJson.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, recordsExported: 5 }), 200)
          })
      )

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      // Export button should show "Exporting..." and be disabled
      await waitFor(() => {
        expect(screen.getByText(/Exporting\.\.\./i)).toBeInTheDocument()
      })

      const disabledButton = screen.getByRole('button', { name: /Exporting/i })
      expect(disabledButton).toBeDisabled()
    })

    it('should disable format selection during export', async () => {
      const user = userEvent.setup()
      mockWriteJson.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true, recordsExported: 5 }), 200)
          })
      )

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      // Format radio buttons should be disabled
      await waitFor(() => {
        const jsonRadio = screen.getByRole('radio', { name: /JSON/i })
        const csvRadio = screen.getByRole('radio', { name: /CSV/i })
        expect(jsonRadio).toBeDisabled()
        expect(csvRadio).toBeDisabled()
      })
    })

    it('should reset state when dialog closes', async () => {
      const { rerender } = render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      // Trigger some state changes (e.g., select CSV)
      const user = userEvent.setup()
      await user.click(screen.getByRole('radio', { name: /CSV/i }))

      // Verify CSV is selected
      expect(screen.getByRole('radio', { name: /CSV/i })).toBeChecked()

      // Close the dialog
      rerender(<ExportDialog open={false} onOpenChange={mockOnOpenChange} data={mockData} />)

      // Wait for the reset timeout (component uses setTimeout 200ms)
      await new Promise(resolve => setTimeout(resolve, 250))

      // Reopen the dialog
      rerender(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      // Should be reset to JSON
      await waitFor(() => {
        const jsonRadio = screen.getByRole('radio', { name: /JSON/i })
        expect(jsonRadio).toBeChecked()
      })
    })
  })

  describe('File Naming', () => {
    it('should generate filename with timestamp and record count', async () => {
      const user = userEvent.setup()
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      const exportButton = screen.getByRole('button', { name: /Export/i })
      await user.click(exportButton)

      await waitFor(() => {
        expect(mockShowSaveDialog).toHaveBeenCalledWith({
          defaultPath: expect.stringMatching(/deepresearch_export_\d{4}-\d{2}-\d{2}_\d{6}_5records\.json/),
          filters: expect.any(Array),
        })
      })
    })

    it('should use correct file extension for CSV format', async () => {
      const user = userEvent.setup()
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      // Select CSV
      await user.click(screen.getByRole('radio', { name: /CSV/i }))

      // Export
      await user.click(screen.getByRole('button', { name: /Export/i }))

      await waitFor(() => {
        expect(mockShowSaveDialog).toHaveBeenCalledWith({
          defaultPath: expect.stringContaining('.csv'),
          filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        })
      })
    })
  })

  describe('IPC Communication', () => {
    it('should call showSaveDialog with correct options for JSON', async () => {
      const user = userEvent.setup()
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      await user.click(screen.getByRole('button', { name: /Export/i }))

      await waitFor(() => {
        expect(mockShowSaveDialog).toHaveBeenCalledWith({
          defaultPath: expect.stringContaining('.json'),
          filters: [{ name: 'JSON Files', extensions: ['json'] }],
        })
      })
    })

    it('should call showSaveDialog with correct options for CSV', async () => {
      const user = userEvent.setup()
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      await user.click(screen.getByRole('radio', { name: /CSV/i }))
      await user.click(screen.getByRole('button', { name: /Export/i }))

      await waitFor(() => {
        expect(mockShowSaveDialog).toHaveBeenCalledWith({
          defaultPath: expect.stringContaining('.csv'),
          filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        })
      })
    })

    it('should cleanup progress listener after export completes', async () => {
      const user = userEvent.setup()
      const cleanupFn = vi.fn()
      mockOnProgress.mockReturnValue(cleanupFn)

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      await user.click(screen.getByRole('button', { name: /Export/i }))

      // Wait for export to complete
      await waitFor(() => {
        expect(screen.getByText(/Successfully exported/i)).toBeInTheDocument()
      })

      // Cleanup function should have been called
      expect(cleanupFn).toHaveBeenCalled()
    })

    it('should cleanup progress listener even when export fails', async () => {
      const user = userEvent.setup()
      const cleanupFn = vi.fn()
      mockOnProgress.mockReturnValue(cleanupFn)
      mockWriteJson.mockResolvedValue({
        success: false,
        error: 'Export failed',
      })

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      await user.click(screen.getByRole('button', { name: /Export/i }))

      await waitFor(() => {
        expect(screen.getByText(/Export failed/i)).toBeInTheDocument()
      })

      expect(cleanupFn).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large datasets', async () => {
      const user = userEvent.setup()
      const largeData = createMockCaptureDataArray(10000)
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={largeData} />)

      // The DialogDescription shows the number without formatting in the template literal
      expect(screen.getByText(/Export 10000 research captures/i)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /Export/i }))

      // Should use streaming for large datasets
      await waitFor(() => {
        expect(mockWriteJsonStream).toHaveBeenCalled()
      })
    })

    it('should format large numbers with locale string', () => {
      const largeData = createMockCaptureDataArray(1500)
      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={largeData} />)

      // Should display with comma separator
      expect(screen.getByText('1,500')).toBeInTheDocument()
    })

    it('should handle missing filePath in dialog result', async () => {
      const user = userEvent.setup()
      mockShowSaveDialog.mockResolvedValue({
        success: true,
        filePath: null,
        canceled: false,
      })

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      await user.click(screen.getByRole('button', { name: /Export/i }))

      // Should not proceed with export when filePath is missing
      await waitFor(() => {
        expect(mockWriteJson).not.toHaveBeenCalled()
      })
    })

    it('should handle result without recordsExported', async () => {
      const user = userEvent.setup()
      mockWriteJson.mockResolvedValue({
        success: true,
        // No recordsExported field
      })

      render(<ExportDialog open={true} onOpenChange={mockOnOpenChange} data={mockData} />)

      await user.click(screen.getByRole('button', { name: /Export/i }))

      // Should use data.length as fallback
      await waitFor(() => {
        expect(screen.getByText(/Successfully exported 5 records/i)).toBeInTheDocument()
      })
    })
  })
})
