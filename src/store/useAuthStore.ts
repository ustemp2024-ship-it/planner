import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initGoogleApi, signIn, signOut, isSignedIn } from '../utils/googleDrive'

interface User {
  id: string
  email: string
  name: string
  picture?: string
}

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isInitialized: boolean
  
  initializeAuth: () => Promise<void>
  login: () => Promise<void>
  logout: () => void
}

const AUTH_STORE_VERSION = 2

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isInitialized: false,

      initializeAuth: async () => {
        try {
          await initGoogleApi()
          const authenticated = isSignedIn()
          
          // 토큰이 만료되었거나 유효하지 않으면 localStorage 정리
          if (!authenticated) {
            localStorage.removeItem('planner-google-token')
            set({ 
              user: null,
              isAuthenticated: false, 
              isInitialized: true 
            })
            return
          }
          
          // Google API에서 사용자 정보 가져오기 및 토큰 검증
          try {
            const response = await gapi.client.request({
              path: 'https://www.googleapis.com/oauth2/v1/userinfo',
            })
            
            if (!response.result || !response.result.email) {
              throw new Error('Invalid user info response')
            }
            
            const userInfo = response.result
            set({
              user: {
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
              },
              isAuthenticated: true,
              isInitialized: true,
            })
          } catch (e) {
            console.error('Failed to get user info, forcing logout:', e)
            // 토큰이 무효하면 강제 로그아웃
            get().logout()
            set({ isInitialized: true })
          }
        } catch (e) {
          console.error('Failed to initialize auth:', e)
          set({ 
            user: null,
            isAuthenticated: false, 
            isInitialized: true 
          })
        }
      },

      login: async () => {
        try {
          await signIn()
          
          // 로그인 후 사용자 정보 가져오기
          const response = await gapi.client.request({
            path: 'https://www.googleapis.com/oauth2/v1/userinfo',
          })
          
          const userInfo = response.result
          set({
            user: {
              id: userInfo.id,
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture,
            },
            isAuthenticated: true,
          })
        } catch (e) {
          console.error('Login failed:', e)
          throw e
        }
      },

      logout: () => {
        signOut()
        set({
          user: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'auth-storage',
      version: AUTH_STORE_VERSION,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      migrate: (persistedState: any, version: number) => {
        if (version < AUTH_STORE_VERSION) {
          // 이전 버전 데이터는 모두 초기화
          return {
            user: null,
            isAuthenticated: false,
            isInitialized: false,
          }
        }
        return persistedState
      },
    }
  )
)