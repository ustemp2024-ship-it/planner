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
  isAutoLoginAttempted: boolean
  lastLoginEmail: string | null
  
  initializeAuth: () => Promise<void>
  login: () => Promise<void>
  logout: () => void
  setAutoLoginAttempted: (attempted: boolean) => void
}

const AUTH_STORE_VERSION = 2

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      isAutoLoginAttempted: false,
      lastLoginEmail: null,

      initializeAuth: async () => {
        try {
          // 자동 로그인 설정 확인
          const autoLogin = localStorage.getItem('planner-auto-login')
          const rememberMe = localStorage.getItem('planner-remember-me') === 'true'
          
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
                    lastLoginEmail: userInfo.email,
                  })
                  return
                }
              }
            } catch (e) {
              localStorage.removeItem('planner-google-token')
            }
          }
          
          // 자동 로그인 시도 (Remember Me가 활성화된 경우)
          if (rememberMe && autoLogin && !get().isAutoLoginAttempted) {
            set({ isAutoLoginAttempted: true })
            
            try {
              // Silent login 시도
              await initGoogleApi()
              const tokenClient = (window as any).google?.accounts?.oauth2?.initTokenClient?.({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                prompt: '', // Silent login
                login_hint: autoLogin, // 이전 로그인 이메일 사용
                callback: async (response: any) => {
                  if (response.access_token) {
                    localStorage.setItem('planner-google-token', JSON.stringify({
                      ...response,
                      expiresAt: Date.now() + (response.expires_in * 1000),
                      timestamp: Date.now()
                    }))
                    
                    const userInfo = await getUserInfo()
                    if (userInfo) {
                      set({
                        user: userInfo,
                        isAuthenticated: true,
                        isInitialized: true,
                        lastLoginEmail: userInfo.email,
                      })
                    }
                  }
                }
              })
              
              if (tokenClient) {
                tokenClient.requestAccessToken()
              }
            } catch (e) {
              console.log('Silent login failed, user interaction required')
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
            
            // Remember Me 옵션 저장
            if (localStorage.getItem('planner-remember-me') === 'true') {
              localStorage.setItem('planner-auto-login', userInfo.email)
            }
            
            set({
              user: userInfo,
              isAuthenticated: true,
              lastLoginEmail: userInfo.email,
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
        
        // Remember Me 해제 시 자동 로그인 정보도 삭제
        if (localStorage.getItem('planner-remember-me') !== 'true') {
          localStorage.removeItem('planner-auto-login')
        }
        
        sessionStorage.clear() // 전체 세션 정리

        set({
          user: null,
          isAuthenticated: false,
        })
      },
      
      setAutoLoginAttempted: (attempted: boolean) => set({ isAutoLoginAttempted: attempted }),
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