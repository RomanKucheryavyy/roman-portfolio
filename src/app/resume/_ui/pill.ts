/**
 * The outline pill: a small bordered control that fills white on hover and on
 * keyboard focus, the behaviour WorkLink's live link already has. Button's
 * `outline` variant, CopyButton and the 404's links share this one string
 * instead of each writing its own border alpha and padding.
 *
 * Plain class string, not a component, so a <button>, an <a> and a next/link
 * can all wear it without a wrapper.
 */
/**
 * A phone's tap target for a control drawn smaller than 44px: an ::after that
 * reaches past the visible edge (WorkLink's pattern), so a thumb that lands
 * just off the control still hits it, and nothing on the page moves. Below md
 * only; from md up there is no ::after at all. The control becomes the
 * ::after's containing block (relative).
 *
 * TAP_PILL: a 34px pill, to 50px. TAP_TEXT: a one-line text link, to 44px.
 */
export const TAP_PILL = "relative max-md:after:absolute max-md:after:-inset-y-2 max-md:after:inset-x-0 max-md:after:content-['']"
export const TAP_TEXT = "relative max-md:after:absolute max-md:after:-inset-y-3.5 max-md:after:-inset-x-1 max-md:after:content-['']"

export const PILL_OUTLINE =
  'inline-flex items-center gap-1.5 rounded-full border border-white/25 px-4 py-2 font-mono text-label text-ink-body transition-colors hover:bg-white hover:text-black focus-visible:bg-white focus-visible:text-black'
