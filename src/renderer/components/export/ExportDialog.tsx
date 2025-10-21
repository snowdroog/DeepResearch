/**
 * ExportDialog Component
 * Dialog for exporting research data to JSON or CSV
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog'
import { Button } from '@/renderer/components/ui/button'
import { Label } from '@/renderer/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/renderer/components/ui/radio-group'
import { Progress } from '@/renderer/components/ui/progress'
import { Download, FileJson, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  type CaptureData,
  type ExportFormat,
  getDefaultFileName,
  estimateFileSize,
  formatBytes,
  validateExportData,
} from '@/renderer/lib/export-utils'

export interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: CaptureData[]
  exportFilters?: Record<string, unknown>
}

export function ExportDialog({ open, onOpenChange, data, exportFilters }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('json')
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [exportedRecords, setExportedRecords] = useState<number>(0)

  // Estimate file size
  const estimatedSize = estimateFileSize(data, format)
  const formattedSize = formatBytes(estimatedSize)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      // Reset after a delay to avoid visual glitches during close animation
      setTimeout(() => {
        setFormat('json')
        setIsExporting(false)
        setProgress(0)
        setExportStatus('idle')
        setErrorMessage('')
        setExportedRecords(0)
      }, 200)
    }
  }, [open])

  const handleExport = async () => {
    // Validate data
    const validation = validateExportData(data)
    if (!validation.valid) {
      setExportStatus('error')
      setErrorMessage(validation.error || 'Invalid data')
      return
    }

    try {
      setIsExporting(true)
      setExportStatus('exporting')
      setProgress(0)
      setErrorMessage('')

      // Get file path from user
      const defaultFileName = getDefaultFileName(format, data.length)
      const fileFilters =
        format === 'json'
          ? [{ name: 'JSON Files', extensions: ['json'] }]
          : [{ name: 'CSV Files', extensions: ['csv'] }]

      const dialogResult = await window.electronAPI.export.showSaveDialog({
        defaultPath: defaultFileName,
        filters: fileFilters,
      })

      if (!dialogResult.success || !dialogResult.filePath || dialogResult.canceled) {
        setIsExporting(false)
        setExportStatus('idle')
        return
      }

      const filePath = dialogResult.filePath

      // Set up progress listener
      const removeProgressListener = window.electronAPI.export.onProgress((progressData) => {
        setProgress(progressData.percentage)
      })

      // Export data
      let result: { success: boolean; recordsExported?: number; error?: string }

      if (format === 'json') {
        // Use streaming for large datasets
        if (data.length > 100) {
          result = await window.electronAPI.export.writeJsonStream(filePath, exportFilters)
        } else {
          // Use simple write for small datasets
          result = await window.electronAPI.export.writeJson(filePath, data)
          if (result.success) {
            result.recordsExported = data.length
          }
        }
      } else {
        result = await window.electronAPI.export.writeCsv(filePath, exportFilters)
      }

      // Clean up progress listener
      removeProgressListener()

      if (result.success) {
        setExportStatus('success')
        setExportedRecords(result.recordsExported || data.length)
        setProgress(100)

        // Auto-close dialog after success
        setTimeout(() => {
          onOpenChange(false)
        }, 2000)
      } else {
        setExportStatus('error')
        setErrorMessage(result.error || 'Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      setExportStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred')
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusIcon = () => {
    switch (exportStatus) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    switch (exportStatus) {
      case 'exporting':
        return `Exporting ${data.length} records...`
      case 'success':
        return `Successfully exported ${exportedRecords} records!`
      case 'error':
        return errorMessage || 'Export failed'
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Research Data</DialogTitle>
          <DialogDescription>
            Export {data.length} research capture{data.length !== 1 ? 's' : ''} to a file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(value: string) => setFormat(value as ExportFormat)} disabled={isExporting}>
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent transition-colors">
                <RadioGroupItem value="json" id="format-json" />
                <Label htmlFor="format-json" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileJson className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">JSON</div>
                      <div className="text-sm text-muted-foreground">Structured data format, best for re-importing</div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent transition-colors">
                <RadioGroupItem value="csv" id="format-csv" />
                <Label htmlFor="format-csv" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium">CSV</div>
                      <div className="text-sm text-muted-foreground">Spreadsheet format, best for Excel/Sheets</div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* File Info */}
          <div className="space-y-2 rounded-lg bg-muted p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Records:</span>
              <span className="font-medium">{data.length.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated size:</span>
              <span className="font-medium">{formattedSize}</span>
            </div>
          </div>

          {/* Progress Bar */}
          {exportStatus === 'exporting' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Status Message */}
          {getStatusMessage() && (
            <div
              className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                exportStatus === 'success'
                  ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                  : exportStatus === 'error'
                    ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              }`}
            >
              {getStatusIcon()}
              <span>{getStatusMessage()}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || data.length === 0}>
            {isExporting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
