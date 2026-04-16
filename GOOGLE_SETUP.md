# Google OAuth 설정 가이드

planner에 Google 계정 연동 기능을 사용하려면 Google Cloud Console에서 OAuth 설정이 필요합니다.

## 1. Google Cloud Console 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택

## 2. API 활성화

다음 API들을 활성화해야 합니다:

1. **Google Drive API**
   - API 및 서비스 > 라이브러리에서 "Google Drive API" 검색 후 사용 설정
   
2. **Google+ API** (사용자 정보 가져오기용)
   - API 및 서비스 > 라이브러리에서 "Google+ API" 검색 후 사용 설정

## 3. OAuth 2.0 클라이언트 ID 생성

1. API 및 서비스 > 사용자 인증 정보로 이동
2. "+ 사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
3. 애플리케이션 유형: **웹 애플리케이션** 선택
4. 이름: `Planner Web App` (원하는 이름)
5. **승인된 자바스크립트 원본** 추가:
   - `http://localhost:5173` (개발용)
   - `https://planner-black-five.vercel.app` (프로덕션용)
   - 기타 필요한 도메인들

## 4. API 키 생성

1. 같은 페이지에서 "+ 사용자 인증 정보 만들기" > "API 키" 선택
2. 생성된 API 키 복사

## 5. 환경 변수 설정

`.env` 파일을 생성하고 다음 값들을 설정:

```bash
VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here
VITE_GOOGLE_API_KEY=your_actual_api_key_here
```

## 6. OAuth 동의 화면 설정

1. API 및 서비스 > OAuth 동의 화면으로 이동
2. 사용자 유형 선택:
   - **내부**: Google Workspace 조직 내 사용자만
   - **외부**: 모든 Google 계정 사용자 (테스트 모드에서는 최대 100명)
3. 앱 정보 입력:
   - 앱 이름: `플래너`
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 정보: 본인 이메일
4. 범위 추가:
   - `.../auth/drive.appdata` (앱 데이터 저장용)
   - `.../auth/userinfo.profile` (프로필 정보)
   - `.../auth/userinfo.email` (이메일 주소)

## 7. 테스트 사용자 추가 (외부 앱인 경우)

외부 앱으로 설정한 경우, 테스트 사용자로 계정을 추가해야 합니다:

1. OAuth 동의 화면 > 테스트 사용자
2. "+ 사용자 추가"로 테스트할 Google 계정들 추가

## 주의사항

- API 키는 절대 공개 저장소에 커밋하지 마세요
- 프로덕션 배포 시 도메인을 승인된 원본에 추가하세요
- 외부 앱은 Google 검토 과정이 필요할 수 있습니다

## 문제 해결

### "This app isn't verified" 오류
- OAuth 동의 화면에서 도메인 확인 필요
- 또는 "고급" > "안전하지 않은 페이지로 이동" 클릭

### CORS 오류
- 승인된 자바스크립트 원본에 현재 도메인이 포함되어 있는지 확인

### API 할당량 오류
- Google Cloud Console에서 API 사용량 및 할당량 확인