import 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    suppressBusinessToast?: boolean
    suppressBusinessCodes?: number[]
    suppressAuthRedirect?: boolean
    allowGuestAccount?: boolean
    authToken?: string | false
    xClub?: string | number | false
  }

  interface InternalAxiosRequestConfig {
    suppressBusinessToast?: boolean
    suppressBusinessCodes?: number[]
    suppressAuthRedirect?: boolean
    allowGuestAccount?: boolean
    authToken?: string | false
    xClub?: string | number | false
  }
}

export {}
