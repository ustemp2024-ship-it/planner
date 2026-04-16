interface EmptyStateProps {
  type: 'no-data' | 'no-categories' | 'welcome'
  onCreateCategory?: () => void
}

export const EmptyState = ({ type, onCreateCategory }: EmptyStateProps) => {
  if (type === 'welcome') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            플래너에 오신 것을 환영합니다! 
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            새로운 플래너를 시작해보세요.<br />
            카테고리를 만들고 할일을 추가하여<br />
            체계적으로 일정을 관리할 수 있습니다.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={onCreateCategory}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-semibold">첫 번째 카테고리 만들기</span>
            </button>
            
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                자동 동기화
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                안전한 백업
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                모든 기기 동기화
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'no-categories') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            카테고리가 없습니다
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            할일을 정리할 카테고리를 먼저 만들어보세요.
          </p>
          <button
            onClick={onCreateCategory}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            카테고리 추가
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          데이터가 없습니다
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          새로운 할일을 추가해보세요.
        </p>
      </div>
    </div>
  )
}