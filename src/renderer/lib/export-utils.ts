/**
 * Export Utilities
 * Helper functions for exporting research data
 */

import { format as formatDate } from 'date-fns'

export interface CaptureData {
  id: string
  session_id: string
  provider: string
  prompt: string
  response: string
  response_format?: string
  model?: string
  timestamp: number
  token_count?: number
  tags?: string
  notes?: string
  is_archived: number
}

export type ExportFormat = 'json' | 'csv'

/**
 * Convert captures to JSON format
 */
export function convertToJSON(captures: CaptureData[]): string {
  return JSON.stringify(captures, null, 2)
}

/**
 * Escape CSV field
 */
function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return ''
  const str = String(field)
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Convert captures to CSV format
 */
export function convertToCSV(captures: CaptureData[]): string {
  if (captures.length === 0) {
    return ''
  }

  // Define headers
  const headers = [
    'id',
    'session_id',
    'provider',
    'prompt',
    'response',
    'response_format',
    'model',
    'timestamp',
    'token_count',
    'tags',
    'notes',
    'is_archived'
  ]

  // Create header row
  const headerRow = headers.join(',')

  // Create data rows
  const dataRows = captures.map(capture => {
    return [
      escapeCsvField(capture.id),
      escapeCsvField(capture.session_id),
      escapeCsvField(capture.provider),
      escapeCsvField(capture.prompt),
      escapeCsvField(capture.response),
      escapeCsvField(capture.response_format),
      escapeCsvField(capture.model),
      escapeCsvField(capture.timestamp),
      escapeCsvField(capture.token_count),
      escapeCsvField(capture.tags),
      escapeCsvField(capture.notes),
      escapeCsvField(capture.is_archived)
    ].join(',')
  })

  return [headerRow, ...dataRows].join('\n')
}

/**
 * Get default file name based on export format and current date
 */
export function getDefaultFileName(exportFormat: ExportFormat, recordCount?: number): string {
  const timestamp = formatDate(new Date(), 'yyyy-MM-dd_HHmmss')
  const countSuffix = recordCount ? `_${recordCount}records` : ''
  return `deepresearch_export_${timestamp}${countSuffix}.${exportFormat}`
}

/**
 * Estimate file size in bytes
 * This is a rough estimation for UI display
 */
export function estimateFileSize(captures: CaptureData[], format: ExportFormat): number {
  if (captures.length === 0) return 0

  // Sample size: use first 10 records or all if less
  const sampleSize = Math.min(10, captures.length)
  const sample = captures.slice(0, sampleSize)

  let sampleBytes = 0

  if (format === 'json') {
    const sampleJson = JSON.stringify(sample, null, 2)
    sampleBytes = new Blob([sampleJson]).size
  } else {
    const sampleCsv = convertToCSV(sample)
    sampleBytes = new Blob([sampleCsv]).size
  }

  // Extrapolate to full dataset
  const averageBytesPerRecord = sampleBytes / sampleSize
  const estimatedTotal = averageBytesPerRecord * captures.length

  return Math.round(estimatedTotal)
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Validate export data
 */
export function validateExportData(captures: CaptureData[]): {
  valid: boolean
  error?: string
} {
  if (!Array.isArray(captures)) {
    return { valid: false, error: 'Data must be an array' }
  }

  if (captures.length === 0) {
    return { valid: false, error: 'No data to export' }
  }

  // Check if at least one capture has required fields
  const firstCapture = captures[0]
  if (!firstCapture.id || !firstCapture.session_id || !firstCapture.provider) {
    return { valid: false, error: 'Invalid data structure' }
  }

  return { valid: true }
}

/**
 * Get file extension from format
 */
export function getFileExtension(format: ExportFormat): string {
  return format === 'json' ? 'json' : 'csv'
}

/**
 * Get MIME type from format
 */
export function getMimeType(format: ExportFormat): string {
  return format === 'json' ? 'application/json' : 'text/csv'
}
