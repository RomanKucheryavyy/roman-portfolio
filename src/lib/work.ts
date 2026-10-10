import { COMPOSITIONS, PROJECTS } from '@/lib/constants'

/**
 * One shape for every piece of work on the site, so that one card can draw
 * all of it. Client sites and Roman's own products used to be rendered by six
 * hand-written layouts that each read the raw constants their own way; they
 * disagreed on the crop, the link, the colour and what an unlaunched piece
 * looks like. Everything now goes through here and then through <WorkCard>.
 */
export interface Work {
  id: string
  /** Client work is built for someone; a product is one Roman builds and runs. */
  kind: 'client' | 'product'
  title: string
  description: string
  /** Brand hex: the wash over a screenshot, or the accent on a card without one. */
  color: string
  /** Categories for client work, the stack for products. Same pill either way. */
  tags: readonly string[]
  /** A 1280×800 screenshot. Products have none: they are private builds. */
  image?: string
  /** A native app, so its link is the App Store rather than a website. */
  isApp?: boolean
  /** Products only: one line on what it is. */
  tagline?: string
  /** Public address. Absent while a client site is unlaunched, or for a private build. */
  url?: string
  /** Where it stands, in words: "Launching soon", "Paper trading daily". */
  status?: string
}

export const CLIENT_WORK: readonly Work[] = PROJECTS.map((project) => ({ ...project, kind: 'client' }))

export const PRODUCTS: readonly Work[] = COMPOSITIONS.map(({ stack, ...product }) => ({
  ...product,
  tags: stack,
  kind: 'product',
}))

/**
 * What a card offers the visitor, decided once. Every card has exactly one
 * action slot: a way out to the real thing, or a plain statement of why there
 * isn't one. The four ways unlaunched work used to be shown (a dashed pill, a
 * dead card, a 10px label, nothing) are now this.
 */
export type WorkAction =
  | { kind: 'site'; href: string; label: string }
  | { kind: 'app'; href: string; label: string }
  | { kind: 'pending'; label: string }
  | { kind: 'private'; label: string }

export function actionOf(work: Work): WorkAction {
  if (work.url) {
    return work.isApp
      ? { kind: 'app', href: work.url, label: 'App Store' }
      : { kind: 'site', href: work.url, label: domainOf(work.url) }
  }
  if (work.kind === 'client') return { kind: 'pending', label: work.status ?? 'In development' }
  return { kind: 'private', label: 'Private build' }
}

/** "https://www.fubcband.com/" → "fubcband.com". The domain is the proof. */
export function domainOf(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
}

const pad = (n: number) => String(n).padStart(2, '0')

/** The one numbering format: "03 / 09". `index` is zero-based. */
export function counterOf(index: number, total: number): string {
  return `${pad(index + 1)} / ${pad(total)}`
}
