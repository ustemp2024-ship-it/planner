interface ConflictNotificationProps {
  isVisible: boolean
  onClose: () => void
}

export function ConflictNotification({ isVisible, onClose }: ConflictNotificationProps) {
  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-lg max-w-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">동기화 충돌 감지</h3>
          <p className="text-sm mt-1">
            다른 기기에서의 변경사항과 충돌이 발생했습니다. 
            현재 기기의 변경사항이 우선 적용되었습니다.
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 flex-shrink-0 text-yellow-500 hover:text-yellow-600"
        >
          <span className="sr-only">닫기</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}