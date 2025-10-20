import { SessionTabs } from '../session/SessionTabs'

export function ProviderTabsPanel() {
  return (
    <main className="flex h-full flex-col overflow-hidden">
      {/* Session Tabs */}
      <SessionTabs />

      {/* Footer */}
      <div className="border-t bg-muted/30 px-6 py-3">
        <p className="text-xs text-muted-foreground">
          DeepResearch v0.1.0 - Session Management Active
        </p>
      </div>
    </main>
  )
}
