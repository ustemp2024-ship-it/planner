// 강제 OAuth 토큰 리셋 스크립트
console.log('🔥 강제 OAuth 토큰 리셋 시작...')

// localStorage 정리
try {
  localStorage.removeItem('planner-google-token')
  console.log('✅ localStorage 토큰 제거')
} catch (e) {
  console.warn('localStorage 정리 실패:', e)
}

// sessionStorage 정리
try {
  sessionStorage.removeItem('planner-google-token')
  sessionStorage.clear()
  console.log('✅ sessionStorage 정리 완료')
} catch (e) {
  console.warn('sessionStorage 정리 실패:', e)
}

// Google Identity Services 토큰 해제
try {
  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.oauth2.revoke('', () => {
      console.log('✅ Google 세션 해제 완료')
    })
  }
} catch (e) {
  console.warn('Google 세션 해제 실패:', e)
}

console.log('✅ 강제 리셋 완료! 페이지를 새로고침하세요.')