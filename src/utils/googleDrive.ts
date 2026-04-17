const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
const FILE_NAME = 'planner-data.json'
const TOKEN_KEY = 'planner-google-token'

let tokenClient: google.accounts.oauth2.TokenClient | null = null
let currentToken: string | null = null

const saveToken = (token: { access_token: string; expires_in: number }) => {
  try {
    const expiresAt = Date.now() + token.expires_in * 1000
    const tokenData = JSON.stringify({ ...token, expiresAt })
    
    // Safari localStorage 호환성 확인
    if (typeof Storage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, tokenData)
      console.log('Token saved to localStorage')
    } else {
      console.warn('localStorage not available, using sessionStorage')
      sessionStorage.setItem(TOKEN_KEY, tokenData)
    }
  } catch (error) {
    console.error('Failed to save token:', error)
    // Safari 사생활 보호 모드에서 localStorage 차단 시 대안
    try {
      sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ ...token, expiresAt: Date.now() + token.expires_in * 1000 }))
      console.log('Token saved to sessionStorage as fallback')
    } catch (sessionError) {
      console.error('Both localStorage and sessionStorage failed:', sessionError)
      throw new Error('Unable to save authentication token')
    }
  }
}

const loadToken = (): { access_token: string; expiresAt: number } | null => {
  let stored: string | null = null
  
  try {
    // localStorage 먼저 시도
    stored = localStorage.getItem(TOKEN_KEY)
  } catch (error) {
    console.warn('localStorage access failed, trying sessionStorage')
  }
  
  // localStorage가 실패하면 sessionStorage 시도
  if (!stored) {
    try {
      stored = sessionStorage.getItem(TOKEN_KEY)
    } catch (error) {
      console.warn('sessionStorage access failed')
      return null
    }
  }
  
  if (!stored) return null
  
  try {
    const token = JSON.parse(stored)
    if (token.expiresAt > Date.now()) {
      return token
    }
    // 만료된 토큰 정리
    try {
      localStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(TOKEN_KEY)
    } catch (error) {
      console.warn('Failed to remove expired token')
    }
    return null
  } catch (error) {
    console.error('Failed to parse stored token:', error)
    return null
  }
}

const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch (error) {
    console.warn('Failed to clear localStorage')
  }
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch (error) {
    console.warn('Failed to clear sessionStorage')
  }
}

export interface SyncData {
  categories: unknown[]
  tasks: unknown[]
  lastModified: string
}

export const initGoogleApi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (tokenClient) {
      resolve()
      return
    }

    // Client ID 검증
    if (!CLIENT_ID || CLIENT_ID === 'your_actual_google_client_id_here') {
      reject(new Error('Google Client ID가 설정되지 않았습니다. .env 파일의 VITE_GOOGLE_CLIENT_ID를 확인하세요.'))
      return
    }

    const initGis = () => {
      try {
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: () => {},
        })
        
        const savedToken = loadToken()
        if (savedToken) {
          currentToken = savedToken.access_token
        }
        
        console.log('Google API initialized successfully')
        resolve()
      } catch (error) {
        console.error('Google API initialization error:', error)
        reject(new Error('Google API 초기화 실패: ' + (error as Error).message))
      }
    }

    if (typeof google !== 'undefined' && google.accounts) {
      initGis()
    } else {
      console.log('Loading Google Identity Services...')
      const gisScript = document.createElement('script')
      gisScript.src = 'https://accounts.google.com/gsi/client'
      gisScript.onload = initGis
      gisScript.onerror = () => reject(new Error('Google Identity Services 스크립트 로드 실패'))
      document.body.appendChild(gisScript)
    }
  })
}

