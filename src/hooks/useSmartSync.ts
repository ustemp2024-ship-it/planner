import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { isSignedIn } from '../utils/googleDrive'

const SAVE_DELAY = 5000  // 5초 - 로컬 변경 후 저장 대기
const SYNC_INTERVAL = 30000  // 30초 - 동기화 간격
const MIN_SYNC_GAP = 10000  // 10초 - 최소 동기화 간격

export function useSmartSync(isLoggedIn: boolean) {
  const { categories, tasks, syncToDrive, syncFromDrive, isSyncing } = useStore()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSyncTime = useRef<number>(0)
  const lastDataHash = useRef<string>('')
  const isInitialized = useRef(false)
  const syncInProgress = useRef(false)

  // 데이터 해시 생성
  const getDataHash = useCallback(() => {
    return JSON.stringify({ 
      categories: categories.map(c => ({ ...c, updatedAt: undefined })),
      tasks: tasks.map(t => ({ ...t, updatedAt: undefined }))
    })
  }, [categories, tasks])

  // 안전한 동기화 함수
  const performSync = useCallback(async (direction: 'up' | 'down' | 'both') => {
    // 동기화 중이거나 너무 빨리 동기화하려는 경우 방지
    if (syncInProgress.current || isSyncing) {
      console.log('⏸️ 동기화 건너뜀 - 이미 진행 중')
      return
    }

    const now = Date.now()
    if (now - lastSyncTime.current < MIN_SYNC_GAP) {
      console.log('⏸️ 동기화 건너뜀 - 너무 빨리 요청됨')
      return
    }

    syncInProgress.current = true
    lastSyncTime.current = now

    try {
      if (direction === 'down' || direction === 'both') {
        console.log('⬇️ Google Drive에서 데이터 가져오기...')
        await syncFromDrive()
        lastDataHash.current = getDataHash()
      }

      if (direction === 'up' || direction === 'both') {
        console.log('⬆️ Google Drive로 데이터 저장...')
        await syncToDrive()
        lastDataHash.current = getDataHash()
      }
    } catch (error) {
      console.error('❌ 동기화 실패:', error)
    } finally {
      syncInProgress.current = false
    }
  }, [syncToDrive, syncFromDrive, isSyncing, getDataHash])

  // 초기 로드 (한 번만)
  useEffect(() => {
    if (!isLoggedIn || !isSignedIn() || isInitialized.current) return

    isInitialized.current = true
    console.log('🚀 초기 데이터 로드 시작')
    
    // 초기 로드는 2초 대기 후 실행
    const initTimer = setTimeout(() => {
      performSync('down')
    }, 2000)

    return () => clearTimeout(initTimer)
  }, [isLoggedIn, performSync])

  // 로컬 변경 감지 및 저장
  useEffect(() => {
    if (!isLoggedIn || !isSignedIn() || !isInitialized.current) return

    const currentHash = getDataHash()
    
    // 데이터가 변경되었을 때만
    if (lastDataHash.current && currentHash !== lastDataHash.current) {
      console.log('📝 로컬 변경 감지 - 저장 예약')
      
      // 이전 타이머 취소
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
      }

      // 새 타이머 설정
      saveTimer.current = setTimeout(() => {
        console.log('💾 로컬 변경 저장 시작')
        performSync('up')
      }, SAVE_DELAY)
    }

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
      }
    }
  }, [categories, tasks, isLoggedIn, getDataHash, performSync])

  // 정기 동기화 (원격 변경 확인)
  useEffect(() => {
    if (!isLoggedIn || !isSignedIn()) return

    console.log('⏰ 정기 동기화 시작 (30초 간격)')
    
    syncTimer.current = setInterval(() => {
      // 로컬 변경이 없을 때만 원격 동기화
      const currentHash = getDataHash()
      if (currentHash === lastDataHash.current) {
        console.log('🔄 정기 동기화 실행')
        performSync('down')
      } else {
        console.log('⏸️ 정기 동기화 건너뜀 - 로컬 변경 있음')
      }
    }, SYNC_INTERVAL)

    return () => {
      if (syncTimer.current) {
        clearInterval(syncTimer.current)
      }
    }
  }, [isLoggedIn, performSync, getDataHash])

  // 탭 포커스 시 동기화
  useEffect(() => {
    const handleFocus = () => {
      if (!isLoggedIn || !isSignedIn()) return
      
      console.log('👁️ 탭 포커스 - 동기화 확인')
      const now = Date.now()
      
      // 마지막 동기화로부터 10초 이상 지났으면
      if (now - lastSyncTime.current > MIN_SYNC_GAP) {
        performSync('down')
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [isLoggedIn, performSync])

  // 언로드 시 저장
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const currentHash = getDataHash()
      if (currentHash !== lastDataHash.current) {
        // 동기적으로 저장 시도 (최선의 노력)
        navigator.sendBeacon('/api/save-to-drive', JSON.stringify({
          categories,
          tasks
        }))
        
        e.preventDefault()
        e.returnValue = '저장되지 않은 변경사항이 있습니다.'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [categories, tasks, getDataHash])
}