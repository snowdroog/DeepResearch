import { useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { SessionListPanel } from '../components/panels/SessionListPanel'
import { ProviderTabsPanel } from '../components/panels/ProviderTabsPanel'
import { DataPanel } from '../components/panels/DataPanel'

export function MainLayout() {
  const [isDataPanelCollapsed, setIsDataPanelCollapsed] = useState(false)

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-6">
        <h1 className="text-lg font-semibold">DeepResearch - Prototype</h1>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-100">
            Prototype Mode
          </span>
        </div>
      </header>

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
          onCollapse={() => setIsDataPanelCollapsed(true)}
          onExpand={() => setIsDataPanelCollapsed(false)}
          className="relative"
        >
          <DataPanel
            isCollapsed={isDataPanelCollapsed}
            onToggleCollapse={() => setIsDataPanelCollapsed(!isDataPanelCollapsed)}
          />
        </Panel>
      </PanelGroup>
    </div>
  )
}