export const signIn = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client not initialized'))
      return
    }

    // Safari 호환성 개선
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    console.log('Browser detected:', isSafari ? 'Safari' : 'Other')

    tokenClient.callback = (response) => {
      if (response.error) {
        console.error('OAuth error:', response.error)
        reject(new Error(response.error))
        return
      }
      
      try {
        saveToken({ access_token: response.access_token, expires_in: response.expires_in })
        currentToken = response.access_token
        console.log('Token saved successfully')
        resolve()
      } catch (error) {
        console.error('Token save error:', error)
        reject(error)
      }
    }

    try {
      // Safari에서는 사용자 제스처가 필요하므로 다른 방식 사용
      if (isSafari) {
        console.log('Using Safari-compatible OAuth flow')
        // Safari에서는 redirect 방식이 더 안정적
        tokenClient.requestAccessToken({ 
          prompt: 'select_account consent'
        })
      } else {
        tokenClient.requestAccessToken({ prompt: 'select_account consent' })
      }
    } catch (error) {
      console.error('OAuth request error:', error)
      reject(error)
    }
  })
}

export const signOut = () => {
  try {
    console.log('Starting sign out process...')
    
    // Google 토큰 해제 (에러가 발생해도 계속 진행)
    if (currentToken && typeof google !== 'undefined' && google.accounts) {
      try {
        google.accounts.oauth2.revoke(currentToken, () => {
          console.log('Google token revoked')
        })
      } catch (e) {
        console.warn('Failed to revoke Google token:', e)
      }
    }
    
    // 로컬 상태 정리
    currentToken = null
    clearToken()
    
    console.log('Sign out completed')
  } catch (e) {
    console.error('Sign out error:', e)
    // 에러가 발생해도 로컬 정리는 수행
    currentToken = null
    clearToken()
  }
}

export const isSignedIn = (): boolean => {
  const token = loadToken()
  
  // currentToken이 없으면 저장된 토큰에서 복원 시도 (모바일 호환성)
  if (token && !currentToken) {
    currentToken = token.access_token
    console.log('Restored currentToken from storage for mobile compatibility')
  }
  
  return token !== null && currentToken !== null
}

const findFile = async (): Promise<string | null> => {
  if (!currentToken) {
    // 저장된 토큰에서 currentToken 복원
    const savedToken = loadToken()
    if (savedToken) {
      currentToken = savedToken.access_token
    } else {
      console.warn('No valid token available for Google Drive API')
      return null
    }
  }
  
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    fields: 'files(id, name)',
    q: `name='${FILE_NAME}'`
  })
  
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: {
      'Authorization': `Bearer ${currentToken}`
    }
  })
  
  if (!response.ok) throw new Error('Failed to find file')
  
  const data = await response.json()
  const files = data.files
  return files && files.length > 0 ? files[0].id : null
}

export const uploadToDrive = async (data: SyncData): Promise<void> => {
  if (!currentToken) throw new Error('No access token')
  
  const fileId = await findFile()
  const metadata = {
    name: FILE_NAME,
    mimeType: 'application/json',
    ...(fileId ? {} : { parents: ['appDataFolder'] }),
  }

  const form = new FormData()
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  )
  form.append(
    'file',
    new Blob([JSON.stringify(data)], { type: 'application/json' })
  )

  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'

  const response = await fetch(url, {
    method: fileId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${currentToken}`,
    },
    body: form,
  })

  if (!response.ok) {
    throw new Error('Failed to upload to Drive')
  }
}

export const downloadFromDrive = async (): Promise<SyncData | null> => {
  if (!currentToken) return null
  
  const fileId = await findFile()
  if (!fileId) return null

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      'Authorization': `Bearer ${currentToken}`
    }
  })

  if (!response.ok) throw new Error('Failed to download from Drive')
  
  return await response.json()
}

export const getUserInfo = async (): Promise<{ id: string; email: string; name: string; picture?: string } | null> => {
  if (!currentToken) {
    const savedToken = loadToken()
    if (savedToken) {
      currentToken = savedToken.access_token
    } else {
      return null
    }
  }

  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    })

    if (!response.ok) {
      console.error('Failed to get user info:', response.status)
      return null
    }

    const userInfo = await response.json()
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
