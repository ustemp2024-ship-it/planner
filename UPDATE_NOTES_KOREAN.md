# 📱 중요 업데이트: iPhone 푸시 알림 지원

## 🎉 새로운 기능
**2024년 6월 20일 - iPhone 푸시 알림 완벽 지원!**

### 주요 업데이트 내용

#### 1. 📲 iOS 푸시 알림 (로그인 불필요)
- **iOS 16.4 이상**에서 푸시 알림 완벽 지원
- **로그인 없이도** 알림 받기 가능
- Safari에서 홈 화면에 추가하면 즉시 사용 가능

#### 2. 🔔 스마트 알림 시스템
- **아침 브리핑** (오전 8시): 오늘의 할 일 요약
- **마감 임박 알림**: 작업 마감 전 자동 알림
- **저녁 요약** (오후 9시): 하루 성과 리포트

#### 3. 🛡️ 개인정보 보호
- 익명 기기 ID 사용 (개인정보 수집 없음)
- 로컬 저장소 기반 작업 관리
- 서버는 알림 전송만 담당

## 📱 iPhone에서 설치하는 방법

### 필수 요구사항
- ✅ **iOS 16.4** 이상
- ✅ **Safari 브라우저** (크롬 X, 파이어폭스 X)
- ✅ HTTPS 도메인

### 설치 단계
1. **Safari에서 앱 열기** 
2. **공유 버튼 탭** (하단 □↑ 아이콘)
3. **"홈 화면에 추가"** 선택
4. **"추가"** 탭 (오른쪽 상단)
5. **홈 화면에서 앱 실행**
6. **알림 권한 "허용"**

## 🚀 새로운 파일 구조

```
planner/
├── 📱 iOS 지원 파일
│   ├── src/utils/ios-installer.ts      # iOS 감지 및 설치 도우미
│   ├── src/utils/push-client.ts        # 푸시 알림 클라이언트
│   └── src/components/IOSInstallPrompt.tsx # 설치 안내 UI
│
├── 🔔 푸시 서버 (push-server/)
│   ├── server.js                       # Express 푸시 서버
│   ├── database.js                     # 구독 정보 저장소
│   └── .env                           # VAPID 키 설정
│
└── 📋 문서
    ├── IPHONE_PUSH_NOTIFICATION_GUIDE.md # 상세 설치 가이드
    └── UPDATE_NOTES_KOREAN.md           # 이 문서
```

## ⚙️ 개발자를 위한 설정

### 1. 푸시 서버 실행
```bash
cd push-server
npm install
npm run generate-vapid  # VAPID 키 생성
npm start              # 서버 시작 (포트 3001)
```

### 2. 환경 변수 설정
`.env.local` 파일:
```env
VITE_PUSH_SERVER_URL=http://localhost:3001
```

### 3. 프론트엔드 실행
```bash
npm run dev
```

## 🔍 테스트 방법

### iPhone 실제 기기 테스트
1. ngrok 또는 로컬 네트워크로 HTTPS 접속
2. Safari에서 앱 열기
3. 홈 화면에 추가
4. 알림 권한 허용
5. 설정에서 "테스트 알림 보내기" 클릭

### 주요 변경 파일
- ✏️ `index.html` - iOS 메타 태그 추가
- ✏️ `public/manifest.json` - iOS 아이콘 크기 추가
- ✏️ `public/service-worker.js` - iOS 호환성 개선
- ✏️ `src/App.tsx` - iOS 설치 프롬프트 통합
- ✏️ `src/utils/notifications.ts` - 푸시 클라이언트 연동

### 새로 추가된 파일
- 🆕 `src/utils/ios-installer.ts`
- 🆕 `src/utils/push-client.ts`
- 🆕 `src/components/IOSInstallPrompt.tsx`
- 🆕 `push-server/` (전체 백엔드 서버)
- 🆕 iOS 아이콘 (120, 152, 167, 180, 512px)

## 🚨 중요 사항

### iOS 제한사항
- ⚠️ Safari에서만 작동 (Chrome/Firefox 지원 안됨)
- ⚠️ 반드시 홈 화면에 설치 필요
- ⚠️ iOS 16.4 이상 필수
- ⚠️ HTTPS 필수 (로컬 테스트시 ngrok 사용)

### 보안
- 🔐 VAPID 프라이빗 키는 서버에만 보관
- 🔐 디바이스 ID는 로컬에만 저장
- 🔐 개인정보 수집 없음

## 📞 문제 해결

### 알림이 오지 않는 경우
1. **iOS 버전 확인**: 설정 > 일반 > 정보 > 소프트웨어 버전 (16.4+)
2. **설치 확인**: 홈 화면에서 앱 실행 중인지 확인
3. **권한 확인**: 설정 > 알림 > 플래너 > 알림 허용 ON
4. **서버 상태**: `curl http://localhost:3001/health`

### 자주 묻는 질문
**Q: 왜 Safari에서만 작동하나요?**
A: Apple의 정책상 iOS에서는 Safari만 PWA 푸시 알림을 지원합니다.

**Q: 로그인 없이 어떻게 작동하나요?**
A: 각 기기에 고유 ID를 생성하여 로컬에 저장하고, 이를 통해 알림을 받습니다.

**Q: Android도 지원하나요?**
A: 네, Android는 Chrome에서 자동으로 지원됩니다.

## 🎯 다음 계획
- [ ] 알림 시간 커스터마이징
- [ ] 카테고리별 알림 설정
- [ ] 알림 히스토리 보기
- [ ] 다국어 알림 지원

## 📝 Git 커밋 메시지 (제안)
```bash
git add .
git commit -m "feat: iPhone 푸시 알림 완벽 지원 추가

- iOS 16.4+ Web Push API 지원
- 로그인 없는 익명 푸시 알림
- 푸시 알림 백엔드 서버 구현
- iOS PWA 설치 가이드 UI
- 스마트 알림 스케줄링 (아침/저녁/마감)

iPhone 사용자들이 Safari에서 홈 화면에 추가하면
로그인 없이도 푸시 알림을 받을 수 있습니다."
```

---

**업데이트 일자**: 2024년 6월 20일
**버전**: v2.0.0 (iOS Push Notification Update)
**작성자**: Claude Code Assistant