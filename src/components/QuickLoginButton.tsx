import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'

interface QuickLoginButtonProps {
  email: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function QuickLoginButton({ email, onSuccess, onError }: QuickLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuthStore()
  
  const handleQuickLogin = async () => {
    setIsLoading(true)
    
    try {
      // Silent login 시도
      await login()
      onSuccess?.()
    } catch (error) {
      console.error('Quick login failed:', error)
      onError?.('빠른 로그인에 실패했습니다. 일반 로그인을 시도하세요.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <button
      onClick={handleQuickLogin}
      disabled={isLoading}
      className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 border border-blue-200 dark:border-blue-700 transition-all"
    >
      <div className="flex items-center gap-4">
        {/* User Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
          <span className="text-white text-lg font-bold">
            {email.charAt(0).toUpperCase()}
          </span>
        </div>
        
        {/* User Info */}
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            빠른 로그인
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {email}
          </p>
        </div>
        
        {/* Loading/Arrow Icon */}
        <div className="flex-shrink-0">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>
    </button>
  )
}