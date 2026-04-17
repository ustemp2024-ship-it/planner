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
    console.log('🔑 Google 로그인 시작...')

    if (!tokenClient) {
      console.error('❌ 토큰 클라이언트가 초기화되지 않음')
      reject(new Error('Google API가 초기화되지 않았습니다. 페이지를 새로고침하고 다시 시도하세요.'))
      return
    }

    // Client ID 재검증
    if (!CLIENT_ID || CLIENT_ID === 'your_actual_google_client_id_here') {
      console.error('❌ Google Client ID 설정 오류')
      reject(new Error('Google Client ID가 올바르게 설정되지 않았습니다.'))
      return
    }

    // Safari 호환성 개선
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    console.log('브라우저 감지:', isSafari ? 'Safari' : 'Other', '| UserAgent:', navigator.userAgent.slice(0, 50) + '...')

    // 기존 토큰 정리 (새 로그인 전)
    clearToken()
    currentToken = null

    // CRITICAL 수정: unhandled promise rejection 방지
    let resolved = false

    tokenClient.callback = async (response) => {
      if (resolved) return // 이미 해결됨
      resolved = true

      console.log('📞 [SIGNIN] OAuth callback received:', {
        hasError: !!response.error,
        hasAccessToken: !!response.access_token,
        expiresIn: response.expires_in,
        errorType: response.error || 'none',
        fullResponse: response
      })

      if (response.error) {
        console.error('❌ OAuth 오류:', response.error)

        // 사용자 친화적 오류 메시지
        let errorMessage = 'Google 로그인에 실패했습니다.'
        if (response.error === 'popup_blocked_by_browser') {
          errorMessage = '팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도하세요.'
        } else if (response.error === 'access_denied') {
          errorMessage = 'Google 로그인이 취소되었습니다.'
        } else if (response.error === 'invalid_client') {
          errorMessage = 'Google 클라이언트 설정에 오류가 있습니다.'
        }

        reject(new Error(errorMessage))
        return
      }

      if (!response.access_token) {
        console.error('❌ 액세스 토큰을 받지 못했습니다')
        reject(new Error('Google에서 올바른 인증 토큰을 받지 못했습니다.'))
        return
      }

      try {
        console.log('💾 토큰 저장 중...')

        // 토큰 유효성 검증
        if (!response.expires_in || response.expires_in < 60 || response.expires_in > 7200) {
          reject(new Error('Google에서 받은 토큰 정보가 올바르지 않습니다.'))
          return
        }

        saveToken({
          access_token: response.access_token,
          expires_in: response.expires_in
        })
        currentToken = response.access_token

        // 토큰 즉시 검증
        console.log('🔍 [SIGNIN] Starting token verification...')
        console.log('🔑 [SIGNIN] Token to verify:', currentToken ? 'Present' : 'Missing')

        const isValid = await verifyTokenScopes(currentToken)
        console.log('📋 [SIGNIN] Token verification result:', isValid)

        if (!isValid) {
          console.error('❌ [SIGNIN] Token verification failed')
          clearToken()
          currentToken = null
          reject(new Error('새 토큰의 권한이 올바르지 않습니다. 다시 로그인을 시도하세요.'))
          return
        }

        console.log('✅ [SIGNIN] OAuth login and token verification completed successfully')
        resolve()
      } catch (error) {
        console.error('❌ 토큰 저장 오류:', error)
        reject(new Error('토큰 저장 중 오류가 발생했습니다: ' + (error as Error).message))
      }
    }

    try {
      console.log('🌐 [SIGNIN] Starting OAuth request...')
      console.log('🔧 [SIGNIN] Client ID check:', CLIENT_ID ? 'Present' : 'Missing')
      console.log('🔧 [SIGNIN] Required scopes:', SCOPES)

      // 모든 필요한 권한을 강제로 요청
      const requestOptions = {
        prompt: 'select_account consent', // 항상 권한 동의 화면 표시
        enable_granular_consent: true,    // 세분화된 권한 동의 활성화
        include_granted_scopes: true      // 기존 승인된 범위 포함
      }

      console.log('⚙️ [SIGNIN] Request options:', requestOptions)
      console.log('🚀 [SIGNIN] Triggering OAuth popup...')

      if (isSafari) {
        console.log('🦜 [SIGNIN] Using Safari-compatible OAuth flow')
        tokenClient.requestAccessToken(requestOptions)
      } else {
        console.log('🌐 [SIGNIN] Using standard OAuth flow')
        tokenClient.requestAccessToken(requestOptions)
      }

      // CRITICAL 수정: 타임아웃에서 double resolution 방지
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true
          console.warn('⚠️ OAuth 타임아웃')
          reject(new Error('로그인 요청 시간이 초과되었습니다. 다시 시도하세요.'))
        }
      }, 30000)

      // 성공 시 타임아웃 정리를 위해 resolve에 clearTimeout 추가
      const originalCallback = tokenClient.callback
      tokenClient.callback = (response) => {
        clearTimeout(timeoutId)
        originalCallback(response)
      }

    } catch (error) {
      resolved = true
      console.error('❌ [SIGNIN] OAuth request error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorObject: error
      })
      reject(new Error('Google 로그인 요청 중 오류가 발생했습니다: ' + (error as Error).message))
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

