import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface DataPanelProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function DataPanel({ isCollapsed, onToggleCollapse }: DataPanelProps) {
  return (
    <div className="flex h-full flex-col border-l bg-muted/30">
      {/* Data Panel Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Captured Research</h3>
        <button
          onClick={onToggleCollapse}
          className="rounded-md p-1 hover:bg-accent transition-colors"
          title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {isCollapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="border-b px-4 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search responses..."
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Data Panel Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Captured AI responses will appear here
            </p>
            <div className="mt-3 space-y-2">
              {/* Demo Response Items */}
              {[1, 2, 3].map((i) => (
                <button
                  key={i}
                  className="w-full rounded border bg-background p-2 text-xs hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Response #{i}</span>
                    <span className="text-muted-foreground">{i * 2}m ago</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Demo captured response from AI provider...
                  </p>
                  <div className="mt-2 flex gap-1">
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                      Claude
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> Resize panels by dragging the dividers. Your layout will be
              saved automatically.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h4 className="text-sm font-semibold mb-2">Stats</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Total Responses:</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span>This Session:</span>
                <span className="font-medium">1</span>
              </div>
              <div className="flex justify-between">
                <span>Active Providers:</span>
                <span className="font-medium">1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
