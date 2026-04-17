import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { isSignedIn } from '../utils/googleDrive'

const DEBOUNCE_MS = 1000  // 1초로 단축
const SYNC_INTERVAL_MS = 15000  // 15초로 단축

export function useAutoSync(isLoggedIn: boolean) {
  const { categories, tasks, syncToDrive, syncFromDrive, isSyncing } = useStore()
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastDataHash = useRef<string>('')
  const isInitialSync = useRef(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const previousLoginStatus = useRef(isLoggedIn)

  const getDataHash = () => JSON.stringify({ categories, tasks })

  // 로그인 상태 변화 감지 및 상태 리셋
  useEffect(() => {
    if (previousLoginStatus.current !== isLoggedIn) {
      console.log('로그인 상태 변화 감지 - useAutoSync 상태 리셋')
      isInitialSync.current = true  // 새 로그인 시 초기 동기화 활성화
      lastDataHash.current = ''     // 데이터 해시 초기화
      previousLoginStatus.current = isLoggedIn
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn || !isSignedIn()) {
      console.log('⏸️ 초기 동기화 대기 - 로그인 상태:', isLoggedIn, '토큰 유효:', isSignedIn())
      return
    }

    if (isInitialSync.current) {
      isInitialSync.current = false
      console.log('🔄 초기 Google Drive 동기화 시작 (첫 시도)')

      // 약간의 지연을 두어 권한 전파 대기
      setTimeout(() => {
        syncFromDrive()
          .then(() => {
            lastDataHash.current = getDataHash()
            console.log('✅ 초기 동기화 완료')
          })
          .catch((error) => {
            console.error('❌ 초기 동기화 실패 - 권한 전파 대기 필요할 수 있음:', error)
          })
      }, 2000) // 2초 지연
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
