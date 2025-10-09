import { z } from 'zod'

/**
 * API method parameters schema
 * Note: headers are unknown since they can be any framework type
 */
export const ApiMethodParamsSchema = z.object({
  headers: z.unknown().optional().meta({
    id: 'headers',
    title: 'Request Headers',
    description: 'HTTP headers from any framework (Headers, ReadonlyHeaders, plain object, etc.)',
  }),
  body: z.record(z.string(), z.unknown()).optional().meta({
    id: 'body',
    title: 'Request Body',
    description: 'Request body data as key-value pairs',
  }),
  query: z.record(z.string(), z.unknown()).optional().meta({
    id: 'query',
    title: 'Query Parameters',
    description: 'URL query parameters as key-value pairs',
  }),
})

/**
 * Inferred TypeScript type from ApiMethodParamsSchema
 */
export type ApiMethodParams = z.infer<typeof ApiMethodParamsSchema>
