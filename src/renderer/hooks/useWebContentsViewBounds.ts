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
      // Use requestAnimationFrame for smooth updates
      requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect()

        // Skip if container has no dimensions (might be hidden)
        if (rect.width === 0 || rect.height === 0) {
          console.log(`[useWebContentsViewBounds] Skipping update - container has no dimensions`)
          return
        }

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
      })
    }

    // Initial bounds update with a small delay to ensure DOM is ready
    const initialTimeout = setTimeout(() => {
      updateBounds()
    }, 50)

    // Create ResizeObserver to track container size changes
    const resizeObserver = new ResizeObserver(() => {
      updateBounds()
    })

    resizeObserver.observe(container)

    // Also listen for window resize events (for maximize/restore)
    const handleWindowResize = () => {
      // Small delay to let the DOM settle after maximize/restore
      setTimeout(() => {
        updateBounds()
      }, 100)
    }

    window.addEventListener('resize', handleWindowResize)

    // Cleanup
    return () => {
      console.log(`[useWebContentsViewBounds] Cleaning up observer for session ${sessionId}`)
      clearTimeout(initialTimeout)
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleWindowResize)
    }
  }, [sessionId, isActive])

  return containerRef
}
