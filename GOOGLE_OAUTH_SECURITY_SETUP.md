# Google OAuth 보안 설정 가이드

## 🔒 보안 문제 해결

Google Cloud Console에서 지적한 보안 문제들을 해결하기 위한 설정 가이드입니다.

### 1. 계정 간 보안 (Cross-Account Security)

#### 문제
- 프로젝트가 계정 간 보안을 위해 구성되지 않음

#### 해결 방법

**Google Cloud Console 설정:**

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 선택
3. **APIs & Services** > **OAuth consent screen**
4. **Edit App** 클릭
5. **Authorized domains** 섹션에서:
   - `planner-black-five.vercel.app` 추가
   - 추가 도메인이 있다면 모두 등록

6. **APIs & Services** > **Credentials**
7. OAuth 2.0 Client ID 클릭
8. **Authorized redirect URIs**에 추가:
   ```
   https://planner-black-five.vercel.app
   https://planner-black-five.vercel.app/auth/callback
   http://localhost:5173
   http://localhost:5173/auth/callback
   ```

### 2. 보안 OAuth 흐름 (PKCE Implementation)

#### 문제
- 앱이 보안 OAuth 흐름을 사용하도록 구성되지 않음
- 명의 도용에 취약할 수 있음

#### 해결 방법

**PKCE (Proof Key for Code Exchange) 구현:**

이미 `oauth-security.ts`에 구현되어 있습니다. Google Cloud Console에서 설정:

1. **APIs & Services** > **Credentials**
2. OAuth 2.0 Client ID 선택
3. **Application type**: Web application 확인
4. **Advanced settings** 섹션에서:
   - ✅ **PKCE** 활성화
   - ✅ **Require PKCE for public clients** 체크

### 3. 점진적 승인 (Incremental Authorization)

#### 문제
- OAuth 클라이언트가 점진적 승인을 제대로 지원하지 않을 수 있음

#### 해결 방법

**Google Cloud Console 설정:**

1. **APIs & Services** > **OAuth consent screen**
2. **Scopes** 섹션에서 범위를 단계별로 구성:

   **필수 범위 (초기 로그인):**
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

   **선택적 범위 (필요시 요청):**
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/drive.appdata`

3. **Save and Continue**

### 4. 추가 보안 설정

#### API 제한 설정

1. **APIs & Services** > **Credentials**
2. API Key 선택 (있는 경우)
3. **API restrictions** 섹션:
   - **Restrict key** 선택
   - 필요한 API만 선택:
     - Google Drive API
     - Google Identity Toolkit API

#### Application restrictions

1. **HTTP referrers** 선택
2. Website restrictions 추가:
   ```
   https://planner-black-five.vercel.app/*
   http://localhost:5173/*
   ```

### 5. 환경 변수 설정

**.env.local 파일:**
```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-client-secret  # 서버사이드에서만 사용
VITE_REDIRECT_URI=https://planner-black-five.vercel.app/auth/callback
```

### 6. 보안 체크리스트

- [ ] HTTPS 사용 (Vercel은 자동 제공)
- [ ] PKCE 구현 완료
- [ ] State parameter 검증
- [ ] Token 암호화 저장
- [ ] Cross-account security 구현
- [ ] Incremental authorization 구현
- [ ] Content Security Policy (CSP) 헤더 설정
- [ ] X-Frame-Options 헤더 설정
- [ ] Strict-Transport-Security 헤더 설정

### 7. Vercel 환경 변수 설정

[Vercel Dashboard](https://vercel.com) > Project Settings > Environment Variables:

```
VITE_GOOGLE_CLIENT_ID = your-client-id
```

### 8. 테스트 사용자 추가 (개발 단계)

OAuth consent screen이 "Testing" 상태인 경우:

1. **APIs & Services** > **OAuth consent screen**
2. **Test users** 섹션
3. **Add users** 클릭
4. 테스트할 이메일 주소 추가

### 9. 프로덕션 준비

**앱 검증 신청:**

1. **OAuth consent screen** > **Publish app**
2. 필요한 정보 제공:
   - Privacy Policy URL
   - Terms of Service URL
   - Support email
   - App domain verification
3. Google 검증 프로세스 진행 (1-2주 소요)

### 10. 모니터링 설정

**Google Cloud Console에서:**

1. **APIs & Services** > **Metrics**
2. 알림 설정:
   - 비정상적인 API 사용량
   - 인증 실패율
   - Rate limit 도달

### 보안 업데이트 적용 방법

```typescript
// src/utils/googleDrive.ts 업데이트
import { 
  incrementalAuth, 
  crossAccountSecurity,
  tokenSecurity 
} from './oauth-security'

// 로그인 시 보안 기능 활성화
export const signIn = async () => {
  // Cross-account security
  const userInfo = await getUserInfo()
  crossAccountSecurity.setCurrentAccount(userInfo.id)
  
  // Incremental authorization
  if (!incrementalAuth.hasDriveAccess()) {
    await incrementalAuth.requestAdditionalScopes(
      tokenClient,
      incrementalAuth.getDriveScopes().split(' ')
    )
  }
  
  // Secure token storage
  await tokenSecurity.storeToken(token, userInfo.id)
}
```

## 문제 해결

### "앱이 확인되지 않음" 경고
- 개발 중에는 정상입니다
- 프로덕션: OAuth consent screen 검증 필요

### PKCE 관련 오류
- 브라우저가 Web Crypto API를 지원하는지 확인
- HTTPS 환경에서만 작동

### Cross-account 오류
- 계정 전환 시 localStorage 정리
- 각 계정별로 별도 세션 유지

## 지원 및 문의

보안 관련 문제가 발생하면:
1. [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2) 참조
2. [Google Cloud Support](https://cloud.google.com/support) 문의
3. GitHub Issues에 보고 (민감한 정보 제외)