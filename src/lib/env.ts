import 'server-only'
import { createHash, timingSafeEqual } from 'node:crypto'
import { LINKS } from '@/lib/constants'

/**
 * Every setting the API routes read, read here and nowhere else.
 *
 * The routes used to reach into process.env ad hoc, and each variable had a
 * format nothing stated: RESUME_PIN must be 4–8 digits, because that is all
 * the PIN screen can submit (a numeric field, at most 8, unlock disabled under
 * 4), so any other value locked the builder for good with no error. Each
 * getter applies its variable's rule and returns null for a value that breaks
 * it, so a route treats a malformed setting exactly like a missing one, and
 * featureReport() says which it was. src/instrumentation.ts logs that report
 * once when a server starts.
 *
 * Nothing here throws. CI, deploy previews and a fresh clone build and run
 * with no env at all; every feature that needs a key degrades on its own.
 *
 * Getters read process.env on every call rather than once at import, so a
 * value set at runtime is honoured.
 */

/** ok: set and well-formed. missing: unset or blank. invalid: set, but breaks its rule. */
export type EnvState = 'ok' | 'missing' | 'invalid'

const PIN_RULE = /^\d{4,8}$/
const ADDRESS = '[^\\s@,<>]+@[^\\s@,<>]+\\.[^\\s@,<>]{2,}'
/** One CONTACT_TO entry: a bare address, or Resend's `Name <address>` form. */
const RECIPIENT_RULE = new RegExp(`^(?:${ADDRESS}|[^<>,]*<${ADDRESS}>)$`)

/** A variable's value, trimmed; undefined when it is unset or blank. */
function read(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

function stateOf(value: string | undefined, valid: (v: string) => boolean): EnvState {
  if (value === undefined) return 'missing'
  return valid(value) ? 'ok' : 'invalid'
}

// ── Résumé builder ─────────────────────────────────────────────────────────

const pinState = () => stateOf(read('RESUME_PIN'), (v) => PIN_RULE.test(v))

/** RESUME_PIN, 4–8 digits. Without a valid one every PIN is refused. */
export function resumePin(): string | null {
  return pinState() === 'ok' ? read('RESUME_PIN')! : null
}

/**
 * Whether a submitted PIN is the configured one. The four résumé routes all
 * ask this, so there is one comparison: constant-time, over fixed-length
 * digests, so neither the digits nor the length leak through timing.
 */
export function pinMatches(candidate: unknown): boolean {
  const pin = resumePin()
  if (!pin || typeof candidate !== 'string' || !candidate) return false
  const digest = (s: string) => createHash('sha256').update(s).digest()
  return timingSafeEqual(digest(candidate), digest(pin))
}

/** ANTHROPIC_API_KEY, for the builder's tailor and cover-letter tools. */
export function anthropicApiKey(): string | null {
  return read('ANTHROPIC_API_KEY') ?? null
}

// ── Contact form ───────────────────────────────────────────────────────────

const resendState = () => stateOf(read('RESEND_API_KEY'), (v) => v.startsWith('re_'))

/** RESEND_API_KEY. Resend's keys all start with re_; anything else would be refused by Resend anyway. */
export function resendApiKey(): string | null {
  return resendState() === 'ok' ? read('RESEND_API_KEY')! : null
}

const recipients = (v: string) => v.split(',').map((a) => a.trim()).filter(Boolean)
const contactToState = () =>
  stateOf(read('CONTACT_TO'), (v) => recipients(v).length > 0 && recipients(v).every((a) => RECIPIENT_RULE.test(a)))

/**
 * CONTACT_TO, a comma-separated list of addresses, each bare or in the
 * `Name <address>` form Resend accepts. Unset or malformed, mail
 * goes to the site's own address instead: a typo in a setting must not lose
 * a lead.
 */
export function contactTo(): string[] {
  return contactToState() === 'ok' ? recipients(read('CONTACT_TO')!) : [LINKS.email]
}

/**
 * CONTACT_FROM. Resend's shared sender only delivers to the Resend account's
 * own address; verify romankucheryavyy.com in Resend to send from the domain.
 */
export function contactFrom(): string {
  return read('CONTACT_FROM') ?? 'Portfolio <onboarding@resend.dev>'
}

/**
 * The site's own origin on Netlify. Netlify sets URL (and DEPLOY_PRIME_URL on
 * previews) and nothing else does, so without one this is not running on
 * Netlify and there is no Netlify Forms handler to post to.
 */
export function netlifyOrigin(): string | null {
  return read('URL') ?? read('DEPLOY_PRIME_URL') ?? null
}

// ── The report ─────────────────────────────────────────────────────────────

export interface FeatureReport {
  /** The contact form's working delivery channels. None: every visitor gets the mailto fallback. */
  contact: ('resend' | 'netlify-forms')[]
  resend: EnvState
  /** Missing is fine (mail goes to the site's address); invalid means a setting is being ignored. */
  contactTo: EnvState
  resumePin: EnvState
  resumeAi: boolean
}

export function featureReport(): FeatureReport {
  const contact: FeatureReport['contact'] = []
  if (resendApiKey()) contact.push('resend')
  if (netlifyOrigin()) contact.push('netlify-forms')
  return {
    contact,
    resend: resendState(),
    contactTo: contactToState(),
    resumePin: pinState(),
    resumeAi: anthropicApiKey() !== null,
  }
}

/** True when some feature is off or some setting is being ignored. */
export function hasDisabledFeatures(r: FeatureReport): boolean {
  return r.contact.length === 0 || r.resend !== 'ok' || r.contactTo === 'invalid' || r.resumePin !== 'ok' || !r.resumeAi
}

/**
 * The report as one log line, e.g.
 * `[env] contact: netlify-forms (resend: missing) · resumePin: invalid · resumeAi: off`.
 * Names states only, never a value.
 */
export function describeFeatures(r: FeatureReport): string {
  const contact = r.contact.length ? r.contact.join(', ') : 'none, mailto fallback only'
  const notes = [r.resend !== 'ok' && `resend: ${r.resend}`, r.contactTo === 'invalid' && 'contactTo: invalid, using the site address']
    .filter(Boolean)
    .join(', ')
  return [
    `[env] contact: ${contact}${notes ? ` (${notes})` : ''}`,
    `resumePin: ${r.resumePin}`,
    `resumeAi: ${r.resumeAi ? 'on' : 'off'}`,
  ].join(' · ')
}
