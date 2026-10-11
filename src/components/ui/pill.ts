/**
 * The outline pill: a small bordered control that fills white on hover and on
 * keyboard focus, the behaviour WorkLink's live link already has. Button's
 * `outline` variant, CopyButton and the 404's links share this one string
 * instead of each writing its own border alpha and padding.
 *
 * Plain class string, not a component, so a <button>, an <a> and a next/link
 * can all wear it without a wrapper.
 */
export const PILL_OUTLINE =
  'inline-flex items-center gap-1.5 rounded-full border border-white/25 px-4 py-2 font-mono text-label text-ink-body transition-colors hover:bg-white hover:text-black focus-visible:bg-white focus-visible:text-black'
