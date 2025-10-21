import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog'
import { Button } from '@/renderer/components/ui/button'
import { Label } from '@/renderer/components/ui/label'
import { Switch } from '@/renderer/components/ui/switch'
import { Input } from '@/renderer/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select'
import { ScrollArea } from '@/renderer/components/ui/scroll-area'
import { useSettingsStore } from '@/renderer/stores/settingsStore'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const {
    settings,
    updateGeneralSettings,
    updateUISettings,
    updateExportSettings,
    updateCaptureSettings,
    updateDatabaseSettings,
    updateAdvancedSettings,
    resetSettings,
    resetSection,
  } = useSettingsStore()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure DeepResearch application preferences
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-8">
            {/* General Settings */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">General</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetSection('general')}
                >
                  Reset
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-save" className="flex-1">
                    Auto Save
                    <p className="text-xs text-muted-foreground">
                      Automatically save changes
                    </p>
                  </Label>
                  <Switch
                    id="auto-save"
                    checked={settings.general.autoSave}
                    onCheckedChange={(checked) =>
                      updateGeneralSettings({ autoSave: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="save-interval">
                    Save Interval (seconds)
                  </Label>
                  <Input
                    id="save-interval"
                    type="number"
                    min="5"
                    max="300"
                    value={settings.general.saveInterval}
                    onChange={(e) =>
                      updateGeneralSettings({
                        saveInterval: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-notifications" className="flex-1">
                    Enable Notifications
                    <p className="text-xs text-muted-foreground">
                      Show system notifications
                    </p>
                  </Label>
                  <Switch
                    id="enable-notifications"
                    checked={settings.general.enableNotifications}
                    onCheckedChange={(checked) =>
                      updateGeneralSettings({ enableNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="start-minimized" className="flex-1">
                    Start Minimized
                    <p className="text-xs text-muted-foreground">
                      Start app in system tray
                    </p>
                  </Label>
                  <Switch
                    id="start-minimized"
                    checked={settings.general.startMinimized}
                    onCheckedChange={(checked) =>
                      updateGeneralSettings({ startMinimized: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="close-to-tray" className="flex-1">
                    Close to Tray
                    <p className="text-xs text-muted-foreground">
                      Minimize to tray instead of closing
                    </p>
                  </Label>
                  <Switch
                    id="close-to-tray"
                    checked={settings.general.closeToTray}
                    onCheckedChange={(checked) =>
                      updateGeneralSettings({ closeToTray: checked })
                    }
                  />
                </div>
              </div>
            </section>

            {/* UI Preferences */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">UI Preferences</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetSection('ui')}
                >
                  Reset
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={settings.ui.theme}
                    onValueChange={(value: 'light' | 'dark' | 'system') =>
                      updateUISettings({ theme: value })
                    }
                  >
                    <SelectTrigger id="theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-size">Font Size</Label>
                  <Select
                    value={settings.ui.fontSize}
                    onValueChange={(value: 'small' | 'medium' | 'large') =>
                      updateUISettings({ fontSize: value })
                    }
                  >
                    <SelectTrigger id="font-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sidebar-position">Sidebar Position</Label>
                  <Select
                    value={settings.ui.sidebarPosition}
                    onValueChange={(value: 'left' | 'right') =>
                      updateUISettings({ sidebarPosition: value })
                    }
                  >
                    <SelectTrigger id="sidebar-position">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="compact-mode" className="flex-1">
                    Compact Mode
                    <p className="text-xs text-muted-foreground">
                      Use compact UI layout
                    </p>
                  </Label>
                  <Switch
                    id="compact-mode"
                    checked={settings.ui.compactMode}
                    onCheckedChange={(checked) =>
                      updateUISettings({ compactMode: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-timestamps" className="flex-1">
                    Show Timestamps
                    <p className="text-xs text-muted-foreground">
                      Display timestamps in UI
                    </p>
                  </Label>
                  <Switch
                    id="show-timestamps"
                    checked={settings.ui.showTimestamps}
                    onCheckedChange={(checked) =>
                      updateUISettings({ showTimestamps: checked })
                    }
                  />
                </div>
              </div>
            </section>

            {/* Export Settings */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Export</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetSection('export')}
                >
                  Reset
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-format">Default Format</Label>
                  <Select
                    value={settings.export.defaultFormat}
                    onValueChange={(
                      value: 'json' | 'markdown' | 'csv' | 'html'
                    ) => updateExportSettings({ defaultFormat: value })}
                  >
                    <SelectTrigger id="default-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="markdown">Markdown</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="export-path">Export Path</Label>
                  <Input
                    id="export-path"
                    type="text"
                    placeholder="/path/to/exports"
                    value={settings.export.exportPath}
                    onChange={(e) =>
                      updateExportSettings({ exportPath: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-metadata" className="flex-1">
                    Include Metadata
                    <p className="text-xs text-muted-foreground">
                      Include metadata in exports
                    </p>
                  </Label>
                  <Switch
                    id="include-metadata"
                    checked={settings.export.includeMetadata}
                    onCheckedChange={(checked) =>
                      updateExportSettings({ includeMetadata: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-attachments" className="flex-1">
                    Include Attachments
                    <p className="text-xs text-muted-foreground">
                      Include attachments in exports
                    </p>
                  </Label>
                  <Switch
                    id="include-attachments"
                    checked={settings.export.includeAttachments}
                    onCheckedChange={(checked) =>
                      updateExportSettings({ includeAttachments: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-export" className="flex-1">
                    Auto Export on Capture
                    <p className="text-xs text-muted-foreground">
                      Automatically export after capture
                    </p>
                  </Label>
                  <Switch
                    id="auto-export"
                    checked={settings.export.autoExportOnCapture}
                    onCheckedChange={(checked) =>
                      updateExportSettings({ autoExportOnCapture: checked })
                    }
                  />
                </div>
              </div>
            </section>

            {/* Capture Settings */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Capture</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetSection('capture')}
                >
                  Reset
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-capture" className="flex-1">
                    Auto Capture
                    <p className="text-xs text-muted-foreground">
                      Automatically capture responses
                    </p>
                  </Label>
                  <Switch
                    id="auto-capture"
                    checked={settings.capture.autoCapture}
                    onCheckedChange={(checked) =>
                      updateCaptureSettings({ autoCapture: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capture-delay">
                    Capture Delay (milliseconds)
                  </Label>
                  <Input
                    id="capture-delay"
                    type="number"
                    min="0"
                    max="5000"
                    value={settings.capture.captureDelay}
                    onChange={(e) =>
                      updateCaptureSettings({
                        captureDelay: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-retries">Max Retries</Label>
                  <Input
                    id="max-retries"
                    type="number"
                    min="0"
                    max="10"
                    value={settings.capture.maxRetries}
                    onChange={(e) =>
                      updateCaptureSettings({
                        maxRetries: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-screenshots" className="flex-1">
                    Enable Screenshots
                    <p className="text-xs text-muted-foreground">
                      Capture screenshots with responses
                    </p>
                  </Label>
                  <Switch
                    id="enable-screenshots"
                    checked={settings.capture.enableScreenshots}
                    onCheckedChange={(checked) =>
                      updateCaptureSettings({ enableScreenshots: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="screenshot-quality">
                    Screenshot Quality (0-100)
                  </Label>
                  <Input
                    id="screenshot-quality"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.capture.screenshotQuality}
                    onChange={(e) =>
                      updateCaptureSettings({
                        screenshotQuality: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Enabled Providers</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="provider-chatgpt" className="flex-1">
                        ChatGPT
                      </Label>
                      <Switch
                        id="provider-chatgpt"
                        checked={settings.capture.captureProviders.chatgpt}
                        onCheckedChange={(checked) =>
                          updateCaptureSettings({
                            captureProviders: {
                              ...settings.capture.captureProviders,
                              chatgpt: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="provider-claude" className="flex-1">
                        Claude
                      </Label>
                      <Switch
                        id="provider-claude"
                        checked={settings.capture.captureProviders.claude}
                        onCheckedChange={(checked) =>
                          updateCaptureSettings({
                            captureProviders: {
                              ...settings.capture.captureProviders,
                              claude: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="provider-gemini" className="flex-1">
                        Gemini
                      </Label>
                      <Switch
                        id="provider-gemini"
                        checked={settings.capture.captureProviders.gemini}
                        onCheckedChange={(checked) =>
                          updateCaptureSettings({
                            captureProviders: {
                              ...settings.capture.captureProviders,
                              gemini: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="provider-perplexity" className="flex-1">
                        Perplexity
                      </Label>
                      <Switch
                        id="provider-perplexity"
                        checked={settings.capture.captureProviders.perplexity}
                        onCheckedChange={(checked) =>
                          updateCaptureSettings({
                            captureProviders: {
                              ...settings.capture.captureProviders,
                              perplexity: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="provider-custom" className="flex-1">
                        Custom
                      </Label>
                      <Switch
                        id="provider-custom"
                        checked={settings.capture.captureProviders.custom}
                        onCheckedChange={(checked) =>
                          updateCaptureSettings({
                            captureProviders: {
                              ...settings.capture.captureProviders,
                              custom: checked,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Database Settings */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Database</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetSection('database')}
                >
                  Reset
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-backup" className="flex-1">
                    Auto Backup
                    <p className="text-xs text-muted-foreground">
                      Automatically backup database
                    </p>
                  </Label>
                  <Switch
                    id="auto-backup"
                    checked={settings.database.autoBackup}
                    onCheckedChange={(checked) =>
                      updateDatabaseSettings({ autoBackup: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup-interval">
                    Backup Interval (hours)
                  </Label>
                  <Input
                    id="backup-interval"
                    type="number"
                    min="1"
                    max="168"
                    value={settings.database.backupInterval}
                    onChange={(e) =>
                      updateDatabaseSettings({
                        backupInterval: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup-retention">
                    Backup Retention (days)
                  </Label>
                  <Input
                    id="backup-retention"
                    type="number"
                    min="1"
                    max="365"
                    value={settings.database.backupRetention}
                    onChange={(e) =>
                      updateDatabaseSettings({
                        backupRetention: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-backup-size">Max Backup Size (MB)</Label>
                  <Input
                    id="max-backup-size"
                    type="number"
                    min="10"
                    max="1000"
                    value={settings.database.maxBackupSize}
                    onChange={(e) =>
                      updateDatabaseSettings({
                        maxBackupSize: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup-path">Backup Path</Label>
                  <Input
                    id="backup-path"
                    type="text"
                    placeholder="/path/to/backups"
                    value={settings.database.backupPath}
                    onChange={(e) =>
                      updateDatabaseSettings({ backupPath: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-compression" className="flex-1">
                    Enable Compression
                    <p className="text-xs text-muted-foreground">
                      Compress backup files
                    </p>
                  </Label>
                  <Switch
                    id="enable-compression"
                    checked={settings.database.enableCompression}
                    onCheckedChange={(checked) =>
                      updateDatabaseSettings({ enableCompression: checked })
                    }
                  />
                </div>
              </div>
            </section>

            {/* Advanced Settings */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Advanced</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetSection('advanced')}
                >
                  Reset
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-logging" className="flex-1">
                    Enable Logging
                    <p className="text-xs text-muted-foreground">
                      Enable application logging
                    </p>
                  </Label>
                  <Switch
                    id="enable-logging"
                    checked={settings.advanced.enableLogging}
                    onCheckedChange={(checked) =>
                      updateAdvancedSettings({ enableLogging: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="log-level">Log Level</Label>
                  <Select
                    value={settings.advanced.logLevel}
                    onValueChange={(
                      value: 'error' | 'warn' | 'info' | 'debug'
                    ) => updateAdvancedSettings({ logLevel: value })}
                  >
                    <SelectTrigger id="log-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-log-size">Max Log Size (MB)</Label>
                  <Input
                    id="max-log-size"
                    type="number"
                    min="10"
                    max="500"
                    value={settings.advanced.maxLogSize}
                    onChange={(e) =>
                      updateAdvancedSettings({
                        maxLogSize: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-analytics" className="flex-1">
                    Enable Analytics
                    <p className="text-xs text-muted-foreground">
                      Send anonymous usage data
                    </p>
                  </Label>
                  <Switch
                    id="enable-analytics"
                    checked={settings.advanced.enableAnalytics}
                    onCheckedChange={(checked) =>
                      updateAdvancedSettings({ enableAnalytics: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="check-for-updates" className="flex-1">
                    Check for Updates
                    <p className="text-xs text-muted-foreground">
                      Automatically check for updates
                    </p>
                  </Label>
                  <Switch
                    id="check-for-updates"
                    checked={settings.advanced.checkForUpdates}
                    onCheckedChange={(checked) =>
                      updateAdvancedSettings({ checkForUpdates: checked })
                    }
                  />
                </div>
              </div>
            </section>

            {/* Reset All Settings */}
            <section className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Reset All Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Restore all settings to their default values
                  </p>
                </div>
                <Button variant="destructive" onClick={resetSettings}>
                  Reset All
                </Button>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
