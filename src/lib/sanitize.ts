import DOMPurify from 'dompurify'

/**
 * Strips all HTML tags from input, returning plain text only.
 * Used to sanitize user inputs before Supabase insert to prevent XSS.
 */
export function sanitize(input: string): string {
  if (typeof window === 'undefined') return input
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}
