import { useState, useEffect } from 'react'
import { iosInstaller } from '../utils/ios-installer'

export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [instructions, setInstructions] = useState<string[]>([])
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    // Check if we should show the install prompt
    if (iosInstaller.shouldShowInstallPrompt()) {
      setShowPrompt(true)
      setInstructions(iosInstaller.getInstallInstructions())
      
      // Auto-minimize after 10 seconds
      const timer = setTimeout(() => {
        setIsMinimized(true)
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    iosInstaller.dismissPrompt(false)
    setShowPrompt(false)
  }

  const handleDismissPermanently = () => {
    iosInstaller.dismissPrompt(true)
    setShowPrompt(false)
  }

  const handleInstallComplete = () => {
    iosInstaller.markPromptShown()
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  // Minimized view - small floating button
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-50 animate-bounce">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-500 text-white rounded-full p-3 shadow-lg hover:bg-blue-600 transition-colors"
          aria-label="Show install instructions"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 4v16m0 0l-4-4m4 4l4-4" />
          </svg>
        </button>
      </div>
    )
  }

  // Full prompt view
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      <div className="pointer-events-auto bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl w-full max-w-md mx-4 mb-0 animate-slide-up">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-2xl">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  홈 화면에 추가하기
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  더 나은 알림 기능을 사용하세요
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Minimize"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Benefits */}
          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 mb-4">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              설치하면 좋은 점:
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>푸시 알림을 받을 수 있어요</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>오프라인에서도 사용 가능해요</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>더 빠르게 실행돼요</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>전체 화면으로 사용할 수 있어요</span>
              </li>
            </ul>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
              설치 방법:
            </h4>
            <ol className="space-y-3">
              {instructions.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-300 pt-1">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* iOS Version Warning */}
          {iosInstaller.getIOSVersion() && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                {iosInstaller.getIOSVersion()!.major < 16 || 
                 (iosInstaller.getIOSVersion()!.major === 16 && iosInstaller.getIOSVersion()!.minor < 4)
                  ? '⚠️ iOS 16.4 이상에서 푸시 알림이 지원됩니다'
                  : '✓ 푸시 알림이 지원되는 iOS 버전입니다'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleInstallComplete}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              설치 완료
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              나중에
            </button>
          </div>
          
          <button
            onClick={handleDismissPermanently}
            className="w-full mt-2 py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            다시 보지 않기
          </button>
        </div>
      </div>
    </div>
  )
}

// Add this CSS animation to your global styles or Tailwind config
const styles = `
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
`