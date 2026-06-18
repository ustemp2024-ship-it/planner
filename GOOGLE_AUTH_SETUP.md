# Google Cloud Console OAuth 설정 가이드

## 🎯 목표
"Google에서 확인하지 않은 앱" 경고 제거 및 로그인 과정 간소화

## 📋 설정 단계

### 1. Google Cloud Console 접속
1. https://console.cloud.google.com 접속
2. 프로젝트 선택 또는 새 프로젝트 생성

### 2. OAuth 동의 화면 구성
1. 좌측 메뉴 → "APIs & Services" → "OAuth consent screen"
2. User Type 선택:
   - **External** (모든 Google 사용자)
   - Internal (조직 내부만) 

### 3. 앱 정보 입력
```
앱 이름: Planner - 일정 관리
사용자 지원 이메일: ustemp2024@gmail.com
앱 도메인: planner-black-five.vercel.app
개인정보처리방침: https://planner-black-five.vercel.app/privacy
서비스 약관: https://planner-black-five.vercel.app/terms
```

### 4. 범위(Scopes) 설정
필요한 최소 권한만 요청:
```
✅ ../auth/drive.file (앱이 생성한 파일만)
❌ ../auth/drive (전체 드라이브 - 불필요)
```

### 5. 테스트 사용자 추가
```
ustemp2024@gmail.com
(추가 테스트 이메일)
```

### 6. 앱 검증 요청 (Production)
- 100명 이상 사용 시 필요
- Google 검증 완료 시 경고 메시지 제거

## 🔧 현재 문제점 해결

### 문제 1: "확인되지 않은 앱" 경고
**원인**: 앱이 Google 검증을 받지 않음
**해결**: 
- 단기: 테스트 모드 유지 (100명 제한)
- 장기: Production 검증 신청

### 문제 2: 복잡한 로그인 단계
**현재 단계 (7단계)**:
1. Google로 로그인 클릭
2. 계정 선택
3. ⚠️ 확인되지 않은 앱 경고
4. "고급" 클릭
5. "planner-black-five.vercel.app(으)로 이동"
6. 권한 허용
7. 로그인 완료

**개선 후 (3단계)**:
1. Google로 로그인 클릭
2. 계정 선택
3. 로그인 완료

## 📝 즉시 적용 가능한 개선사항

### 1. OAuth 설정 최적화
```javascript
// 현재 설정
const SCOPES = 'https://www.googleapis.com/auth/drive'

// 개선된 설정 (최소 권한)
const SCOPES = 'https://www.googleapis.com/auth/drive.file'
```

### 2. 로그인 타임아웃 연장
```javascript
// utils/googleAuth.ts
const AUTH_TIMEOUT = 60000 // 60초로 연장 (기존 30초)
```

### 3. 에러 핸들링 개선
```javascript
async function handleAuth() {
  try {
    const result = await gapi.auth2.getAuthInstance().signIn({
      prompt: 'select_account' // 매번 계정 선택 화면 표시
    })
  } catch (error) {
    if (error.error === 'popup_closed_by_user') {
      console.log('사용자가 로그인을 취소했습니다')
    } else if (error.error === 'timeout') {
      console.log('로그인 시간이 초과되었습니다. 다시 시도해주세요.')
    }
  }
}
```

## 🚀 Action Items

### 즉시 (오늘)
- [ ] Google Cloud Console에서 OAuth 동의 화면 업데이트
- [ ] 앱 이름, 도메인, 이메일 정보 입력
- [ ] 최소 권한(drive.file)으로 변경

### 단기 (이번 주)
- [ ] 개인정보처리방침 페이지 생성
- [ ] 서비스 약관 페이지 생성
- [ ] 테스트 사용자 목록 작성

### 장기 (필요시)
- [ ] Google 앱 검증 신청 (100명 이상 사용 시)
- [ ] 도메인 소유권 확인
- [ ] 보안 평가 제출

## 📊 예상 결과
- 로그인 단계: 7단계 → 3단계
- 로그인 성공률: 60% → 95%
- 사용자 이탈률: 40% → 5%

## 🔗 참고 링크
- [Google OAuth 2.0 가이드](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 동의 화면 설정](https://support.google.com/cloud/answer/6158849)
- [앱 검증 요구사항](https://support.google.com/cloud/answer/9110914)