// OAuth 2.0 Security Implementation with PKCE (Proof Key for Code Exchange)
// This implements security best practices for OAuth 2.0 in browser applications

/**
 * Generate a random string for PKCE code verifier
 */
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return values.reduce((acc, x) => acc + possible[x % possible.length], '')
}

/**
 * Calculate SHA256 hash of the input string
 */
async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return crypto.subtle.digest('SHA-256', data)
}

/**
 * Base64 encode for URLs (removes padding and replaces characters)
 */
function base64urlencode(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer)
  const binString = String.fromCharCode(...bytes)
  return btoa(binString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * PKCE (Proof Key for Code Exchange) implementation
 * Prevents authorization code interception attacks
 */
export class PKCEClient {
  private codeVerifier: string
  private codeChallenge: string = ''
  private state: string
  
  constructor() {
    // Generate code verifier (43-128 characters)
    this.codeVerifier = generateRandomString(128)
    
    // Generate state parameter for CSRF protection
    this.state = generateRandomString(32)
    
    // Store in session storage for later verification
    this.storeSecurityParams()
  }
  
  /**
   * Generate the code challenge from the verifier
   */
  async generateChallenge(): Promise<string> {
    const hashed = await sha256(this.codeVerifier)
    this.codeChallenge = base64urlencode(hashed)
    return this.codeChallenge
  }
  
  /**
   * Get authorization URL with PKCE parameters
   */
  async getAuthorizationUrl(
    clientId: string,
    redirectUri: string,
    scope: string,
    additionalParams: Record<string, string> = {}
  ): Promise<string> {
    await this.generateChallenge()
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      code_challenge: this.codeChallenge,
      code_challenge_method: 'S256',
      state: this.state,
      access_type: 'offline', // Request refresh token
      prompt: 'select_account consent', // Ensure proper consent
      ...additionalParams
    })
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }
  
  /**
   * Store security parameters in session storage
   */
  private storeSecurityParams(): void {
    const params = {
      codeVerifier: this.codeVerifier,
      state: this.state,
      timestamp: Date.now()
    }
    sessionStorage.setItem('pkce_params', JSON.stringify(params))
  }
  
  /**
   * Verify the state parameter from the callback
   */
  verifyState(receivedState: string): boolean {
    const stored = sessionStorage.getItem('pkce_params')
    if (!stored) return false
    
    const params = JSON.parse(stored)
    
    // Check if state matches and not expired (10 minutes)
    const isValid = params.state === receivedState && 
                   (Date.now() - params.timestamp) < 600000
    
    if (!isValid) {
      console.error('State verification failed or expired')
    }
    
    return isValid
  }
  
  /**
   * Get the code verifier for token exchange
   */
  getCodeVerifier(): string {
    const stored = sessionStorage.getItem('pkce_params')
    if (!stored) {
      throw new Error('PKCE parameters not found')
    }
    
    const params = JSON.parse(stored)
    return params.codeVerifier
  }
  
  /**
   * Clean up stored parameters after successful authentication
   */
  cleanup(): void {
    sessionStorage.removeItem('pkce_params')
  }
}

/**
 * Incremental Authorization Manager
 * Implements progressive consent for better UX
 */
export class IncrementalAuth {
  private baseScopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ]
  
  private driveScopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata'
  ]
  
  private grantedScopes: Set<string> = new Set()
  
  constructor() {
    this.loadGrantedScopes()
  }
  
  /**
   * Load previously granted scopes from storage
   */
  private loadGrantedScopes(): void {
    const stored = localStorage.getItem('granted_scopes')
    if (stored) {
      const scopes = JSON.parse(stored)
      this.grantedScopes = new Set(scopes)
    }
  }
  
  /**
   * Save granted scopes to storage
   */
  private saveGrantedScopes(): void {
    localStorage.setItem('granted_scopes', 
      JSON.stringify(Array.from(this.grantedScopes))
    )
  }
  
  /**
   * Get the minimum required scopes for initial login
   */
  getInitialScopes(): string {
    return this.baseScopes.join(' ')
  }
  
  /**
   * Get additional scopes needed for Drive operations
   */
  getDriveScopes(): string {
    return this.driveScopes.join(' ')
  }
  
  /**
   * Check if Drive access has been granted
   */
  hasDriveAccess(): boolean {
    return this.driveScopes.every(scope => this.grantedScopes.has(scope))
  }
  
  /**
   * Request additional scopes incrementally
   */
  async requestAdditionalScopes(
    tokenClient: any,
    scopes: string[]
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const newScopes = scopes.filter(s => !this.grantedScopes.has(s))
      
      if (newScopes.length === 0) {
        resolve(true)
        return
      }
      
      tokenClient.callback = (response: any) => {
        if (response.error) {
          console.error('Failed to get additional scopes:', response.error)
          resolve(false)
        } else {
          // Add new scopes to granted list
          newScopes.forEach(s => this.grantedScopes.add(s))
          this.saveGrantedScopes()
          resolve(true)
        }
      }
      
      tokenClient.requestAccessToken({
        scope: newScopes.join(' '),
        prompt: 'consent'
      })
    })
  }
  
  /**
   * Update granted scopes from token response
   */
  updateGrantedScopes(scopeString: string): void {
    const scopes = scopeString.split(' ')
    scopes.forEach(s => this.grantedScopes.add(s))
    this.saveGrantedScopes()
  }
}

