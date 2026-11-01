'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Lifeline from '@/components/ui/lifeline'
import type { LifelineMarker } from '@/components/ui/lifeline-utils/types'
import { EDUCATION, ROLES } from '@/lib/content'

/**
 * Act III's road, configured: Lifeline with Act III's own glue, in a module
 * of its own so it loads after the page with the component it styles
 * (experience.tsx loads it with next/dynamic, behind a block of its
 * height). The section, its header and the rail's box stay in the page's
 * own HTML.
 */

/**
 * One marker per year something started, each with two lines: what it was,
 * then where and when. `age` is a free label slot above the year; there is no
 * birth year in the content, so it stays empty rather than showing a made-up
 * age.
 */
function buildMarkers(): LifelineMarker[] {
  const byYear = new Map<number, string[]>()
  const add = (year: number, lines: string[]) => byYear.set(year, [...(byYear.get(year) ?? []), ...lines])
  // A date range wraps as one piece, after the "·": no break at its spaces
  // (no-break spaces) nor after its dash, where browsers break by default
  // (a word joiner).
  const keep = (dates: string) => dates.replace(/ /g, ' ').replace(/–/g, '–⁠')
  for (const r of ROLES) {
    const where = [r.company, r.team, r.note].filter(Boolean).join(', ')
    add(r.startYear, [r.title, `${where} · ${keep(r.dates)}`])
  }
  for (const e of EDUCATION) add(e.start, [e.degree, `${e.school} · ${keep(`${e.start} – ${e.end}`)}`])
  return [...byYear.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, events]) => ({ id: `y${year}`, year, age: '', events }))
}

/** Matches Lifeline's own breakpoint (Tailwind md). */
function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useLayoutEffect(() => {
    const q = window.matchMedia('(max-width: 767.98px)')
    const update = () => setMobile(q.matches)
    update()
    q.addEventListener('change', update)
    return () => q.removeEventListener('change', update)
  }, [])
  return mobile
}

/**
 * Lifeline's look, re-pointed from outside (descendant classes on the
 * component's own className). The roles are inscribed in Cinzel; the years
 * and the where and when stay in Geist (the years in Arabic figures: facts
 * to read). Every colour that Lifeline sets in a `dark:` or hover rule is
 * set here with `!`, since those rules outrank a descendant class.
 *
 * Both layouts:
 * - Lifeline holds itself invisible until its intro is armed, which also
 *   takes it out of the Tab order until then; it is shown from the start so
 *   the rail is reachable by keyboard in page order;
 * - each milestone's title (its odd lines) is Cinzel in marble, its where
 *   and when (the even lines) Geist in the muted ink.
 */
const LOOK = [
  'visible!',
  '[&_.space-y-4>p]:text-muted-foreground [&_.space-y-4>p]:odd:mb-2 [&_.space-y-4>p]:odd:font-roman [&_.space-y-4>p]:odd:font-medium [&_.space-y-4>p]:odd:leading-[1.3] [&_.space-y-4>p]:odd:tracking-[0.02em] [&_.space-y-4>p]:odd:text-foreground',
].join(' ')

/**
 * From md, the road: the rail you drag through the years, the years set in
 * a row, large in gold Geist as on a phone (brighter while its column is
 * hovered), with space between them and no line: the component's dashed
 * rail and its ticks are hidden (no rules, no axis; the years in their
 * order are the road), the ticks' room kept. Its sticky "Age" / "Years" column
 * labels nothing here (no ages, and the years read for themselves), so it
 * is hidden, and each column's empty age line is taken out, with the rail
 * set to match (Lifeline's --lifeline-rail: the 32px year and its 24px
 * margin, 3.5rem). Every column is 216px, so the whole career fits the page
 * column from 1200px up with no travel.
 */
const RAIL = [
  '[&_.lifeline-labels_p]:invisible',
  '[&_.group]:w-[216px]!',
  '[&_.group_.flex-col>p:first-child]:hidden [&_.will-change-transform]:[--lifeline-rail:3.5rem]',
  '[&_.border-dashed]:hidden! [&_.group_span[aria-hidden]]:invisible!',
  '[&_.group_.flex-col>p:nth-child(2)]:h-8 [&_.group_.flex-col>p:nth-child(2)]:text-[1.75rem] [&_.group_.flex-col>p:nth-child(2)]:leading-8 [&_.group_.flex-col>p:nth-child(2)]:font-normal [&_.group_.flex-col>p:nth-child(2)]:tracking-[0.01em] [&_.group_.flex-col>p:nth-child(2)]:text-gold! [&_.group:hover_.flex-col>p:nth-child(2)]:text-glow!',
  '[&_.space-y-4>p]:odd:text-[17px]',
].join(' ')

/**
 * Below md, the milestones as a list, newest first, with no rail, tick or
 * label row: each opens on its year set large in gold Geist (tabular
 * figures), then the role in Cinzel and the where and when in Geist. The
 * component's age column and tick column collapse to nothing.
 */
