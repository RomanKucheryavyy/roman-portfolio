/**
 * Which modifier key this visitor's shortcuts use. Browser-only: the server
 * can't know, so call these after mount (in an effect, or behind a mounted
 * flag), never while rendering on the server, or the HTML and the first
 * client render disagree.
 */

interface NavigatorUAData {
  platform?: string
}

/** macOS, iOS and iPadOS. */
export function isApple(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { userAgentData?: NavigatorUAData }
  // userAgentData is Chromium-only; navigator.platform is deprecated but still
  // everywhere; the user agent string is the last resort. `||` rather than `??`
  // so an empty string falls through too.
  const platform = nav.userAgentData?.platform || nav.platform || nav.userAgent || ''
  return /mac|iphone|ipad|ipod/i.test(platform)
}

/** The glyph for the shortcut modifier: ⌘ on Apple platforms, Ctrl elsewhere. */
export function modKeyGlyph(): '⌘' | 'Ctrl' {
  return isApple() ? '⌘' : 'Ctrl'
}
