'use client'
import { useCallback, useEffect, useRef, useState, lazy, Suspense, type ComponentType } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { ArrowUpRight, ChevronUp, ChevronDown } from 'lucide-react'
import { useStore } from '@/stores/useStore'
import { useDeviceCapability } from '@/hooks/useDeviceCapability'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { SectionHeader, SectionShell } from '@/components/ui/SectionShell'
import WorkCard from '@/components/ui/WorkCard'
import { CLIENT_WORK, counterOf, type Work } from '@/lib/work'

const Spline = lazy(() => import('@splinetool/react-spline'))
const SPLINE_IPHONE_URL = 'https://prod.spline.design/Mi7zxeQ50WnJzGOr/scene.splinecode'

const SPRING = { type: 'spring', stiffness: 170, damping: 26 } as const
const TOTAL = CLIENT_WORK.length

/**
 * How many cards are drawn behind the front one. The stack offsets each card by
 * -10% and 6% of scale, so rendering the whole list sent the tail of a longer
 * deck climbing out of its own frame at half size. Five reads as depth; the
 * rest wait their turn off-stage.
 */
const STACK_DEPTH = 5

/** Spline's 3D iPhone is a multi-MB desktop flourish, so it only replaces the
 *  screenshot on the desktop deck, and only on the front card. */
function SplineIphone({ isFront }: { isFront: boolean }) {
  return (
    <div className="absolute inset-0 bg-black">
      {isFront && (
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-black">
              <div className="w-6 h-6 border border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          }
        >
          <Spline scene={SPLINE_IPHONE_URL} style={{ width: '100%', height: '100%' }} />
        </Suspense>
      )}
    </div>
  )
}

/** Screen-reader narration of the card now at the front. */
function DeckStatus({ work }: { work: Work }) {
  const index = CLIENT_WORK.findIndex((w) => w.id === work.id)
  return (
    <p className="sr-only" aria-live="polite">
      {counterOf(index, TOTAL)}: {work.title}
    </p>
  )
}

