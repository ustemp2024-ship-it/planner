/**
 * Optimized Google Drive Integration with Streamlined OAuth Flow
 * 로그인 프로세스를 최소화하고 자동화한 버전
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
const FILE_NAME = 'planner-data.json'
const TOKEN_KEY = 'planner-google-token-v2'

interface TokenResponse {
  access_token: string
  expires_in: number
  scope?: string
  token_type?: string
}

interface StoredToken extends TokenResponse {
  expiresAt: number
  timestamp: number
}

class GoogleAuthManager {
  private tokenClient: google.accounts.oauth2.TokenClient | null = null
  private currentToken: string | null = null
  private loginPromise: Promise<void> | null = null
  private initPromise: Promise<void> | null = null
  private retryCount = 0
  private maxRetries = 3

  /**
   * Initialize Google API with optimizations
   */
  async initialize(): Promise<void> {
    // 이미 초기화 중이면 기다림
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this._doInitialize()
    return this.initPromise
  }

  private async _doInitialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 이미 초기화되어 있으면 즉시 반환
      if (this.tokenClient) {
        console.log('✅ Google API already initialized')
        resolve()
        return
      }

      const initGis = () => {
        try {
          // 토큰 클라이언트 초기화 - 한 번에 모든 권한 요청
          this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: () => {}, // Will be set during login
            error_callback: (error: any) => {
              console.error('Token client error:', error)
            },
            // 추가 최적화 옵션
            hint: localStorage.getItem('planner-last-email') || undefined,
            hosted_domain: undefined, // 모든 Google 계정 허용
          })

          // 저장된 토큰 확인 및 자동 로드
          const savedToken = this.loadToken()
          if (savedToken && savedToken.expiresAt > Date.now()) {
            this.currentToken = savedToken.access_token
            console.log('✅ Loaded valid token from storage')
          }

          resolve()
        } catch (error) {
          console.error('Failed to initialize Google API:', error)
          reject(error)
        }
      }

      // Google Identity Services 스크립트 로드
      if (typeof google !== 'undefined' && google.accounts) {
        initGis()
      } else {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = initGis
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
        document.head.appendChild(script)
      }
    })
  }

  /**
   * Streamlined sign-in with automatic flow
   */
  async signIn(): Promise<void> {
    // 이미 로그인 중이면 기다림
    if (this.loginPromise) {
      return this.loginPromise
    }

    this.loginPromise = this._doSignIn()
    
    try {
      await this.loginPromise
    } finally {
      this.loginPromise = null
    }
  }

  private async _doSignIn(): Promise<void> {
    // 초기화 확인
    if (!this.tokenClient) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Google API not initialized'))
        return
      }

      let isResolved = false
      const timeoutDuration = 60000 // 60초로 증가

      // 타임아웃 설정
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true
          this.handleTimeout(reject)
        }
      }, timeoutDuration)

      // 콜백 설정
      this.tokenClient.callback = async (response: TokenResponse) => {
        clearTimeout(timeoutId)
        
        if (isResolved) return
        isResolved = true

        if (response.error) {
          this.handleError(response.error, reject)
          return
        }

        if (!response.access_token) {
          reject(new Error('No access token received'))
          return
        }

        try {
          // 토큰 저장
          this.saveToken(response)
          this.currentToken = response.access_token
          this.retryCount = 0

          // 사용자 정보 가져오기 및 이메일 저장
          const userInfo = await this.getUserInfo()
          if (userInfo?.email) {
            localStorage.setItem('planner-last-email', userInfo.email)
          }

          console.log('✅ Login successful')
          resolve()
        } catch (error) {
          reject(error)
        }
      }

      // 로그인 옵션 최적화
      const options = this.getOptimizedLoginOptions()
      
      console.log('🚀 Starting streamlined OAuth flow...')
      this.tokenClient.requestAccessToken(options)
    })
  }

  /**
   * 최적화된 로그인 옵션 생성
   */
  private getOptimizedLoginOptions(): any {
    const savedEmail = localStorage.getItem('planner-last-email')
    const isReturningUser = localStorage.getItem('planner-returning-user') === 'true'
    const rememberMe = localStorage.getItem('planner-remember-me') === 'true'

    let prompt = 'select_account consent'
    
    if (isReturningUser && rememberMe) {
      // 재방문 사용자이고 Remember Me가 활성화된 경우
      prompt = '' // Silent auth 시도
    } else if (savedEmail) {
      // 이메일은 있지만 권한이 필요한 경우
      prompt = 'consent' // 계정 선택 스킵, 권한만 요청
    }

    const options: any = {
      prompt,
      include_granted_scopes: true,
      enable_granular_consent: false, // 한 번에 모든 권한 요청
      ux_mode: 'popup', // 팝업 모드로 더 빠른 처리
    }

    // 저장된 이메일이 있으면 힌트로 제공
    if (savedEmail) {
      options.login_hint = savedEmail
      options.hd = undefined // 도메인 제한 없음
    }

    return options
  }

  /**
   * 타임아웃 처리 with retry
   */
  private handleTimeout(reject: (error: Error) => void): void {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      console.log(`⏱ Timeout occurred. Retrying... (${this.retryCount}/${this.maxRetries})`)
      
      // 자동 재시도
      setTimeout(() => {
        this.loginPromise = null
        this.signIn().catch(reject)
      }, 1000)
    } else {
      reject(new Error('로그인 시간이 초과되었습니다. 페이지를 새로고침하고 다시 시도해주세요.'))
    }
  }

  /**
   * 에러 처리
   */
  private handleError(error: any, reject: (error: Error) => void): void {
    console.error('OAuth error:', error)
    
    let message = '로그인에 실패했습니다.'
    
    switch (error) {
      case 'popup_blocked_by_browser':
        message = '팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도하세요.'
        break
      case 'access_denied':
        message = '권한이 거부되었습니다. 모든 권한을 허용해야 플래너를 사용할 수 있습니다.'
        break
      case 'invalid_client':
        message = 'Google 클라이언트 설정 오류입니다. 관리자에게 문의하세요.'
        break
    }
    
    reject(new Error(message))
  }

  /**
   * Get user info
   */
  async getUserInfo(): Promise<any> {
    if (!this.currentToken) {
      const savedToken = this.loadToken()
      if (!savedToken) return null
      this.currentToken = savedToken.access_token
    }

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${this.currentToken}` }
      })

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken()
          this.currentToken = null
        }
        return null
      }

      const userInfo = await response.json()
      
      // Mark as returning user
      localStorage.setItem('planner-returning-user', 'true')
      
      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      }
    } catch (error) {
      console.error('Error getting user info:', error)
      return null
    }
  }

  /**
   * Sign out
   */
  signOut(): void {
    if (this.currentToken && typeof google !== 'undefined') {
      try {
        google.accounts.oauth2.revoke(this.currentToken, () => {
          console.log('Token revoked')
        })
      } catch (e) {
        console.error('Error revoking token:', e)
      }
    }

    this.clearToken()
    this.currentToken = null
    
    // Keep email for faster re-login but clear returning user flag
    localStorage.removeItem('planner-returning-user')
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (this.currentToken) return true
    
    const savedToken = this.loadToken()
    if (savedToken && savedToken.expiresAt > Date.now()) {
      this.currentToken = savedToken.access_token
      return true
    }
    
    return false
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    if (!this.currentToken) {
      const savedToken = this.loadToken()
      if (savedToken && savedToken.expiresAt > Date.now()) {
        this.currentToken = savedToken.access_token
      }
    }
    return this.currentToken
  }

  /**
   * Token storage methods
   */
  private saveToken(token: TokenResponse): void {
    const storedToken: StoredToken = {
      ...token,
      expiresAt: Date.now() + (token.expires_in * 1000),
      timestamp: Date.now()
    }
    localStorage.setItem(TOKEN_KEY, JSON.stringify(storedToken))
  }

  private loadToken(): StoredToken | null {
    try {
      const stored = localStorage.getItem(TOKEN_KEY)
      if (!stored) return null
      
      const token = JSON.parse(stored) as StoredToken
      
      // Validate token
      if (!token.access_token || !token.expiresAt) return null
      if (token.expiresAt <= Date.now()) {
        this.clearToken()
        return null
      }
      
      return token
    } catch (error) {
      console.error('Error loading token:', error)
      this.clearToken()
      return null
    }
  }

  private clearToken(): void {
    localStorage.removeItem(TOKEN_KEY)
  }
}

// Export singleton instance
export const authManager = new GoogleAuthManager()

// Export convenience functions
export const initGoogleApi = () => authManager.initialize()
export const signIn = () => authManager.signIn()
export const signOut = () => authManager.signOut()
export const getUserInfo = () => authManager.getUserInfo()
export const isAuthenticated = () => authManager.isAuthenticated()
export const getAuthToken = () => authManager.getToken()

/**
 * Google Drive API functions
 */
export async function loadFromGoogleDrive(): Promise<any> {
  const token = getAuthToken()
  if (!token) throw new Error('Not authenticated')

  try {
    // Search for existing file
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false&fields=files(id,name,modifiedTime)`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )

    if (!searchResponse.ok) {
      throw new Error('Failed to search files')
    }

    const searchData = await searchResponse.json()
    
    if (!searchData.files || searchData.files.length === 0) {
      // Also check appDataFolder for backward compatibility
      const appDataResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false&spaces=appDataFolder&fields=files(id,name,modifiedTime)`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      if (appDataResponse.ok) {
        const appData = await appDataResponse.json()
        if (appData.files && appData.files.length > 0) {
          searchData.files = appData.files
        }
      }
    }

    if (!searchData.files || searchData.files.length === 0) {
      console.log('No planner data found in Google Drive')
      return null
    }

    // Get file content
    const file = searchData.files[0]
    const contentResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )

    if (!contentResponse.ok) {
      throw new Error('Failed to get file content')
    }

    const content = await contentResponse.text()
    return JSON.parse(content)
  } catch (error) {
    console.error('Error loading from Google Drive:', error)
    throw error
  }
}

export async function saveToGoogleDrive(data: any): Promise<void> {
  const token = getAuthToken()
  if (!token) throw new Error('Not authenticated')

  const content = JSON.stringify(data, null, 2)

  try {
    // Search for existing file
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and trashed=false&fields=files(id)`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )

    if (!searchResponse.ok) {
      throw new Error('Failed to search files')
    }

    const searchData = await searchResponse.json()
    
    if (searchData.files && searchData.files.length > 0) {
      // Update existing file
      const fileId = searchData.files[0].id
      const response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: content
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update file')
      }
    } else {
      // Create new file
      const metadata = {
        name: FILE_NAME,
        mimeType: 'application/json',
        description: 'Planner application data'
      }

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/related; boundary=foo_bar_baz'
          },
          body: `--foo_bar_baz\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--foo_bar_baz\r\nContent-Type: application/json\r\n\r\n${content}\r\n--foo_bar_baz--`
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create file')
      }
    }

    console.log('✅ Data saved to Google Drive')
  } catch (error) {
    console.error('Error saving to Google Drive:', error)
    throw error
  }
}