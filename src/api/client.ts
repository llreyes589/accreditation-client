export const API_URL = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:8000/api"

const TOKEN_KEY = "psp.token"

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>
  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.errors = errors
  }
  /** First validation message, useful for inline form errors. */
  get firstError() {
    const e = this.errors && Object.values(this.errors)[0]
    return e?.[0] ?? this.message
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: unknown
  /** Send as multipart/form-data (file uploads). */
  form?: FormData
  signal?: AbortSignal
}

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const token = tokenStore.get()
  const headers: Record<string, string> = { Accept: "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`

  let body: BodyInit | undefined
  if (opts.form) {
    body = opts.form
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json"
    body = JSON.stringify(opts.body)
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? (body ? "POST" : "GET"),
    headers,
    body,
    signal: opts.signal,
  })

  if (res.status === 204) return undefined as T

  const text = await res.text()
  const json = text ? safeParse(text) : null

  if (!res.ok) {
    if (res.status === 401) {
      tokenStore.clear()
      if (!location.pathname.startsWith("/login")) location.href = "/login"
    }
    const msg =
      (json && typeof json === "object" && "message" in json && String(json.message)) ||
      `Request failed (${res.status})`
    const errors =
      json && typeof json === "object" && "errors" in json
        ? (json.errors as Record<string, string[]>)
        : undefined
    throw new ApiError(res.status, msg, errors)
  }

  return json as T
}

function safeParse(t: string) {
  try {
    return JSON.parse(t)
  } catch {
    return null
  }
}
