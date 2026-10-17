/**
 * Central HTTP client for the CMS API (axios-based).
 *
 * Base URL comes from VITE_API_BASE_URL (see .env). The Laravel backend
 * registers routes/api.php under an `api` prefix, so every endpoint is
 * `${BASE}/api/...` — pass paths like `/login`, `/users/1` to `api()`.
 */

import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'

const API_BASE = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'https://wa.acibd.com/api/cms'
).replace(/\/+$/, '')

const TOKEN_KEY = 'cms_token'
const USER_KEY = 'cms_user'

/** Sanctum bearer-token storage (localStorage). */
export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}

/** Persisted logged-in user (kept next to the token so a refresh restores the session). */
export const userStorage = {
  get<T>(): T | null {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  },
  set: (user: unknown) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
}

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

/** Pull the most useful human message out of a Laravel error payload. */
function extractMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  const p = payload as Record<string, unknown>

  // Laravel validation: { errors: { field: ["msg", ...] } }
  if (p.errors && typeof p.errors === 'object') {
    const first = Object.values(p.errors as Record<string, unknown>)[0]
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
  }
  if (typeof p.message === 'string') return p.message
  // Some endpoints return message as { field: ["msg"] }
  if (p.message && typeof p.message === 'object') {
    const first = Object.values(p.message as Record<string, unknown>)[0]
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
  }
  if (typeof p.error === 'string') return p.error
  return undefined
}

/** Server-provided success message when it's a plain string, else the fallback. */
export function messageOr(message: unknown, fallback: string): string {
  return typeof message === 'string' && message ? message : fallback
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

const axiosInstance = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { Accept: 'application/json' },
})

type QueryParams = Record<string, string | number | boolean | null | undefined>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  params?: QueryParams
  /** Skip the Authorization header (login / register). */
  anonymous?: boolean
}

export async function api<T = unknown>(
  path: string,
  { method = 'GET', body, params, anonymous = false }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {}
  const token = tokenStorage.get()
  if (token && !anonymous) headers.Authorization = `Bearer ${token}`

  const config: AxiosRequestConfig = {
    url: path,
    method,
    headers,
    params,
    data: body,
    validateStatus: () => true,
  }

  let response: AxiosResponse
  try {
    response = await axiosInstance.request(config)
  } catch {
    throw new ApiError('Network error — could not reach the server', 0)
  }

  const payload: unknown = response.data ?? null

  // Expired / revoked token → drop the session and send the user to login.
  if (response.status === 401 && token && !anonymous) {
    tokenStorage.clear()
    window.location.assign(`${import.meta.env.BASE_URL}login`)
  }

  if (response.status < 200 || response.status >= 300) {
    throw new ApiError(
      extractMessage(payload) ?? `Request failed (${response.status})`,
      response.status,
      payload,
    )
  }
  return payload as T
}

/**
 * GET a file endpoint (e.g. an .xlsx export) with the bearer token and save it
 * in the browser under `filename`.
 */
export async function downloadFile(path: string, filename: string, params?: QueryParams): Promise<void> {
  const headers: Record<string, string> = {}
  const token = tokenStorage.get()
  if (token) headers.Authorization = `Bearer ${token}`

  let response: AxiosResponse<Blob>
  try {
    response = await axiosInstance.request<Blob>({
      url: path,
      method: 'GET',
      headers,
      params,
      responseType: 'blob',
      validateStatus: () => true,
    })
  } catch {
    throw new ApiError('Network error — could not reach the server', 0)
  }

  if (response.status === 401 && token) {
    tokenStorage.clear()
    window.location.assign(`${import.meta.env.BASE_URL}login`)
  }

  if (response.status < 200 || response.status >= 300) {
    // Errors still come back as JSON, just wrapped in a Blob.
    let payload: unknown = null
    try {
      payload = JSON.parse(await response.data.text())
    } catch {
      /* not JSON */
    }
    throw new ApiError(
      extractMessage(payload) ?? `Download failed (${response.status})`,
      response.status,
      payload,
    )
  }

  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Pick the first array found under the given keys (then common fallbacks).
 * Keeps pages resilient to minor differences in API response envelopes.
 */
export function unwrapList<T>(payload: unknown, ...keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (!payload || typeof payload !== 'object') return []
  const p = payload as Record<string, unknown>
  for (const key of [...keys, 'data', 'result', 'results']) {
    if (Array.isArray(p[key])) return p[key] as T[]
  }
  return []
}
