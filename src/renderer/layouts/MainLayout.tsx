export function MainLayout() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <h1 className="text-lg font-semibold">DeepResearch - Prototype</h1>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-100">
            Prototype Mode
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r bg-muted/30 p-4">
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Sessions</h3>
              <p className="text-xs text-muted-foreground">
                AI provider sessions will appear here
              </p>
            </div>

            <div className="space-y-2">
              <div className="rounded-lg border bg-background p-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium">Claude (Demo)</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Ready</p>
              </div>

              <div className="rounded-lg border bg-background p-3 opacity-50">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">ChatGPT</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Not configured</p>
              </div>

              <div className="rounded-lg border bg-background p-3 opacity-50">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  <span className="text-sm font-medium">Gemini</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Not configured</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold">Welcome to DeepResearch</h2>
                <p className="mt-2 text-muted-foreground">
                  Multi-Provider AI Response Capture & Enrichment Tool
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="mb-2 font-semibold">✅ Project Status</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✓ Electron + React + TypeScript configured</li>
                    <li>✓ Build system working</li>
                    <li>✓ UI components ready</li>
                    <li>✓ 837 dependencies installed</li>
                  </ul>
                </div>

                <div className="rounded-lg border bg-card p-6">
                  <h3 className="mb-2 font-semibold">🚧 Next Steps</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Implement better-auth with Google OAuth</li>
                    <li>• Add session management</li>
                    <li>• Build response interceptor</li>
                    <li>• Set up DuckDB database</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-3 font-semibold">Architecture Overview</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Frontend:</strong> React 18 + TypeScript + Tailwind CSS + shadcn/ui
                  </p>
                  <p>
                    <strong>Desktop:</strong> Electron 28 with secure IPC
                  </p>
                  <p>
                    <strong>State:</strong> Zustand for global state management
                  </p>
                  <p>
                    <strong>Database:</strong> DuckDB (analytics) + SQLite (vector search)
                  </p>
                  <p>
                    <strong>Auth:</strong> better-auth 1.3.28 with Google OAuth (pending)
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950">
                <h3 className="mb-2 font-semibold text-amber-900 dark:text-amber-100">
                  ⚡ Prototype Mode Active
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Authentication is bypassed for rapid prototyping. The app is running in
                  development mode without user authentication or session persistence.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t bg-muted/30 px-6 py-3">
            <p className="text-xs text-muted-foreground">
              DeepResearch v0.1.0 - Prototype Build
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