// 403 권한 오류 전용 강제 토큰 정리 함수
export const forceTokenReset = async (): Promise<void> => {
  console.log('🔥 403 권한 오류로 강제 토큰 리셋 시작...')

  // 현재 토큰 저장
  const tokenToRevoke = currentToken

  // 즉시 로컬 정리
  signOut()

  // 추가 정리: sessionStorage와 모든 관련 데이터
  try {
    sessionStorage.clear()
    if (typeof google !== 'undefined' && google.accounts) {
      // Google Identity Services 세션도 정리
      if (tokenToRevoke) {
        google.accounts.oauth2.revoke(tokenToRevoke, () => {
          console.log('✅ 강제 토큰 해제 완료')
        })
      }
    }
  } catch (error) {
    console.warn('강제 정리 중 오류:', error)
  }

  alert(
    '🔑 Google Drive 권한이 부족합니다.\n\n' +
    '모든 연결이 해제되었습니다.\n' +
    '페이지가 자동으로 새로고침됩니다.'
  )

  console.log('✅ 강제 토큰 리셋 완료')

  // 완전 자동화: 페이지 새로고침
  setTimeout(() => {
    window.location.reload()
  }, 1000)
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

// 토큰 검증 함수 (보안 강화 버전)
const verifyTokenScopes = async (token: string): Promise<boolean> => {
  try {
    console.log('🔍 토큰 검증 시작...')

    // 보안 강화: Authorization 헤더 사용, URL 쿼리 노출 방지
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      console.log('⚠️ 토큰 만료 또는 유효하지 않음 (HTTP ' + response.status + ')')
      return false
    }

    const userInfo = await response.json()

    // 토큰이 유효하면 추가로 Drive API 권한 체크 (실제 호출과 동일하게)
    const testParams = new URLSearchParams({
      spaces: 'appDataFolder',
      fields: 'files(id, name)',
      q: `name='test-permission-check.json'`,
      pageSize: '1'
    })

    const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/files?${testParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!driveResponse.ok) {
      console.log('⚠️ Drive API 권한 없음 (HTTP ' + driveResponse.status + ') - 스코프 재인증 필요')
      return false
    }

    console.log('✅ 토큰 검증 성공 - 사용자:', userInfo.email)
    return true
  } catch (error) {
    console.error('토큰 검증 실패:', error)
    return false
  }
}

// 무한 루프 방지 플래그
let fixTokenInProgress = false

// 자동 토큰 복구 함수 (무한 루프 방지 및 에러 컨텍스트 개선)
const autoFixToken = async (errorContext?: string): Promise<void> => {
  // CRITICAL 수정: 무한 루프 방지
  if (fixTokenInProgress) {
    console.warn('⚠️ 토큰 복구가 이미 진행 중입니다')
    return
  }

  try {
    fixTokenInProgress = true
    console.log('🔄 토큰 자동 복구 시작... 원인:', errorContext || '알 수 없음')

    // CRITICAL 수정: 토큰 해제 전에 현재 토큰 저장
    const tokenToRevoke = currentToken

    // 기존 토큰 완전 삭제
    clearToken()
    currentToken = null

    // Google API 토큰 해제 시도 (유효한 토큰이 있을 때만)
    if (tokenToRevoke && typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
      try {
        google.accounts.oauth2.revoke(tokenToRevoke, () => {
          console.log('✅ 기존 Google 토큰 해제 완료')
        })
      } catch (error) {
        console.warn('⚠️ Google 토큰 해제 실패:', error)
      }
    }

    // HIGH 이슈 수정: 에러 컨텍스트를 포함한 사용자 친화적 메시지
    const getErrorMessage = (context?: string): string => {
      if (!context) return 'Google Drive 연결에 문제가 발생했습니다.'

      if (context.includes('401') || context.includes('403')) {
        return 'Google 로그인이 만료되었거나 권한이 부족합니다.'
      }
      if (context.includes('토큰 검증')) {
        return 'Google 토큰의 권한이 올바르지 않습니다.'
      }
      if (context.includes('네트워크')) {
        return 'Google 서비스 연결에 문제가 발생했습니다.'
      }

      return `Google Drive 연결 오류: ${context}`
    }

    const errorMessage = getErrorMessage(errorContext)

    const userConfirm = confirm(
      `🔑 ${errorMessage}\n\n` +
      '자동으로 다시 로그인하시겠습니까?\n\n' +
      '확인: 다시 로그인\n' +
      '취소: 나중에 수동으로 로그인'
    )

    if (userConfirm) {
      // CRITICAL 수정: signIn() 호출 제거하여 무한 루프 방지
      console.log('✅ 토큰 정리 완료. 수동으로 로그인 버튼을 클릭하세요.')
      alert('🔑 토큰 정리가 완료되었습니다.\n로그인 버튼을 클릭하여 다시 연결하세요.')
    } else {
      console.log('ℹ️ 사용자가 수동 로그인을 선택했습니다.')
    }

  } finally {
    fixTokenInProgress = false
  }
}

