/**
 * The Stage page's content, in the shape its sections read (the design lab's
 * design-lab/src/lib/content.ts), built from the site's own records rather
 * than copied: src/lib/constants.ts (the work, the products, the
 * certifications, the skills and his own words), src/lib/site-facts.ts (the
 * roles and the schools) and src/lib/links.ts (where to find him). Nothing
 * here is typed twice; change a fact there and the page follows.
 *
 * Public facts only: no phone number, no support metrics (those stay behind
 * the résumé PIN).
 */
import {
  CERTIFICATIONS as CERTS,
  COMPOSITIONS,
  HIS_WORDS,
  PHOTO,
  PROJECTS as WORK,
  SITE,
  TECH_SKILLS,
} from '@/lib/constants'
import { LINKS } from '@/lib/links'
import { CURRENT_ROLE, EDUCATION as SCHOOLS, PREVIOUS_ROLES, monthYear, yearOf, type Role as Fact, type YearMonth } from '@/lib/site-facts'

const [first, ...rest] = SITE.name.split(' ')

export const PERSON = {
  name: SITE.name,
  first,
  last: rest.join(' '),
  tagline: HIS_WORDS.tagline,
  manifesto: HIS_WORDS.manifesto,
  about: HIS_WORDS.about,
  music: HIS_WORDS.music,
  photo: PHOTO,
  url: SITE.url,
  links: LINKS,
} as const

export interface Role {
  company: string
  title: string
  team?: string
  note?: string
  start: string
  end?: string
  /** "Apr 2026 – Present" */
  dates: string
  startYear: number
  endYear?: number
}

const roleOf = (r: Fact): Role => ({
  company: r.company,
  title: r.title,
  ...(r.team ? { team: r.team } : {}),
  ...(r.note ? { note: r.note } : {}),
  start: r.start,
  ...(r.end ? { end: r.end } : {}),
  dates: `${monthYear(r.start)} – ${r.end ? monthYear(r.end) : 'Present'}`,
  startYear: yearOf(r.start),
  ...(r.end ? { endYear: yearOf(r.end) } : {}),
})

/** Newest first: the current role, then the ones before it. */
export const ROLES: readonly Role[] = [CURRENT_ROLE, ...PREVIOUS_ROLES].map(roleOf)

/** Newest first. */
export const EDUCATION = SCHOOLS

/** All Salesforce, newest first. */
export const CERTIFICATIONS = CERTS

/** Screenshots are 1280×800. */
export interface Project {
  id: string
  title: string
  url?: string
  /** Shown instead of a link while there is none. */
  status?: string
  image: string
  description: string
  tags: readonly string[]
  stack?: readonly string[]
  year?: number
  color: string
  isApp?: boolean
}

/** The client work, in the site's order. */
export const PROJECTS: readonly Project[] = WORK.map((w): Project => ({ ...w }))

/** A screenshot file and its size in pixels. */
export interface Shot {
  src: string
  width: number
  height: number
}

/** One of the things a private product's description names, in its words. */
export interface FlowNode {
  id: string
  label: string
  note: string
}

/** His own products. */
export interface Product {
  id: string
  title: string
  tagline: string
  status: string
  url?: string
  description: string
  stack: readonly string[]
  color: string
  /** A public product's live site, captured (YearMonth) on a desktop and a phone. */
  preview?: { captured: YearMonth; desktop: Shot; phone: Shot }
  /** A private product's "how it works": its parts, and which feeds which. */
  flow?: { nodes: readonly FlowNode[]; links: readonly (readonly [string, string])[] }
}

export const PRODUCTS: readonly Product[] = COMPOSITIONS.map((c): Product => ({ ...c }))

export const SKILLS = TECH_SKILLS

/** "Visit site" / "App Store" / the status, for a piece of work. */
export function linkLabel(p: Project): string {
  if (!p.url) return p.status ?? 'Private build'
  return p.isApp ? 'App Store' : p.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '')
}