function DesktopDeck({ onOpen }: { onOpen: (index: number) => void }) {
  const [deck, setDeck] = useState<Work[]>([...CLIENT_WORK])
  const [counter, setCounter] = useState(0)
  const [exitDirection, setExitDirection] = useState<'up' | 'down' | null>(null)
  const deckRef = useRef<HTMLDivElement>(null)
  const setCursorVariant = useStore((s) => s.setCursorVariant)
  // A drag ends with a pointerup over the card, which the browser follows with
  // a click. Without this the card you just flicked away opened its detail.
  const dragged = useRef(false)
  // Arrowing through the deck from the keyboard moves the focused card to the
  // back, where it is inert; focus follows the new front card instead of
  // falling to the page.
  const refocus = useRef(false)

  const dragY = useMotionValue(0)
  const rotateX = useTransform(dragY, [-200, 0, 200], [15, 0, -15])

  const next = useCallback(() => {
    setDeck((d) => [...d.slice(1), d[0]])
    setCounter((c) => (c + 1) % TOTAL)
  }, [])
  const prev = useCallback(() => {
    setDeck((d) => [d[d.length - 1], ...d.slice(0, -1)])
    setCounter((c) => (c - 1 + TOTAL) % TOTAL)
  }, [])

  useEffect(() => {
    if (!refocus.current) return
    refocus.current = false
    // By id, not [data-front]: the card that just left is still in the DOM,
    // still marked front, for the length of its exit animation.
    deckRef.current?.querySelector<HTMLElement>(`[data-work="${deck[0].id}"] [data-open]`)?.focus()
  }, [deck])

  // Arrow keys drive the deck, but this listener is on the window: it used to
  // fire while someone was arrowing through the text they were typing into the
  // contact form, silently shuffling a section they could not even see. Only
  // act when the deck is actually on screen and the keypress is not going into
  // a field.
  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const el = target as HTMLElement | null
      if (!el?.tagName) return false
      return (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'SELECT' ||
        el.isContentEditable
      )
    }

    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      // Nor while the detail view is open over the deck.
      if ((e.target as HTMLElement | null)?.closest?.('[role="dialog"]')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const deck = deckRef.current
      if (!deck) return
      const { top, bottom } = deck.getBoundingClientRect()
      if (bottom < 0 || top > window.innerHeight) return

      const step = e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? prev
        : e.key === 'ArrowDown' || e.key === 'ArrowRight' ? next
        : null
      if (!step) return
      e.preventDefault()
      refocus.current = deck.contains(document.activeElement)
      step()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  const handleDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    const oy = info.offset.y
    const vy = info.velocity.y
    if (Math.abs(oy) > 50 || Math.abs(vy) > 500) {
      if (oy < 0 || vy < 0) {
        setExitDirection('up')
        setTimeout(() => { next(); setExitDirection(null) }, 150)
      } else {
        setExitDirection('down')
        setTimeout(() => { prev(); setExitDirection(null) }, 150)
      }
    }
    dragY.set(0)
    setTimeout(() => { dragged.current = false }, 0)
  }

  return (
    <div className="relative flex flex-col items-center justify-center gap-8">
      <motion.button
        onClick={prev}
        aria-label="Previous piece"
        className="p-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer"
        whileHover={{ scale: 1.1, y: -3 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronUp className="w-5 h-5 text-white/60" />
      </motion.button>

      <div
        ref={deckRef}
        role="region"
        aria-roledescription="deck"
        aria-label="Client work"
        className="relative w-[85vw] sm:w-[75vw] md:w-[60vw] lg:w-[50vw] xl:w-[44vw] aspect-[16/10] overflow-visible"
      >
        <DeckStatus work={deck[0]} />
        <ul className="relative w-full h-full m-0 p-0">
          <AnimatePresence>
            {deck.slice(0, STACK_DEPTH).map((work, i) => {
              const isFront = i === 0
              const brightness = Math.max(0.3, 1 - 0.15 * i)
              const originalIndex = CLIENT_WORK.findIndex((w) => w.id === work.id)
              return (
                <motion.li
                  key={work.id}
                  data-work={work.id}
                  data-front={isFront}
                  inert={!isFront}
                  className="absolute w-full h-full list-none overflow-hidden rounded-xl"
                  style={{
                    cursor: isFront ? 'grab' : 'auto',
                    touchAction: 'none',
                    boxShadow: isFront ? '0 25px 50px rgba(0,0,0,0.7)' : '0 15px 30px rgba(0,0,0,0.4)',
                    rotateX: isFront ? rotateX : 0,
                    transformPerspective: 1000,
                  }}
                  animate={{
                    top: `${-(10 * i)}%`,
                    scale: 1 - 0.06 * i,
                    filter: `brightness(${brightness})`,
                    zIndex: STACK_DEPTH - i,
                    opacity: exitDirection && isFront ? 0 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={SPRING}
                  drag={isFront && 'y'}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.7}
                  onDragStart={() => { dragged.current = true }}
                  onDrag={(_, info) => { if (isFront) dragY.set(info.offset.y) }}
                  onDragEnd={handleDragEnd}
                  whileDrag={isFront ? { zIndex: STACK_DEPTH + 1, cursor: 'grabbing', scale: 1.02 } : {}}
                  onHoverStart={() => { if (isFront) setCursorVariant('text') }}
                  onHoverEnd={() => setCursorVariant('default')}
                >
                  {/* WorkCard is un-transformed inside the rotating li, so its
                      rounded clipping survives the 3D rotateX */}
                  <WorkCard
                    work={work}
                    index={originalIndex}
                    total={TOTAL}
                    size="lg"
                    layout="overlay"
                    details={isFront ? 'dimmed' : 'hidden'}
                    media={work.isApp ? <SplineIphone isFront={isFront} /> : undefined}
                    onOpen={isFront ? () => { if (!dragged.current) onOpen(originalIndex) } : undefined}
                    imageSizes="(max-width: 768px) 85vw, 50vw"
                    className="h-full"
                  />
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </div>

      <motion.button
        onClick={next}
        aria-label="Next piece"
        className="p-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer"
        whileHover={{ scale: 1.1, y: 3 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronDown className="w-5 h-5 text-white/60" />
      </motion.button>

      <div className="flex gap-2" aria-hidden="true">
        {CLIENT_WORK.map((_, t) => (
          <motion.div
            key={t}
            className="rounded-full transition-all duration-300"
            style={{
              width: t === counter % TOTAL ? 20 : 6,
              height: 6,
              backgroundColor: t === counter % TOTAL ? '#fff' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
      <p className="font-mono text-label text-white/35 tracking-wider">Drag up/down or use arrows to navigate</p>
    </div>
  )
}

function MobileDeck() {
  const [deck, setDeck] = useState<Work[]>([...CLIENT_WORK])
  const [counter, setCounter] = useState(0)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)

  // Horizontal drag on purpose: a vertical drag axis + touchAction none on a
  // card covering most of the viewport made the page unscrollable past the
  // deck — the audit's single worst mobile finding.
  const dragX = useMotionValue(0)
  const rotateZ = useTransform(dragX, [-200, 0, 200], [-6, 0, 6])

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const ox = info.offset.x
    const vx = info.velocity.x
    if (Math.abs(ox) > 40 || Math.abs(vx) > 400) {
      if (ox < 0 || vx < 0) {
        setExitDirection('left')
        setTimeout(() => {
          setDeck((d) => [...d.slice(1), d[0]])
          setCounter((c) => (c + 1) % TOTAL)
          setExitDirection(null)
        }, 150)
      } else {
        setExitDirection('right')
        setTimeout(() => {
          setDeck((d) => [d[d.length - 1], ...d.slice(0, -1)])
          setCounter((c) => (c - 1 + TOTAL) % TOTAL)
          setExitDirection(null)
        }, 150)
      }
    }
    dragX.set(0)
  }

  return (
    <div className="relative flex flex-col items-center gap-6">
      {/* The card is a 16/10 screenshot with its details underneath, so the
          whole screenshot shows. The old 3/4 frame cropped every 1280x800 shot
          to its middle 47%. All cards share one grid cell, so the deck is as
          tall as its tallest card and every card in it is that tall too. */}
      <div
        role="region"
        aria-roledescription="deck"
        aria-label="Client work"
        className="relative w-full max-w-lg"
        style={{ overflow: 'clip visible' }}
      >
        <DeckStatus work={deck[0]} />
        <ul className="relative grid w-full m-0 p-0">
          <AnimatePresence>
            {deck.slice(0, STACK_DEPTH).map((work, i) => {
              const isFront = i === 0
              const brightness = Math.max(0.3, 1 - 0.15 * i)
              const originalIndex = CLIENT_WORK.findIndex((w) => w.id === work.id)
              return (
                <motion.li
                  key={work.id}
                  data-front={isFront}
                  inert={!isFront}
                  className="relative [grid-area:1/1] list-none overflow-hidden rounded-xl"
                  style={{
                    touchAction: 'pan-y',
                    boxShadow: isFront ? '0 20px 40px rgba(0,0,0,0.6)' : '0 10px 20px rgba(0,0,0,0.3)',
                    rotateZ: isFront ? rotateZ : 0,
                  }}
                  animate={{
                    // y in % of the card's own height, which is the deck's
                    // height: the same -5% step the absolute stack used.
                    y: `${-(5 * i)}%`,
                    scale: 1 - 0.05 * i,
                    filter: `brightness(${brightness})`,
                    zIndex: STACK_DEPTH - i,
                    opacity: exitDirection && isFront ? 0 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={SPRING}
                  drag={isFront && 'x'}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.7}
                  onDrag={(_, info) => { if (isFront) dragX.set(info.offset.x) }}
                  onDragEnd={handleDragEnd}
                  whileDrag={isFront ? { zIndex: STACK_DEPTH + 1, scale: 1.02 } : {}}
                >
                  <WorkCard
                    work={work}
                    index={originalIndex}
                    total={TOTAL}
                    size="md"
                    layout="stacked"
                    imageSizes="(max-width: 580px) 88vw, 512px"
                    className="h-full"
                  />
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </div>

      <div className="flex gap-2" aria-hidden="true">
        {CLIENT_WORK.map((_, t) => (
          <div
            key={t}
            className="rounded-full transition-all duration-300"
            style={{
              width: t === counter % TOTAL ? 16 : 5,
              height: 5,
              backgroundColor: t === counter % TOTAL ? '#fff' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
      <p className="font-mono text-label text-white/50 tracking-wider">Swipe ← → through the setlist</p>
    </div>
  )
}

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null)
  const { isMobile } = useDeviceCapability()
  const [projectIndex, setProjectIndex] = useState<number | null>(null)
  const [Modal, setModal] = useState<ComponentType<{ index: number | null; onClose: () => void }> | null>(null)
  useRevealOnScroll(sectionRef)

  useEffect(() => {
    if (!isMobile) {
      import('@/components/sections/ProjectModal').then((m) => setModal(() => m.default))
    }
  }, [isMobile])

  return (
    <>
      <SectionShell
        ref={sectionRef}
        id="symphony"
        className="min-h-svh flex flex-col overflow-hidden"
        innerClassName="flex flex-1 flex-col"
      >
        <SectionHeader
          kicker="// 02. Projects & Work"
          title={{ lead: 'The', accent: 'Symphony' }}
          intro={isMobile ? 'Swipe through the setlist.' : 'Drag through the setlist. Click any piece to hear its story.'}
        >
          <Link
            data-reveal
            href="/works"
            className="mt-4 inline-flex items-center gap-2 font-mono text-label tracking-wider text-white/50 transition-colors hover:text-white"
          >
            open the whole setlist
            <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
        </SectionHeader>
        <div className="flex-1 flex items-center justify-center pt-8">
          {isMobile ? <MobileDeck /> : <DesktopDeck onOpen={setProjectIndex} />}
        </div>
      </SectionShell>
      {!isMobile && Modal && <Modal index={projectIndex} onClose={() => setProjectIndex(null)} />}
    </>
  )
}
