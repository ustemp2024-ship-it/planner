// Service Worker for Push Notifications
const CACHE_NAME = 'planner-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
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
    data: {}
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

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: notificationData.vibrate,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: [
        { action: 'open', title: '플래너 열기', icon: '/icon-192.png' },
        { action: 'dismiss', title: '닫기' }
      ]
    }
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
      clients.openWindow('https://planner-black-five.vercel.app')
    );
  }
});

// Background sync for scheduled notifications
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-reminder') {
    event.waitUntil(sendDailyReminder());
  }
});

async function sendDailyReminder() {
  const now = new Date();
  const hour = now.getHours();
  
  // 오전 8시에만 알림 전송
  if (hour === 8) {
    // IndexedDB에서 오늘 일정 가져오기
    const tasks = await getTodayTasks();
    
    if (tasks && tasks.length > 0) {
      const notification = {
        title: '🌅 좋은 아침입니다!',
        body: `오늘의 할 일: ${tasks.length}개`,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        data: { tasks }
      };

      await self.registration.showNotification(notification.title, notification);
    }
  }
}

// Helper function to get today's tasks from IndexedDB
async function getTodayTasks() {
  // This would connect to your app's IndexedDB
  // and fetch today's tasks
  // For now, returning mock data
  return [];
}