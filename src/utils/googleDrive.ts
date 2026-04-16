const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
const FILE_NAME = 'planner-data.json'
const TOKEN_KEY = 'planner-google-token'

let tokenClient: google.accounts.oauth2.TokenClient | null = null
let gapiInited = false
let gisInited = false

const saveToken = (token: { access_token: string; expires_in: number }) => {
  const expiresAt = Date.now() + token.expires_in * 1000
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ ...token, expiresAt }))
}

const loadToken = (): { access_token: string; expiresAt: number } | null => {
  const stored = localStorage.getItem(TOKEN_KEY)
  if (!stored) return null
  try {
    const token = JSON.parse(stored)
    if (token.expiresAt > Date.now()) {
      return token
    }
    localStorage.removeItem(TOKEN_KEY)
    return null
  } catch {
    return null
  }
}

const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

export interface SyncData {
  categories: unknown[]
  tasks: unknown[]
  lastModified: string
}

export const initGoogleApi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (gapiInited && gisInited) {
      resolve()
      return
    }

    const initGapi = () => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
          })
          const savedToken = loadToken()
          if (savedToken) {
            gapi.client.setToken({ access_token: savedToken.access_token })
          }
          gapiInited = true
          if (gisInited) resolve()
        } catch (err) {
          reject(err)
        }
      })
    }

    const initGis = () => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: () => {},
      })
      gisInited = true
      if (gapiInited) resolve()
    }

    if (typeof gapi !== 'undefined') {
      initGapi()
    } else {
      const gapiScript = document.createElement('script')
      gapiScript.src = 'https://apis.google.com/js/api.js'
      gapiScript.onload = initGapi
      gapiScript.onerror = () => reject(new Error('Failed to load gapi'))
      document.body.appendChild(gapiScript)
    }

    if (typeof google !== 'undefined' && google.accounts) {
      initGis()
    } else {
      const gisScript = document.createElement('script')
      gisScript.src = 'https://accounts.google.com/gsi/client'
      gisScript.onload = initGis
      gisScript.onerror = () => reject(new Error('Failed to load gis'))
      document.body.appendChild(gisScript)
    }
  })
}

export const signIn = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client not initialized'))
      return
    }

    tokenClient.callback = (response) => {
      if (response.error) {
        reject(new Error(response.error))
        return
      }
      saveToken({ access_token: response.access_token, expires_in: response.expires_in })
      resolve()
    }

    if (gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' })
    } else {
      tokenClient.requestAccessToken({ prompt: '' })
    }
  })
}

export const signOut = () => {
  const token = gapi.client.getToken()
  if (token) {
    google.accounts.oauth2.revoke(token.access_token, () => {})
    gapi.client.setToken(null)
  }
  clearToken()
}

export const isSignedIn = (): boolean => {
  try {
    return gapi?.client?.getToken() !== null
  } catch (e) {
    return false
  }
}

const findFile = async (): Promise<string | null> => {
  const response = await gapi.client.drive.files.list({
    spaces: 'appDataFolder',
    fields: 'files(id, name)',
    q: `name='${FILE_NAME}'`,
  })
  const files = response.result.files
  return files && files.length > 0 ? files[0].id! : null
}

export const uploadToDrive = async (data: SyncData): Promise<void> => {
  const fileId = await findFile()
  const metadata = {
    name: FILE_NAME,
    mimeType: 'application/json',
    ...(fileId ? {} : { parents: ['appDataFolder'] }),
  }

  const form = new FormData()
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  )
  form.append(
    'file',
    new Blob([JSON.stringify(data)], { type: 'application/json' })
  )

  const token = gapi.client.getToken()?.access_token
  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'

  const response = await fetch(url, {
    method: fileId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  })

  if (!response.ok) {
    throw new Error('Failed to upload to Drive')
  }
}

export const downloadFromDrive = async (): Promise<SyncData | null> => {
  const fileId = await findFile()
  if (!fileId) return null

  const response = await gapi.client.drive.files.get({
    fileId,
    alt: 'media',
  })

  return response.result as SyncData
}
