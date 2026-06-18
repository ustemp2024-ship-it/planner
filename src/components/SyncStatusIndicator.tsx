import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { syncManager } from '../utils/syncManager'

export function SyncStatusIndicator() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error' | 'conflict'>('idle')
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const { syncToDrive, hasConflicts, conflictCount, isSyncing } = useStore()

  useEffect(() => {
    // 동기화 상태 변경 감지
    if (isSyncing) {
      setSyncStatus('syncing')
    } else if (hasConflicts) {
      setSyncStatus('conflict')
    } else if (lastSync && Date.now() - lastSync.getTime() < 5000) {
      setSyncStatus('success')
      setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }, [isSyncing, hasConflicts, lastSync])

  const handleManualSync = async () => {
    try {
      await syncToDrive()
      setLastSync(new Date())
    } catch (error) {
      setSyncStatus('error')
      console.error('Manual sync failed:', error)
    }
  }

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'success':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      case 'conflict':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
        )
    }
  }

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return '동기화 중...'
      case 'success':
        return '동기화 완료'
      case 'error':
        return '동기화 실패'
      case 'conflict':
        return `충돌 ${conflictCount}개`
      default:
        if (lastSync) {
          const diff = Date.now() - lastSync.getTime()
          if (diff < 60000) return '방금 전'
          if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
          return `${Math.floor(diff / 3600000)}시간 전`
        }
        return '동기화 대기'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleManualSync}
        disabled={isSyncing}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        {getStatusIcon()}
        <span className="hidden sm:inline text-slate-600 dark:text-slate-400">
          {getStatusText()}
        </span>
      </button>

      {/* Tooltip */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 min-w-[200px]">
          <div className="text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">상태:</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {getStatusText()}
              </span>
            </div>
            {lastSync && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">마지막 동기화:</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {lastSync.toLocaleTimeString()}
                </span>
              </div>
            )}
            {hasConflicts && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <p className="text-yellow-600 dark:text-yellow-400">
                  ⚠️ 다른 기기에서 수정된 내용과 충돌이 있습니다
                </p>
                <button
                  onClick={handleManualSync}
                  className="mt-2 w-full px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                >
                  충돌 해결
                </button>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              클릭하여 수동 동기화
            </div>
          </div>
        </div>
      )}
    </div>
  )
}