/**
 * The first name a greeting may use, from what a visitor typed as their name,
 * or null when it is not plainly a name.
 *
 * Shared by the message box's thank-you (src/components/stage/composer.tsx)
 * and the visitor's receipt email (src/lib/contact-email.ts), so the page and
 * the email greet the same way. The rule is strict on purpose: the receipt
 * goes to any address typed into the form, and this is the only text from the
 * visitor it carries, so it must never be able to say anything but a name. A
 * plain 30-letter limit was not enough: in a script written without spaces
 * (Chinese, Thai) 30 characters is a whole sentence, and so is CamelCase.
 *
 * The first word of the name passes when:
 * - it is letters, each with at most two accents or other marks, in one to
 *   three parts joined by an apostrophe or a hyphen ("O’Brien",
 *   "Anne-Marie"), so no digits, dots, @ or slashes: no link, address or
 *   number can ride along;
 * - all its letters are in one script, from the scripts below: no Latin
 *   word with a look-alike dot from another script in it, no mathematical
 *   bold, no invisible filler letters;
 * - in a cased script, its letters are capitals and small letters only, each
 *   part starts with either and goes on in small letters, with at most one
 *   more capital in the whole name ("LaToya", "McDonald"), so CamelCase
 *   phrases and shouting fail;
 * - it has no more letters than its script allows: 20 in a cased script, 12
 *   in other scripts that put spaces between words, 8 in Thai, Lao, Khmer and
 *   Myanmar, which run words together, and 4 in Han, Hiragana, Katakana and
 *   Hangul, where one character is a syllable or a word.
 *
 * "José", "Zoë", "D'Angelo", "Юлия", "محمد" and "李雷" pass; "Dr.", "J.R.",
 * "ALEX", a URL, "CallNowFreeBitcoin" or a 40-letter word do not, and get the
 * plain greeting instead.
 */
const SCRIPTS: Record<string, number> = {
  Latin: 20,
  Greek: 20,
  Cyrillic: 20,
  Armenian: 20,
  Georgian: 20,
  Arabic: 12,
  Hebrew: 12,
  Devanagari: 12,
  Bengali: 12,
  Gurmukhi: 12,
  Gujarati: 12,
  Oriya: 12,
  Tamil: 12,
  Telugu: 12,
  Kannada: 12,
  Malayalam: 12,
  Sinhala: 12,
  Ethiopic: 12,
  Thai: 8,
  Lao: 8,
  Khmer: 8,
  Myanmar: 8,
  Han: 4,
  Hiragana: 4,
  Katakana: 4,
  Hangul: 4,
}
const CASED = new Set(['Latin', 'Greek', 'Cyrillic', 'Armenian', 'Georgian'])
const IN_SCRIPT = Object.fromEntries(Object.keys(SCRIPTS).map((s) => [s, new RegExp(`^\\p{Script=${s}}$`, 'u')]))

/** Letters with at most two marks each, in up to three parts joined by one apostrophe or hyphen. */
const SHAPE = /^(?:\p{L}\p{M}{0,2})+(?:['’-](?:\p{L}\p{M}{0,2})+){0,2}$/u
/** A cased script's letter: a capital or a small letter, nothing else. */
const CASED_LETTER = /^[\p{Lu}\p{Ll}\p{Lt}]$/u
/** Another script's letter: a plain one, not a modifier and nothing that draws as blank. */
const PLAIN_LETTER = /^(?!\p{Default_Ignorable_Code_Point})\p{Lo}$/u
/** One part of a cased name, marks aside: either case first, then small letters, with at most one more capital. */
const CASED_PART = /^[\p{Lu}\p{Lt}]?\p{Ll}*(?:\p{Lu}\p{Ll}+)?$/u
const CAPITAL = /[\p{Lu}\p{Lt}]/gu

export function firstName(name: string): string | null {
  const first = name.normalize('NFC').trim().split(/\s+/)[0] ?? ''
  if (!SHAPE.test(first)) return null

  const letters = [...first.replace(/[\p{M}'’-]/gu, '')]
  const script = Object.keys(SCRIPTS).find((s) => IN_SCRIPT[s].test(letters[0]))
  if (!script || letters.length > SCRIPTS[script] || !letters.every((l) => IN_SCRIPT[script].test(l))) return null

  if (!CASED.has(script)) return letters.every((l) => PLAIN_LETTER.test(l)) ? first : null

  if (!letters.every((l) => CASED_LETTER.test(l))) return null
  const parts = first.replace(/\p{M}/gu, '').split(/['’-]/)
  if (!parts.every((p) => CASED_PART.test(p))) return null
  // Each part may open with a capital; past those, one more in the whole name.
  const inner = parts.reduce((n, p) => n + (p.slice(1).match(CAPITAL)?.length ?? 0), 0)
  return inner <= 1 ? first : null
}
