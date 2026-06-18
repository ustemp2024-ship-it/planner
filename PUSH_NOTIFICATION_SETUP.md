# Push 알림 설정 가이드

## 1. 현재 구현된 기능

### Service Worker (/public/service-worker.js)
- ✅ 오프라인 지원 (캐싱)
- ✅ Push 알림 수신
- ✅ Background Sync (주기적 알림)
- ✅ IndexedDB를 통한 작업 데이터 동기화
- ✅ 알림 클릭 액션 처리

### 알림 타입
1. **아침 브리핑** (오전 8시)
   - 오늘의 할 일 목록 표시
   - 최대 3개 항목 미리보기

2. **마감 임박 알림**
   - 24시간 이내 마감 작업 알림
   - 완료/스누즈 액션 버튼

3. **일일 요약** (오후 9시)
   - 오늘의 성과 통계
   - 완료율 및 격려 메시지

### NotificationManager 클래스
- Push 구독 관리
- VAPID 키 처리
- IndexedDB 초기화
- 알림 스케줄링

## 2. 백엔드 구현 필요 사항

### Push 서버 설정
```javascript
// 필요한 패키지 설치
npm install web-push express body-parser

// server.js 예시
const webpush = require('web-push');

// VAPID 키 생성 (한 번만 실행)
const vapidKeys = webpush.generateVAPIDKeys();
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);

// 서버 설정
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Push 구독 엔드포인트
app.post('/api/push-subscription', async (req, res) => {
  const subscription = req.body;
  // 데이터베이스에 구독 정보 저장
  await saveSubscription(subscription);
  res.status(201).json({});
});

// Push 알림 전송
app.post('/api/send-notification', async (req, res) => {
  const { userId, title, body } = req.body;
  const subscription = await getSubscription(userId);
  
  const payload = JSON.stringify({
    title,
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  });
  
  await webpush.sendNotification(subscription, payload);
  res.status(200).json({});
});
```

### 환경 변수 설정
```env
# .env.local
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNOJyTgwrEwK9lbetRcougxkRgLpPs1DX0YCfA5ZzXu4z9p_Et5EnW8vxxPMBIysOTlJ0cxecMAt54cI4yhwIKg
VAPID_PRIVATE_KEY=your_private_key_here
```

## 3. 프론트엔드 통합

### App.tsx에서 알림 초기화
```typescript
useEffect(() => {
  // Service Worker 등록 및 알림 권한 요청
  const initNotifications = async () => {
    await notificationManager.register();
    
    const settings = notificationManager.getSettings();
    if (settings.enabled) {
      // 알림 스케줄 설정
      if (settings.dailyBriefing) {
        await notificationManager.scheduleNotification('daily-briefing');
      }
      if (settings.dailySummary) {
        await notificationManager.scheduleNotification('daily-summary');
      }
    }
  };
  
  initNotifications();
}, []);
```

### 작업 변경 시 동기화
```typescript
useEffect(() => {
  // Service Worker에 작업 데이터 동기화
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SYNC_TASKS',
      tasks: tasks
    });
  }
}, [tasks]);
```

## 4. 테스트 방법

### 로컬 테스트
1. Chrome DevTools > Application > Service Workers 확인
2. Push 알림 권한 허용
3. NotificationSettings 컴포넌트에서 "테스트 알림 보내기" 클릭
4. Background Sync 테스트:
   ```javascript
   // DevTools Console에서
   await navigator.serviceWorker.ready;
   await registration.sync.register('daily-briefing');
   ```

### 프로덕션 체크리스트
- [ ] VAPID 키 쌍 생성 및 환경 변수 설정
- [ ] Push 구독 API 엔드포인트 구현
- [ ] 사용자별 구독 정보 데이터베이스 저장
- [ ] 예약 알림을 위한 크론 작업 설정
- [ ] FCM/APNs 연동 (모바일 지원)

## 5. 보안 고려사항

### VAPID 키 관리
- Private Key는 서버에만 저장
- Public Key는 클라이언트에 노출 가능
- 환경 변수로 관리

### 구독 정보 보호
- HTTPS 필수
- 구독 정보 암호화 저장
- 사용자 인증 후에만 구독 허용

## 6. 트러블슈팅

### 일반적인 문제
1. **"Notification permission denied"**
   - 브라우저 설정에서 알림 권한 확인
   - HTTPS 환경인지 확인

2. **Service Worker 등록 실패**
   - `/public` 폴더에 service-worker.js 존재 확인
   - MIME type이 'application/javascript'인지 확인

3. **Push 구독 실패**
   - VAPID Public Key 확인
   - 브라우저 Push API 지원 확인

### 브라우저 지원
- Chrome/Edge: 완전 지원
- Firefox: 완전 지원
- Safari: 제한적 지원 (macOS 13+, iOS 16.4+)
- Samsung Internet: 완전 지원

## 7. 향후 개선사항

1. **스마트 알림**
   - 사용자 활동 패턴 학습
   - 최적 알림 시간 자동 조정

2. **알림 카테고리**
   - 중요도별 알림 분류
   - 카테고리별 설정 관리

3. **리치 알림**
   - 이미지/차트 포함
   - 인터랙티브 액션 버튼

4. **크로스 디바이스 동기화**
   - 여러 기기에서 알림 상태 공유
   - 중복 알림 방지