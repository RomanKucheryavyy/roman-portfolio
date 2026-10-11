import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

/**
 * The head for /resume. The builder is a client component, so it can't export
 * metadata itself, and without this segment it inherited the home page's
 * title, its canonical and its "index, follow".
 *
 * Option B (the default): this is Roman's private, PIN-gated tool, so it asks
 * not to be indexed. robots.txt has to let crawlers fetch the page for them to
 * read that.
 */
export const metadata: Metadata = {
  ...pageMetadata({ path: '/resume', title: 'Résumé builder' }),
  robots: { index: false, follow: false },
}

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return children
}
