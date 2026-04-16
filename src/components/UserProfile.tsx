import { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'

export const UserProfile = () => {
  const [showMenu, setShowMenu] = useState(false)
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    setShowMenu(false)
  }

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all"
        title={user.email}
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full border-2 border-white/50 shadow-sm"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-64 glass rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 z-50 overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-white/20 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border-2 border-white/50 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-sm hover:bg-white/50 dark:hover:bg-slate-700/50 dark:text-white flex items-center gap-3 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  )
}