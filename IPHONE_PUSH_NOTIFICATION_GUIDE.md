# 📱 iPhone Push Notification Setup Guide

## Overview
This guide explains how to set up and test push notifications for your Planner app on iPhone without requiring user login.

## Requirements
- **iOS 16.4 or later** (required for Web Push API support)
- **HTTPS domain** (required for PWA installation)
- **Safari browser** (Chrome/Firefox on iOS don't support PWA notifications)

## Setup Instructions

### 1. Deploy Push Server

#### Option A: Deploy to Vercel (Recommended)
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy push server:
   ```bash
   cd push-server
   vercel
   ```

3. Note your server URL (e.g., `https://planner-push.vercel.app`)

#### Option B: Deploy to Heroku
1. Create Heroku app:
   ```bash
   heroku create your-planner-push
   ```

2. Deploy:
   ```bash
   cd push-server
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

#### Option C: VPS Deployment
1. Install Node.js on your server
2. Clone the push-server folder
3. Install dependencies:
   ```bash
   npm install
   ```
4. Use PM2 to run:
   ```bash
   npm install -g pm2
   pm2 start server.js --name planner-push
   ```

### 2. Generate VAPID Keys

```bash
cd push-server
npm install
npm run generate-vapid
```

Save the generated keys to `.env`:
```env
VAPID_PUBLIC_KEY=your_generated_public_key
VAPID_PRIVATE_KEY=your_generated_private_key
VAPID_EMAIL=mailto:admin@yourdomain.com
```

### 3. Configure Frontend

Update `.env.local` in the main planner directory:
```env
VITE_PUSH_SERVER_URL=https://your-push-server-url.com
```

Update `src/utils/push-client.ts` if using a different VAPID public key:
```typescript
// Line 32 - Update with your VAPID public key
return 'your_generated_public_key'
```

### 4. Deploy Frontend

#### GitHub Pages
```bash
npm run build:gh-pages
npm run deploy
```

#### Vercel
```bash
vercel --prod
```

#### Netlify
```bash
npm run build
# Deploy dist folder to Netlify
```

## iPhone Installation Steps

### For End Users:

1. **Open Safari** (not Chrome or other browsers)
2. **Navigate to your app URL** (must be HTTPS)
3. **Tap the Share button** (square with arrow at bottom of screen)
4. **Select "Add to Home Screen"**
5. **Tap "Add"** in the top right corner
6. **Open the app from home screen**
7. **Allow notifications** when prompted

### Visual Guide:
```
1. Safari → Your App
2. Tap [↑□] (Share button)
3. Scroll down → "Add to Home Screen"
4. Top right → "Add"
5. Home Screen → Tap your app icon
6. "Allow" notifications
```

## Testing Push Notifications

### 1. Test Without Login
The app works without any login:
1. Install app to home screen
2. Allow notifications
3. Wait for scheduled notifications:
   - Morning briefing (8 AM)
   - Deadline reminders (hourly)
   - Evening summary (9 PM)

### 2. Manual Test
1. Open the app
2. Go to notification settings
3. Click "테스트 알림 보내기" (Send Test Notification)

### 3. Verify Server Connection
Check browser console:
```javascript
// Should see:
// "Push subscription created: ..."
// "Subscription saved: {success: true, deviceId: ...}"
```

## Troubleshooting

### Notifications Not Working?

1. **Check iOS Version**
   - Settings → General → About → Software Version
   - Must be 16.4 or later

2. **Verify App Installation**
   - Must be added to home screen
   - Won't work from Safari browser directly

3. **Check Notification Permission**
   - Settings → Notifications → Your App
   - Ensure "Allow Notifications" is ON

4. **Test Server Connection**
   ```bash
   curl https://your-push-server.com/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

5. **Check HTTPS Certificate**
   - Must have valid SSL certificate
   - Self-signed certificates won't work

### Common Issues

**"Notification permission denied"**
- Reset Safari permissions: Settings → Safari → Clear History and Website Data
- Reinstall the app

**"Push subscription failed"**
- Check VAPID keys match between server and client
- Verify server is running and accessible

**"No notifications received"**
- Check server logs for errors
- Verify tasks are synced to server
- Test with manual notification first

## Production Checklist

- [ ] VAPID keys generated and secured
- [ ] Push server deployed with HTTPS
- [ ] Environment variables configured
- [ ] SSL certificate valid
- [ ] Icons created for all sizes (120, 152, 167, 180, 192, 512)
- [ ] manifest.json properly configured
- [ ] Service Worker registered correctly
- [ ] Database for subscriptions working
- [ ] Cron jobs scheduled for notifications
- [ ] Error logging configured
- [ ] Rate limiting implemented
- [ ] CORS properly configured

## Security Notes

1. **VAPID Private Key**: Never expose in client code
2. **Device IDs**: Generated locally, no PII collected
3. **HTTPS Required**: All communication must be encrypted
4. **Rate Limiting**: Implement to prevent spam
5. **Subscription Validation**: Verify all subscription data

## Server Monitoring

### Check Active Subscriptions
```bash
sqlite3 database.db "SELECT COUNT(*) FROM subscriptions WHERE is_active = 1;"
```

### View Recent Notifications
```bash
sqlite3 database.db "SELECT * FROM notification_log ORDER BY sent_at DESC LIMIT 10;"
```

### Monitor Server Logs
```bash
pm2 logs planner-push
# or
heroku logs --tail
```

## Support

For issues specific to iPhone/iOS:
- Ensure iOS 16.4+
- Must use Safari
- Must install as PWA
- Check notification permissions

For general issues:
- Check server status
- Verify VAPID keys
- Check browser console for errors