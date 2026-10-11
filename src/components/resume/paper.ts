/**
 * The paper palette: black type on white, for the résumé and cover-letter
 * PDFs. The builder's on-screen preview reads the same four values from
 * globals.css (--color-paper-ink / -body / -muted / -rule, used as
 * text-paper-ink and so on), so what Roman edits is what he downloads.
 * Change a value here and there together.
 *
 * Plain hex, not CSS variables: @react-pdf/renderer has no cascade to read
 * them from.
 */
export const PAPER = {
  /** Names, headings, job titles, the letter itself. */
  ink: '#111',
  /** Running text: the summary, bullets, skills. */
  body: '#333',
  /** Contact lines, dates, the tech in brackets. */
  muted: '#555',
  /** The hairline under each section heading. */
  rule: '#bbb',
} as const
