/**
 * The first name a greeting may use, from what a visitor typed as their name,
 * or null when it is not plainly a name.
 *
 * Shared by the message box's thank-you (src/components/stage/composer.tsx)
 * and the visitor's receipt email (src/lib/contact-email.ts), so the page and
 * the email greet the same way. The rule is strict on purpose: the receipt
 * goes to any address typed into the form, and this is the only text from the
 * visitor it carries, so it can never be more than a short word. The first
 * word of the name, letters in any script (accents included), apostrophes
 * and hyphens, starting with a letter, at most 30 characters. "Anne-Marie",
 * "O’Brien" and "José" pass; "Dr.", "J.R.", a URL or a 40-letter word do
 * not, and get the plain greeting instead.
 */
const FIRST_NAME = /^\p{L}[\p{L}\p{M}'’-]{0,29}$/u

export function firstName(name: string): string | null {
  const first = name.normalize('NFC').trim().split(/\s+/)[0] ?? ''
  return FIRST_NAME.test(first) ? first : null
}