const LIST = [
  'pt-0',
  '[&_article]:px-0 [&_article]:pb-0 [&_article]:pt-0 [&_article>div:first-child]:hidden',
  '[&_article_[aria-hidden].absolute]:hidden [&_li_span[aria-hidden]]:hidden',
  '[&_article_[class*=grid-cols-]]:grid-cols-[0_0_1fr] [&_article_[class*=grid-cols-]]:gap-x-0',
  // Each entry clips what it holds: Lifeline's embed box scrolls (overflow-y:
  // auto, its own scroller, so it never moves the page), and the few px an
  // entry is held below its place before it rises would otherwise give that
  // box room to scroll, and a swipe that starts on it would stay with it
  // rather than scroll the page.
  '[&_li]:overflow-clip [&_li]:pb-12 [&_li:last-child]:pb-0',
  // The year.
  '[&_li>div>div:first-child>p:last-child]:text-[2.5rem] [&_li>div>div:first-child>p:last-child]:leading-none [&_li>div>div:first-child>p:last-child]:font-normal [&_li>div>div:first-child>p:last-child]:tracking-[0.01em] [&_li>div>div:first-child>p:last-child]:text-gold!',
  // The role, then where and when.
  '[&_li>div>div:nth-child(2)]:mt-4 [&_.space-y-4>p]:max-w-[22rem] [&_.space-y-4>p]:odd:text-lg [&_.space-y-4>p]:even:text-[15px]',
].join(' ')

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

/**
 * Act III's own motion, on a phone: the milestones are set one by one as
 * they arrive, each year rising out of its own baseline (clipped from
 * below, so it reads as cut into the page rather than sliding over it),
 * its role and where and when following, and entries that arrive together
 * a beat apart. Only entries below the screen when this runs are held;
 * each animation ends where the markup stands and lets go, so under
 * reduced motion, without scripts or if any of it is jumped past, the list
 * is simply whole. Transforms, clip and opacity: nothing moves around them.
 */
function armEntries(root: HTMLElement): () => void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  if (reduce.matches) return () => {}
  const held = new Map<Element, Animation[]>()
  for (const li of root.querySelectorAll('article li')) {
    if (li.getBoundingClientRect().top < innerHeight) continue
    const year = li.querySelector(':scope > div > div:first-child > p:last-child')
    const lines = li.querySelector(':scope > div > div:nth-child(2)')
    const anims: Animation[] = []
    const make = (el: Element | null, frames: Keyframe[], offset: number) => {
      if (!el) return
      const a = el.animate(frames, { duration: 900, delay: offset, easing: EASE, fill: 'both' })
      a.pause()
      a.finished.then(() => a.cancel(), () => {})
      anims.push(a)
    }
    make(year, [{ opacity: 0, transform: 'translateY(0.55em)', clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, transform: 'none', clipPath: 'inset(0 0 0% 0)' }], 0)
    make(lines, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], 160)
    held.set(li, anims)
  }
  if (!held.size) return () => {}

  // The root reaches far above the screen, so a jump straight past an entry
  // still reports it: passed unseen, it is let go whole.
  const io = new IntersectionObserver(
    (entries) => {
      let k = 0
      for (const entry of entries) {
        const anims = held.get(entry.target)
        if (!anims || !entry.isIntersecting) continue
        held.delete(entry.target)
        io.unobserve(entry.target)
        // Passed unseen, or landed on by the intro's nav as it lifts: whole.
        const passed = entry.boundingClientRect.bottom <= 0 || document.documentElement.hasAttribute('data-intro')
        for (const a of anims) {
          if (passed) a.cancel()
          else {
            const t = a.effect?.getTiming()
            a.effect?.updateTiming({ delay: Number(t?.delay ?? 0) + k * 140 })
            a.play()
          }
        }
        if (!passed) k++
      }
    },
    { rootMargin: '100000px 0px -12% 0px' },
  )
  for (const li of held.keys()) io.observe(li)

  const still = () => {
    if (!reduce.matches) return
    io.disconnect()
    for (const anims of held.values()) for (const a of anims) a.cancel()
    held.clear()
  }
  reduce.addEventListener('change', still)
  return () => {
    io.disconnect()
    reduce.removeEventListener('change', still)
    for (const anims of held.values()) for (const a of anims) a.cancel()
  }
}

/** The road: the rail from md, the phone's list (newest first) below it. */
export default function Road() {
  const mobile = useIsMobile()
  // The rail reads left to right in time; the phone's list, newest first.
  const markers = useMemo(() => {
    const m = buildMarkers()
    return mobile ? m.reverse() : m
  }, [mobile])

  // The list's entrance, armed once Lifeline has drawn it (it draws a blank
  // placeholder on its first render).
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!mobile || !root) return
    let stop = () => {}
    const ready = () => root.querySelector('article li') && !root.querySelector('article.invisible')
    if (ready()) return armEntries(root)
    const appear = new MutationObserver(() => {
      if (!ready()) return
      appear.disconnect()
      stop = armEntries(root)
    })
    appear.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    return () => {
      appear.disconnect()
      stop()
    }
  }, [mobile])

  return (
    <div ref={ref} className="contents">
      <Lifeline
        key={mobile ? 'vertical' : 'rail'}
        mode="embed"
        title="Experience and education, by year"
        markers={markers}
        birthYear={Math.min(...markers.map((m) => m.year))}
        className={`${LOOK} ${mobile ? LIST : RAIL}`}
      />
    </div>
  )
}
