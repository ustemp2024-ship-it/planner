// Generate VAPID keys for push notifications
import webpush from 'web-push'

const vapidKeys = webpush.generateVAPIDKeys()

console.log('Generated VAPID Keys:')
console.log('======================')
console.log('')
console.log('Public Key (use in frontend):')
console.log(vapidKeys.publicKey)
console.log('')
console.log('Private Key (keep secret, use in .env):')
console.log(vapidKeys.privateKey)
console.log('')
console.log('Add these to your .env file:')
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey)
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey)
console.log('VAPID_EMAIL=mailto:your-email@example.com')