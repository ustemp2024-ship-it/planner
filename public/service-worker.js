// Service Worker for Push Notifications and Offline Support
const CACHE_NAME = 'planner-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/favicon.svg'
];

// Install event - 캐싱 및 초기 설정
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(clients.claim());
});

// Fetch event - 오프라인 지원
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시에서 찾으면 반환, 없으면 네트워크 요청
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch(() => {
        // 오프라인 상태일 때 기본 페이지 반환
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Push event - 푸시 알림 수신
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  let notificationData = {
    title: '📅 플래너 알림',
    body: '오늘의 일정을 확인하세요',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'planner-notification',
    data: {},
    requireInteraction: false,
    silent: false
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  // iOS doesn't support notification actions in some versions
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: notificationData.requireInteraction,
    silent: notificationData.silent
  };

  // Only add vibrate and actions for non-iOS devices
  if (!isIOS) {
    notificationOptions.vibrate = notificationData.vibrate;
    notificationOptions.actions = [
      { action: 'open', title: '플래너 열기', icon: '/icon-192.png' },
      { action: 'dismiss', title: '닫기' }
    ];
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    notificationOptions
  );

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // 플래너 열기
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // 이미 열려있는 탭이 있으면 포커스
        for (const client of clientList) {
          if (client.url.includes('planner') && 'focus' in client) {
            return client.focus();
          }
        }
        // 없으면 새 탭 열기
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  } else if (event.action === 'complete') {
    // 완료 처리 메시지 전송
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        clientList.forEach(client => {
          client.postMessage({
            type: 'COMPLETE_TASK',
            taskId: event.notification.data?.taskId
          });
        });
      })
    );
  } else if (event.action === 'snooze') {
    // 1시간 후 다시 알림
    setTimeout(() => {
      self.registration.showNotification(event.notification.title, {
        ...event.notification,
        tag: event.notification.tag + '-snoozed'
      });
    }, 60 * 60 * 1000);
  }
});

// Message event - 앱과의 통신
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'SYNC_TASKS') {
    // 작업 데이터 동기화
    syncTasksToIndexedDB(event.data.tasks);
  }
});

// IndexedDB에 작업 동기화
async function syncTasksToIndexedDB(tasks) {
  try {
    const db = await openDB();
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    
    // 기존 데이터 삭제
    await store.clear();
    
    // 새 데이터 추가
    for (const task of tasks) {
      await store.add(task);
    }
    
    console.log('Tasks synced to IndexedDB');
  } catch (error) {
    console.error('Error syncing tasks:', error);
  }
}

// Background sync for scheduled notifications
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-briefing') {
    event.waitUntil(sendDailyBriefing());
  } else if (event.tag === 'deadline-reminder') {
    event.waitUntil(checkDeadlines());
  } else if (event.tag === 'daily-summary') {
    event.waitUntil(sendDailySummary());
  }
});

// 아침 브리핑 (오전 8시)
async function sendDailyBriefing() {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour === 8) {
    const tasks = await getTodayTasks();
    
    if (tasks.length > 0) {
      const taskList = tasks.slice(0, 3).map(t => `• ${t.title}`).join('\n');
      const moreText = tasks.length > 3 ? `\n...외 ${tasks.length - 3}개` : '';
      
      await self.registration.showNotification('🌅 좋은 아침입니다!', {
        body: `오늘의 할 일 (${tasks.length}개)\n${taskList}${moreText}`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'daily-briefing',
        requireInteraction: true
      });
    } else {
      await self.registration.showNotification('📅 오늘의 일정', {
        body: '오늘은 예정된 일정이 없습니다. 편안한 하루 보내세요!',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'daily-briefing'
      });
    }
  }
}

// 마감 임박 체크
async function checkDeadlines() {
  const tasks = await getUpcomingDeadlines();
  
  for (const task of tasks) {
    const deadline = new Date(task.endDate);
    const now = new Date();
    const hoursLeft = Math.floor((deadline - now) / (1000 * 60 * 60));
    
    if (hoursLeft <= 24 && hoursLeft > 0 && !task.completed) {
      await self.registration.showNotification('⏰ 마감 임박!', {
        body: `"${task.title}"\n마감까지 ${hoursLeft}시간 남음`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `deadline-${task.id}`,
        requireInteraction: true,
        actions: [
          { action: 'complete', title: '완료로 표시' },
          { action: 'snooze', title: '나중에 알림' }
        ]
      });
    }
  }
}

// 일일 요약 (오후 9시)
async function sendDailySummary() {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour === 21) {
    const tasks = await getTodayTasks();
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const emoji = percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '💪';
    const message = percentage >= 80 ? '훌륭해요!' : 
                    percentage >= 50 ? '잘하고 있어요!' : 
                    '조금만 더 힘내세요!';
    
    await self.registration.showNotification('📊 오늘의 성과', {
      body: `완료: ${completed}/${total} (${percentage}%)\n${emoji} ${message}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-summary'
    });
  }
}

// IndexedDB에서 오늘 일정 가져오기
async function getTodayTasks() {
  try {
    const db = await openDB();
    const tx = db.transaction('tasks', 'readonly');
    const store = tx.objectStore('tasks');
    const tasks = await store.getAll();
    
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => 
      task.startDate <= today && task.endDate >= today
    );
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

// 마감 임박 일정 가져오기
async function getUpcomingDeadlines() {
  try {
    const db = await openDB();
    const tx = db.transaction('tasks', 'readonly');
    const store = tx.objectStore('tasks');
    const tasks = await store.getAll();
    
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return tasks.filter(task => {
      const deadline = new Date(task.endDate);
      return deadline > now && deadline <= tomorrow && !task.completed;
    });
  } catch (error) {
    console.error('Error fetching deadlines:', error);
    return [];
  }
}

// IndexedDB 연결
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PlannerDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      }
    };
  });
}