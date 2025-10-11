import type { User, Session } from '@/types'
import { Busboy } from '@fastify/busboy'
import { Readable } from 'node:stream'

/**
 * File metadata from multipart/form-data uploads
 */
export type FileInfo = {
  fieldname: string
  filename: string
  encoding: string
  mimetype: string
}

/**
 * Parsed multipart/form-data body
 */
export type MultipartBody = Record<string, string> & {
  _files?: FileInfo[]
}

/**
 * Request context that flows through the handler pipeline
 * Contains all request data and state
 */
export type Context = {
  /** Original Web Standard Request */
  request: Request

  /** HTTP method (GET, POST, DELETE, etc.) */
  method: string

  /** Request path (/auth/session) */
  path: string

  /** URL query parameters */
  query: Record<string, string>

  /** Request headers */
  headers: Headers

  /**
   * Parsed request body (if POST/PUT/PATCH)
   * Can be: null | JSON value | Record<string, string> | MultipartBody
   */
  body: unknown

  /** URL path parameters (e.g., { id: '123' } from /sessions/:id) */
  params: Record<string, string>

  /** Current user (if authenticated) */
  user: User | null

  /** Current session (if exists) */
  session: Session | null

  /** Hooks for this endpoint (if registered) */
  hooks: {
    before?: () => Promise<void>
    after?: () => Promise<void>
  }
}

/**
 * Parse multipart/form-data using busboy
 */
async function parseMultipartForm(request: Request, contentType: string): Promise<MultipartBody> {
  return new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: { 'content-type': contentType } })
    const fields: Record<string, string> = {}
    const files: FileInfo[] = []

    busboy.on('field', (fieldname: string, value: string) => {
      fields[fieldname] = value
    })

    busboy.on('file', (fieldname: string, file: any, info: { filename: string; encoding: string; mimeType: string }) => {
      const { filename, encoding, mimeType } = info
      files.push({ fieldname, filename, encoding, mimetype: mimeType })
      // Skip file data for now (auth doesn't need file uploads)
      file.resume()
    })

    busboy.on('finish', () => {
      const result: MultipartBody = fields
      if (files.length > 0) {
        result._files = files
      }
      resolve(result)
    })

    busboy.on('error', (error) => {
      reject(error)
    })

    if (request.body) {
      Readable.fromWeb(request.body as any).pipe(busboy)
    } else {
      resolve(fields)
    }
  })
}

/**
 * Build context from Web Standard Request
 */
export async function buildContext(request: Request): Promise<Omit<Context, 'params' | 'user' | 'session' | 'hooks'>> {
  const url = new URL(request.url)
  const method = request.method
  const path = url.pathname
  const query = Object.fromEntries(url.searchParams)
  const headers = request.headers

  // Parse body for POST/PUT/PATCH requests
  let body: unknown = null
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    const contentType = headers.get('content-type') || ''
    const text = contentType.includes('multipart/form-data') ? null : await request.text()

    if (contentType.includes('application/json')) {
      body = text ? JSON.parse(text) : null
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      body = Object.fromEntries(new URLSearchParams(text || ''))
    } else if (contentType.includes('multipart/form-data')) {
      body = await parseMultipartForm(request, contentType)
    }
  }

  return {
    request,
    method,
    path,
    query,
    headers,
    body,
  }
}
