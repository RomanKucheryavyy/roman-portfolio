/**
 * An act header's entrance (section-header.tsx loads this after the page,
 * so it costs the first load almost nothing): the inscription is cut, its
 * parts one after another as the header rises into view, once. The
 * numeral rises with its letters closing up from wide to their set
 * spacing, the kicker slides in, the title rises, the intro follows.
 *
 * Only a header that starts below the screen is held: its marked parts
 * (data-reveal) are held at their first frame until it enters, then
 * played. A header on screen, or above it, when this runs (a link to
 * #credentials, a restored scroll) gets no entrance: nothing seen is
 * hidden to be brought in again. Each animation ends where the markup
 * already stands and lets go when done, so without scripts, under reduced
 * motion, or if this never loads, the header is simply whole. Transforms,
 * opacity and the numeral's own letter-spacing (alone on its line, so
 * nothing else moves): no layout shift. Never the hero's h1, which is not
 * an act header.
 */
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

/** Each part's first frame; the last is where the markup stands (letter-spacing implicit). */
const FRAMES: Record<string, Keyframe[]> = {
  numeral: [
    { opacity: 0, transform: 'translateY(0.32em)', letterSpacing: '0.2em' },
    { opacity: 1, transform: 'none' },
  ],
  kicker: [
    { opacity: 0, transform: 'translateX(-0.75rem)' },
    { opacity: 1, transform: 'none' },
  ],
  title: [
    { opacity: 0, transform: 'translateY(0.45em)' },
    { opacity: 1, transform: 'none' },
  ],
  intro: [
    { opacity: 0, transform: 'translateY(0.75rem)' },
    { opacity: 1, transform: 'none' },
  ],
}

/** Arms one header's entrance; returns what disarms it (and lets every part go). */
export function arm(box: HTMLElement): () => void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  if (reduce.matches) return () => {}
  // Only below the screen: on it or above it, no entrance.
  if (box.getBoundingClientRect().top < innerHeight) return () => {}

  const anims = Array.from(box.querySelectorAll<HTMLElement>('[data-reveal]'), (el, i) => {
    const frames = FRAMES[el.dataset.reveal ?? '']
    if (!frames) return null
    const a = el.animate(frames, { duration: 900, delay: i * 110, easing: EASE, fill: 'both' })
    a.pause()
    a.finished.then(() => a.cancel(), () => {})
    return a
  }).filter((a): a is Animation => a !== null)

  // The root reaches far above the screen, so a jump straight past the
  // header (a nav link, the End key) still reports it: passed unseen, it is
  // simply let go, whole, with no entrance left waiting above the reader.
  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries[entries.length - 1]
      if (!entry.isIntersecting) return
      io.disconnect()
      const passed = entry.boundingClientRect.bottom <= 0
      for (const a of anims) {
        if (passed) a.cancel()
        else a.play()
      }
    },
    { rootMargin: '100000px 0px -15% 0px' },
  )
  io.observe(box)

  // Reduced motion switched on before it plays: let every part go.
  const still = () => {
    if (!reduce.matches) return
    io.disconnect()
    for (const a of anims) a.cancel()
  }
  reduce.addEventListener('change', still)

  return () => {
    io.disconnect()
    reduce.removeEventListener('change', still)
    for (const a of anims) a.cancel()
  }
}
