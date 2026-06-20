// iOS PWA Installation Helper
export class IOSInstaller {
  private isIOS: boolean = false
  private isStandalone: boolean = false
  private hasShownPrompt: boolean = false

  constructor() {
    this.detectIOSDevice()
    this.checkStandaloneMode()
    this.hasShownPrompt = localStorage.getItem('ios-install-prompt-shown') === 'true'
  }

  private detectIOSDevice(): void {
    const userAgent = navigator.userAgent.toLowerCase()
    const isIPhone = /iphone/.test(userAgent)
    const isIPad = /ipad/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|firefox|fxios/.test(userAgent)
    
    this.isIOS = (isIPhone || isIPad) && isSafari
  }

  private checkStandaloneMode(): void {
    // Check if app is running as installed PWA
    this.isStandalone = 
      ('standalone' in window.navigator && (window.navigator as any).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches
  }

  public shouldShowInstallPrompt(): boolean {
    // Show prompt only if:
    // 1. Device is iOS Safari
    // 2. App is not already installed
    // 3. Haven't shown prompt recently (24 hours)
    if (!this.isIOS || this.isStandalone) {
      return false
    }

    const lastPromptTime = localStorage.getItem('ios-install-prompt-time')
    if (lastPromptTime) {
      const daysSinceLastPrompt = (Date.now() - parseInt(lastPromptTime)) / (1000 * 60 * 60 * 24)
      if (daysSinceLastPrompt < 1) {
        return false
      }
    }

    return true
  }

  public markPromptShown(): void {
    this.hasShownPrompt = true
    localStorage.setItem('ios-install-prompt-shown', 'true')
    localStorage.setItem('ios-install-prompt-time', Date.now().toString())
  }

  public dismissPrompt(permanently: boolean = false): void {
    if (permanently) {
      localStorage.setItem('ios-install-prompt-dismissed', 'true')
    }
    localStorage.setItem('ios-install-prompt-time', Date.now().toString())
  }

  public isIOSDevice(): boolean {
    return this.isIOS
  }

  public isAppInstalled(): boolean {
    return this.isStandalone
  }

  public getInstallInstructions(): string[] {
    if (!this.isIOS) return []
    
    const isIPad = /ipad/.test(navigator.userAgent.toLowerCase()) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    
    if (isIPad) {
      return [
        '상단 주소창 옆 공유 버튼을 탭하세요',
        '"홈 화면에 추가"를 선택하세요',
        '오른쪽 상단 "추가"를 탭하세요'
      ]
    } else {
      return [
        '하단 공유 버튼(□↑)을 탭하세요',
        '"홈 화면에 추가"를 선택하세요',
        '오른쪽 상단 "추가"를 탭하세요'
      ]
    }
  }

  public canUseNotifications(): boolean {
    // iOS 16.4+ supports Web Push API for installed PWAs
    if (!this.isIOS) return 'Notification' in window

    // Check iOS version
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)/)
    if (match) {
      const majorVersion = parseInt(match[1])
      const minorVersion = parseInt(match[2])
      
      // iOS 16.4 or higher
      if (majorVersion > 16 || (majorVersion === 16 && minorVersion >= 4)) {
        // Must be installed as PWA
        return this.isStandalone
      }
    }
    
    return false
  }

  public getIOSVersion(): { major: number; minor: number } | null {
    if (!this.isIOS) return null
    
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)/)
    if (match) {
      return {
        major: parseInt(match[1]),
        minor: parseInt(match[2])
      }
    }
    return null
  }

  public isNotificationSupported(): boolean {
    // Check if notifications are supported on this device/browser
    if (!('Notification' in window)) return false
    if (!('serviceWorker' in navigator)) return false
    if (!('PushManager' in window)) return false
    
    // For iOS, additional checks
    if (this.isIOS) {
      const version = this.getIOSVersion()
      if (!version) return false
      
      // Need iOS 16.4+ and must be installed as PWA
      const isVersionSupported = version.major > 16 || 
                                 (version.major === 16 && version.minor >= 4)
      
      return isVersionSupported && this.isStandalone
    }
    
    return true
  }
}

// Singleton instance
export const iosInstaller = new IOSInstaller()