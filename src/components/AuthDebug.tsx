import { useAuthStore } from '../store/useAuthStore'

export const AuthDebug = () => {
  const { isAuthenticated, isInitialized, user } = useAuthStore()
  
  const clearAuthStorage = () => {
    localStorage.removeItem('auth-storage')
    localStorage.removeItem('planner-google-token')
    window.location.reload()
  }

  if (import.meta.env.PROD) return null

  return (
    <div className="fixed top-0 left-0 z-50 bg-yellow-100 p-2 text-xs">
      <div>Auth Debug:</div>
      <div>Initialized: {String(isInitialized)}</div>
      <div>Authenticated: {String(isAuthenticated)}</div>
      <div>User: {user ? user.email : 'null'}</div>
      <button 
        onClick={clearAuthStorage}
        className="mt-1 px-2 py-1 bg-red-500 text-white text-xs rounded"
      >
        Clear Auth Storage
      </button>
    </div>
  )
}