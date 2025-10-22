import { useEffect } from 'react'
import { Settings, Download } from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { SessionListPanel } from '../components/panels/SessionListPanel'
import { ProviderTabsPanel } from '../components/panels/ProviderTabsPanel'
import { DataPanel } from '../components/panels/DataPanel'
import { SettingsDialog } from '../components/settings/SettingsDialog'
import { ExportDialog } from '../components/export/ExportDialog'
import { Button } from '../components/ui/button'
import { useCapturesStore } from '../stores/capturesStore'
import { useUIStore } from '../stores/uiStore'
import { useSessionStore } from '../stores/sessionStore'

export function MainLayout() {
  const { captures, fetchCaptures } = useCapturesStore()
  const { dialogs, setDialogOpen, panels, setPanelCollapsed } = useUIStore()
  const { activeSessionId, loadSessions } = useSessionStore()

  const isDataPanelCollapsed = panels.isDataPanelCollapsed
  const showExport = dialogs.export
  const showSettings = dialogs.settings

  // Load sessions from database on mount
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Load captures when export dialog is opened
  useEffect(() => {
    if (showExport) {
      fetchCaptures() // Get all captures including archived
    }
  }, [showExport, fetchCaptures])

  // Hide/show active WebContentsView when any dialog opens/closes
  // This prevents dialogs from appearing behind the native Electron view
  useEffect(() => {
    if (!activeSessionId) return

    const anyDialogOpen = showExport || showSettings

    if (anyDialogOpen) {
      // Hide the view when a dialog opens
      window.electronAPI.views.setVisible(activeSessionId, false)
    } else {
      // Show the view when all dialogs are closed
      window.electronAPI.views.setVisible(activeSessionId, true)
    }
  }, [activeSessionId, showExport, showSettings])

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-6">
        <h1 className="text-lg font-semibold">DeepResearch - Prototype</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDialogOpen('export', true)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDialogOpen('settings', true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-100">
            Prototype Mode
          </span>
        </div>
      </header>

      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettings}
        onOpenChange={(open: boolean) => setDialogOpen('settings', open)}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={showExport}
        onOpenChange={(open: boolean) => setDialogOpen('export', open)}
        data={captures}
      />

      {/* Resizable Panel Layout */}
      <PanelGroup
        direction="horizontal"
        className="flex-1"
        autoSaveId="deepresearch-panels"
      >
        {/* Sidebar Panel - Session List */}
        <Panel defaultSize={20} minSize={15} maxSize={30} className="relative">
          <SessionListPanel />
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

        {/* Main Panel - Provider Tabs/BrowserViews */}
        <Panel defaultSize={50} minSize={30} className="relative">
          <ProviderTabsPanel />
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

        {/* Data Panel - Captured Research */}
        <Panel
          defaultSize={30}
          minSize={20}
          maxSize={50}
          collapsible={true}
          onCollapse={() => setPanelCollapsed('data', true)}
          onExpand={() => setPanelCollapsed('data', false)}
          className="relative"
        >
          <DataPanel
            isCollapsed={isDataPanelCollapsed}
            onToggleCollapse={() => setPanelCollapsed('data', !isDataPanelCollapsed)}
          />
        </Panel>
      </PanelGroup>
    </div>
  )
}