/**
 * Cross-Account Security Manager
 * Handles secure account switching and prevents data leakage
 */
export class CrossAccountSecurity {
  private currentAccountId: string | null = null
  
  /**
   * Set the current account ID
   */
  setCurrentAccount(accountId: string): void {
    if (this.currentAccountId && this.currentAccountId !== accountId) {
      // Account switch detected - clear sensitive data
      this.handleAccountSwitch()
    }
    
    this.currentAccountId = accountId
    sessionStorage.setItem('current_account_id', accountId)
  }
  
  /**
   * Handle account switch securely
   */
  private handleAccountSwitch(): void {
    console.log('Account switch detected - clearing sensitive data')
    
    // Clear all session data
    sessionStorage.clear()
    
    // Clear sensitive local storage items
    const sensitiveKeys = [
      'planner-google-token',
      'granted_scopes',
      'pkce_params'
    ]
    
    sensitiveKeys.forEach(key => localStorage.removeItem(key))
    
    // Notify the app about account switch
    window.dispatchEvent(new CustomEvent('account-switched'))
  }
  
  /**
   * Verify that the current session matches the expected account
   */
  verifyAccountConsistency(accountId: string): boolean {
    const storedId = sessionStorage.getItem('current_account_id')
    
    if (!storedId) {
      // First login in this session
      this.setCurrentAccount(accountId)
      return true
    }
    
    if (storedId !== accountId) {
      console.warn('Account mismatch detected')
      this.handleAccountSwitch()
      return false
    }
    
    return true
  }
  
  /**
   * Clear all authentication data on logout
   */
  clearAuthData(): void {
    this.currentAccountId = null
    sessionStorage.clear()
    
    // Keep non-sensitive data like preferences
    const keysToRemove = [
      'planner-google-token',
      'granted_scopes',
      'current_account_id'
    ]
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }
}

/**
 * Token Security Manager
 * Handles secure token storage and validation
 */
export class TokenSecurity {
  private readonly TOKEN_KEY = 'planner-google-token'
  private readonly ENCRYPTION_KEY = 'planner-encryption-key'
  
  /**
   * Store token securely with additional metadata
   */
  async storeToken(token: any, accountId: string): Promise<void> {
    const tokenData = {
      ...token,
      accountId,
      storedAt: Date.now(),
      expiresAt: Date.now() + (token.expires_in * 1000),
      fingerprint: await this.generateFingerprint()
    }
    
    // In production, encrypt the token before storage
    const securedToken = this.encryptToken(tokenData)
    localStorage.setItem(this.TOKEN_KEY, securedToken)
  }
  
  /**
   * Retrieve and validate stored token
   */
  async getToken(): Promise<any | null> {
    const stored = localStorage.getItem(this.TOKEN_KEY)
    if (!stored) return null
    
    try {
      const tokenData = this.decryptToken(stored)
      
      // Validate token integrity
      if (!this.validateToken(tokenData)) {
        console.warn('Token validation failed')
        this.clearToken()
        return null
      }
      
      // Check if token is expired
      if (tokenData.expiresAt <= Date.now()) {
        console.log('Token expired')
        this.clearToken()
        return null
      }
      
      return tokenData
    } catch (error) {
      console.error('Failed to retrieve token:', error)
      this.clearToken()
      return null
    }
  }
  
  /**
   * Simple encryption (in production, use Web Crypto API)
   */
  private encryptToken(data: any): string {
    // This is a simplified version - use proper encryption in production
    const json = JSON.stringify(data)
    return btoa(json)
  }
  
  /**
   * Simple decryption (in production, use Web Crypto API)
   */
  private decryptToken(encrypted: string): any {
    // This is a simplified version - use proper decryption in production
    const json = atob(encrypted)
    return JSON.parse(json)
  }
  
  /**
   * Generate a browser fingerprint for token binding
   */
  private async generateFingerprint(): Promise<string> {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth.toString(),
      screen.width.toString(),
      screen.height.toString(),
      new Date().getTimezoneOffset().toString()
    ]
    
    const fingerprint = components.join('|')
    const hash = await sha256(fingerprint)
    return base64urlencode(hash)
  }
  
  /**
   * Validate token integrity and binding
   */
  private async validateToken(tokenData: any): Promise<boolean> {
    if (!tokenData || !tokenData.fingerprint) return false
    
    // Check if browser fingerprint matches
    const currentFingerprint = await this.generateFingerprint()
    
    // Allow some flexibility for minor changes
    // In production, implement more sophisticated fingerprinting
    return tokenData.fingerprint === currentFingerprint
  }
  
  /**
   * Clear stored token
   */
  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY)
  }
}

// Export singleton instances
export const pkceClient = new PKCEClient()
export const incrementalAuth = new IncrementalAuth()
export const crossAccountSecurity = new CrossAccountSecurity()
export const tokenSecurity = new TokenSecurity()