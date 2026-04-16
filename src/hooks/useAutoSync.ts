import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { isSignedIn } from '../utils/googleDrive'

const DEBOUNCE_MS = 3000
const SYNC_INTERVAL_MS = 60000

export function useAutoSync(isLoggedIn: boolean) {
  const { categories, tasks, syncToDrive, syncFromDrive, isSyncing } = useStore()
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastDataHash = useRef<string>('')
  const isInitialSync = useRef(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getDataHash = () => JSON.stringify({ categories, tasks })

  useEffect(() => {
    if (!isLoggedIn || !isSignedIn()) return

    if (isInitialSync.current) {
      isInitialSync.current = false
      syncFromDrive()
        .then(() => {
          lastDataHash.current = getDataHash()
        })
        .catch(() => {})
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn || !isSignedIn() || isSyncing) return

    const currentHash = getDataHash()
    if (lastDataHash.current && currentHash !== lastDataHash.current) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      debounceTimer.current = setTimeout(() => {
        syncToDrive()
          .then(() => {
            lastDataHash.current = currentHash
          })
          .catch(() => {})
      }, DEBOUNCE_MS)
    } else if (!lastDataHash.current) {
      lastDataHash.current = currentHash
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [categories, tasks, isLoggedIn, isSyncing])

  useEffect(() => {
    if (!isLoggedIn || !isSignedIn()) return

    intervalRef.current = setInterval(() => {
      if (!isSyncing && isSignedIn()) {
        syncFromDrive()
          .then(() => {
            lastDataHash.current = getDataHash()
          })
          .catch(() => {})
      }
    }, SYNC_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isLoggedIn])
}
