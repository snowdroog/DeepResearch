import { useEffect, useRef } from 'react'

/**
 * Custom hook to sync WebContentsView bounds with a container element
 *
 * This hook uses ResizeObserver to track container size changes and
 * updates the corresponding WebContentsView bounds via IPC.
 *
 * @param sessionId - The ID of the session whose view bounds should be updated
 * @param isActive - Whether this session is currently active
 */
export function useWebContentsViewBounds(sessionId: string | null, isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sessionId || !isActive) return

    const container = containerRef.current
    if (!container) return

    console.log(`[useWebContentsViewBounds] Setting up observer for session ${sessionId}`)

    const updateBounds = () => {
      const rect = container.getBoundingClientRect()

      // Calculate bounds relative to the window
      const bounds = {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      }

      console.log(`[useWebContentsViewBounds] Updating bounds for session ${sessionId}`, bounds)

      // Update view bounds via IPC
      window.electronAPI.views
        .updateBounds(sessionId, bounds)
        .then((result) => {
          if (!result.success) {
            console.error(`[useWebContentsViewBounds] Failed to update bounds:`, result.error)
          }
        })
        .catch((error) => {
          console.error(`[useWebContentsViewBounds] Error updating bounds:`, error)
        })
    }

    // Initial bounds update
    updateBounds()

    // Create ResizeObserver to track container size changes
    const resizeObserver = new ResizeObserver(() => {
      updateBounds()
    })

    resizeObserver.observe(container)

    // Also listen for window resize events
    window.addEventListener('resize', updateBounds)

    // Cleanup
    return () => {
      console.log(`[useWebContentsViewBounds] Cleaning up observer for session ${sessionId}`)
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateBounds)
    }
  }, [sessionId, isActive])

  return containerRef
}
