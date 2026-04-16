declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        callback: (response: TokenResponse) => void
        requestAccessToken: (options?: { prompt?: string }) => void
      }

      interface TokenResponse {
        access_token: string
        error?: string
        expires_in: number
        scope: string
        token_type: string
      }

      function initTokenClient(config: {
        client_id: string
        scope: string
        callback: (response: TokenResponse) => void
      }): TokenClient

      function revoke(token: string, callback: () => void): void
    }
  }
}

declare namespace gapi {
  function load(api: string, callback: () => void): void

  namespace client {
    function init(config: {
      apiKey: string
      discoveryDocs: string[]
    }): Promise<void>

    function getToken(): { access_token: string } | null
    function setToken(token: { access_token: string } | null): void
    
    function request(config: {
      path: string
      method?: string
    }): Promise<{
      result: any
    }>

    namespace drive {
      namespace files {
        function list(params: {
          spaces: string
          fields: string
          q?: string
        }): Promise<{
          result: {
            files?: Array<{ id?: string; name?: string }>
          }
        }>

        function get(params: {
          fileId: string
          alt: string
        }): Promise<{
          result: unknown
        }>

        function create(params: {
          resource: {
            name: string
            mimeType: string
            parents: string[]
          }
          media: {
            mimeType: string
            body: string
          }
          fields: string
        }): Promise<{
          result: { id: string }
        }>

        function update(params: {
          fileId: string
          media: {
            mimeType: string
            body: string
          }
        }): Promise<void>
      }
    }
  }
}
