import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initGoogleApi, signIn, signOut, getUserInfo } from '../utils/googleDrive'

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
    (set) => ({
      user: null,
      isAuthenticated: false,
      isInitialized: false,

      initializeAuth: async () => {
        try {
          // 저장된 토큰 확인
          const token = localStorage.getItem('planner-google-token')
          if (token) {
            try {
              const parsedToken = JSON.parse(token)
              if (parsedToken.expiresAt > Date.now()) {
                // 실제 Google 사용자 정보 가져오기
                const userInfo = await getUserInfo()
                if (userInfo) {
                  set({
                    user: userInfo,
                    isAuthenticated: true,
                    isInitialized: true,
                  })
                  return
                }
              }
            } catch (e) {
              localStorage.removeItem('planner-google-token')
            }
          }
          
          set({ 
            user: null,
            isAuthenticated: false, 
            isInitialized: true 
          })
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
          console.log('🚀 [LOGIN] Starting OAuth login process')

          console.log('📡 [LOGIN] Step 1: Initializing Google API...')
          await initGoogleApi()
          console.log('✅ [LOGIN] Google API initialized successfully')

          console.log('🔐 [LOGIN] Step 2: Attempting sign in...')
          await signIn()
          console.log('✅ [LOGIN] Sign in completed successfully')

          console.log('👤 [LOGIN] Step 3: Getting user info...')
          const userInfo = await getUserInfo()
          console.log('📋 [LOGIN] User info result:', userInfo)

          if (userInfo) {
            // 이전 사용자와 다른 경우 로컬 스토어 초기화
            const savedAuthData = localStorage.getItem('auth-storage')
            if (savedAuthData) {
              try {
                const parsed = JSON.parse(savedAuthData)
                const savedUser = parsed.state?.user
                
                // 계정 변경 감지: 이전 사용자와 다른 계정으로 로그인
                if (savedUser && savedUser.email !== userInfo.email) {
                  console.log(`Account changed from ${savedUser.email} to ${userInfo.email}`)

                  // 모든 계정 변경 시 로컬 데이터 삭제
                  // 각 계정은 오직 자신의 Google Drive 데이터만 사용
                  console.log('Clearing local storage for account change - will load from Google Drive')
                  localStorage.removeItem('planner-storage')
                  sessionStorage.clear() // 이전 계정 세션 완전 정리
                }
              } catch (e) {
                // 파싱 실패 시 안전하게 초기화
                localStorage.removeItem('planner-storage')
              }
            }
            
            set({
              user: userInfo,
              isAuthenticated: true,
            })
          } else {
            throw new Error('Failed to get user info')
          }
        } catch (e) {
          console.error('❌ [LOGIN] OAuth login failed at step:', e)
          console.error('❌ [LOGIN] Error details:', {
            message: e instanceof Error ? e.message : 'Unknown error',
            stack: e instanceof Error ? e.stack : undefined,
            errorObject: e
          })
          throw e
        }
      },

      logout: () => {
        signOut()

        // SECURITY: 토큰만 삭제, 플래너 데이터는 유지 (다음 로그인 시 Google Drive에서 로드)
        localStorage.removeItem('planner-google-token')
        sessionStorage.clear() // 전체 세션 정리

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