const findFile = async (retryCount = 0): Promise<string | null> => {
  // 최대 재시도 횟수
  const MAX_RETRIES = 2

  if (!currentToken) {
    // 저장된 토큰에서 currentToken 복원
    const savedToken = loadToken()
    if (savedToken) {
      currentToken = savedToken.access_token
      console.log('🔄 저장된 토큰에서 currentToken 복원됨')
    } else {
      console.warn('❌ Google Drive API 토큰이 없습니다')
      if (retryCount === 0) {
        console.log('🔄 자동 로그인 시도...')
        await autoFixToken('토큰이 없음 - 자동 로그인 시도')
      }
      return null
    }
  }

  // CRITICAL 수정: 사전 검증 제거, 실제 API 호출에서 403 처리
  // verifyTokenScopes() 제거 - 실제 API 호출에서 처리하여 403 자동 복구 활성화

  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    fields: 'files(id, name)',
    q: `name='${FILE_NAME}'`
  })

  try {
    console.log('📂 Google Drive 파일 검색 중...')
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    })

    // 다양한 에러 상황 처리 - 403은 권한 부족으로 강제 리셋
    if (response.status === 401 || response.status === 403) {
      console.log(`🚨 ${response.status} 에러 감지. 토큰 문제로 판단됨`)

      if (response.status === 403) {
        // 403은 권한 부족 - 강제 토큰 리셋 (재시도 없음)
        console.log('🔥 403 Drive API 권한 부족 - 강제 토큰 리셋 실행')
        await forceTokenReset()
        throw new Error('Google Drive 권한이 부족합니다. 로그인을 다시 하여 권한을 부여하세요.')
      } else {
        // 401은 만료 - 일반 복구
        if (retryCount < MAX_RETRIES) {
          console.log(`🔄 재시도 ${retryCount + 1}/${MAX_RETRIES}`)
          try {
            await autoFixToken('401 토큰 만료')
            throw new Error('토큰 복구 완료. 다시 로그인 후 시도하세요.')
          } catch (error) {
            console.error('토큰 복구 실패:', error)
            throw error
          }
        } else {
          throw new Error(`인증 오류: ${response.status}. 재시도 횟수 초과`)
        }
      }
    }

    if (!response.ok) {
      throw new Error(`Google Drive API 오류: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const files = data.files
    const result = files && files.length > 0 ? files[0].id : null

    console.log(result ? '✅ 파일 찾기 성공' : 'ℹ️ 파일이 존재하지 않음 (첫 번째 업로드)')
    return result

  } catch (error) {
    console.error('파일 검색 중 오류:', error)

    // 403 권한 오류는 재시도하지 않고 즉시 전파
    if (error instanceof Error && error.message.includes('Google Drive 권한')) {
      console.log('🚨 권한 오류 감지 - 재시도 중단')
      throw error
    }

    // 네트워크 오류만 재시도
    if (retryCount < MAX_RETRIES && error instanceof Error &&
        (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      console.log(`🔄 네트워크 오류로 재시도 ${retryCount + 1}/${MAX_RETRIES}`)
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1초 대기
      return await findFile(retryCount + 1)
    }

    throw error
  }
}

export const uploadToDrive = async (data: SyncData, retryCount = 0): Promise<void> => {
  const MAX_RETRIES = 2

  if (!currentToken) {
    console.log('❌ 업로드용 토큰이 없습니다')
    throw new Error('Google Drive 토큰이 필요합니다. 먼저 로그인해주세요.')
  }

  // CRITICAL 수정: 사전 검증 제거, 실제 API 호출에서 403 처리
  // verifyTokenScopes() 제거 - 실제 API 호출에서 처리하여 403 자동 복구 활성화

  try {
    console.log('📂 Google Drive 파일 업로드 시작...')
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

    console.log(fileId ? '🔄 기존 파일 업데이트 중...' : '📤 새 파일 업로드 중...')

    const response = await fetch(url, {
      method: fileId ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
      body: form,
    })

    // 인증 오류 처리 - 403과 401 구분
    if (response.status === 401 || response.status === 403) {
      console.log(`🚨 업로드 중 ${response.status} 오류 발생`)

      if (response.status === 403) {
        // 403은 권한 부족 - 강제 리셋 (재시도 없음)
        console.log('🔥 403 업로드 권한 부족 - 강제 토큰 리셋 실행')
        await forceTokenReset()
        throw new Error('Google Drive 업로드 권한이 부족합니다. 다시 로그인하여 권한을 부여하세요.')
      } else {
        // 401은 만료 - 일반 복구 및 재시도
        if (retryCount < MAX_RETRIES) {
          console.log(`🔄 업로드 재시도 ${retryCount + 1}/${MAX_RETRIES}`)
          await autoFixToken('401 업로드 토큰 만료')
          return await uploadToDrive(data, retryCount + 1)
        } else {
          throw new Error(`업로드 인증 오류: ${response.status}. 재시도 횟수 초과`)
        }
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Google Drive 업로드 실패: ${response.status} - ${errorText}`)
    }

    console.log('✅ Google Drive 업로드 성공!')

  } catch (error) {
    console.error('업로드 중 오류:', error)

    if (retryCount < MAX_RETRIES && error instanceof Error && error.message.includes('네트워크')) {
      console.log(`🔄 네트워크 오류로 업로드 재시도 ${retryCount + 1}/${MAX_RETRIES}`)
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2초 대기
      return await uploadToDrive(data, retryCount + 1)
    }

    throw error
  }
}

export const downloadFromDrive = async (retryCount = 0): Promise<SyncData | null> => {
  const MAX_RETRIES = 2

  if (!currentToken) {
    console.log('❌ 다운로드용 토큰이 없습니다')
    return null
  }

  // CRITICAL 수정: 사전 검증 제거, 실제 API 호출에서 403 처리
  // verifyTokenScopes() 제거 - 실제 API 호출에서 처리하여 403 자동 복구 활성화

  try {
    console.log('📥 Google Drive에서 데이터 다운로드 시작...')
    const fileId = await findFile()

    if (!fileId) {
      console.log('ℹ️ Google Drive에 저장된 파일이 없습니다')
      return null
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    })

    // 인증 오류 처리 - 403과 401 구분
    if (response.status === 401 || response.status === 403) {
      console.log(`🚨 다운로드 중 ${response.status} 오류 발생`)

      if (response.status === 403) {
        // 403은 권한 부족 - 강제 리셋 (재시도 없음)
        console.log('🔥 403 다운로드 권한 부족 - 강제 토큰 리셋 실행')
        await forceTokenReset()
        throw new Error('Google Drive 다운로드 권한이 부족합니다. 다시 로그인하여 권한을 부여하세요.')
      } else {
        // 401은 만료 - 일반 복구 및 재시도
        if (retryCount < MAX_RETRIES) {
          console.log(`🔄 다운로드 재시도 ${retryCount + 1}/${MAX_RETRIES}`)
          await autoFixToken('401 다운로드 토큰 만료')
          return await downloadFromDrive(retryCount + 1)
        } else {
          throw new Error(`다운로드 인증 오류: ${response.status}. 재시도 횟수 초과`)
        }
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Google Drive 다운로드 실패: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Google Drive 다운로드 성공!')
    return data

  } catch (error) {
    console.error('다운로드 중 오류:', error)

    if (retryCount < MAX_RETRIES && error instanceof Error &&
        (error.message.includes('네트워크') || error.message.includes('Failed to fetch'))) {
      console.log(`🔄 네트워크 오류로 다운로드 재시도 ${retryCount + 1}/${MAX_RETRIES}`)
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2초 대기
      return await downloadFromDrive(retryCount + 1)
    }

    throw error
  }
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