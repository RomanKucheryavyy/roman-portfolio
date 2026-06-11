'use client'
import { useCallback, useEffect, useRef, useState, lazy, Suspense, type ComponentType } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { ChevronUp, ChevronDown, ExternalLink, Smartphone } from 'lucide-react'
import { gsap } from '@/hooks/useGSAP'
import { useStore } from '@/stores/useStore'
import { useDeviceCapability } from '@/hooks/useDeviceCapability'
import ScatterText from '@/components/effects/ScatterText'
import { PROJECTS } from '@/lib/constants'

const Spline = lazy(() => import('@splinetool/react-spline'))
const SPLINE_IPHONE_URL = 'https://prod.spline.design/Mi7zxeQ50WnJzGOr/scene.splinecode'

type Project = (typeof PROJECTS)[number]
const SPRING = { type: 'spring', stiffness: 170, damping: 26 } as const

function CardMedia({ project, isFront, isMobileDeck }: { project: Project; isFront: boolean; isMobileDeck: boolean }) {
  const isApp = 'isApp' in project && project.isApp
  if (isApp) {
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
  return (
    <Image
      src={project.image}
      alt={project.title}
      fill
      className="object-cover pointer-events-none select-none"
      draggable={false}
      sizes={isMobileDeck ? '88vw' : '(max-width: 768px) 85vw, 50vw'}
    />
  )
}

function DesktopDeck({ onCardClick }: { onCardClick: (index: number) => void }) {
  const [deck, setDeck] = useState<Project[]>([...PROJECTS])
  const [counter, setCounter] = useState(0)
  const [exitDirection, setExitDirection] = useState<'up' | 'down' | null>(null)
  const [hovered, setHovered] = useState(false)
  const setCursorVariant = useStore((s) => s.setCursorVariant)

  const dragY = useMotionValue(0)
  const rotateX = useTransform(dragY, [-200, 0, 200], [15, 0, -15])

  const next = useCallback(() => {
    setDeck((d) => [...d.slice(1), d[0]])
    setCounter((c) => (c + 1) % PROJECTS.length)
  }, [])
  const prev = useCallback(() => {
    setDeck((d) => [d[d.length - 1], ...d.slice(0, -1)])
    setCounter((c) => (c - 1 + PROJECTS.length) % PROJECTS.length)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next()
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
  }

  return (
    <div className="relative flex flex-col items-center justify-center gap-8">
      <motion.button
        onClick={prev}
        className="p-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer"
        whileHover={{ scale: 1.1, y: -3 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronUp className="w-5 h-5 text-white/60" />
      </motion.button>

      <div className="relative w-[85vw] sm:w-[75vw] md:w-[60vw] lg:w-[50vw] xl:w-[44vw] aspect-[16/10] overflow-visible">
        <ul className="relative w-full h-full m-0 p-0">
          <AnimatePresence>
            {deck.map((project, i) => {
              const isFront = i === 0
              const brightness = Math.max(0.3, 1 - 0.15 * i)
              const originalIndex = PROJECTS.findIndex((p) => p.id === project.id)
              const isApp = 'isApp' in project && project.isApp
              return (
                <motion.li
                  key={project.id}
                  className="absolute w-full h-full list-none overflow-hidden rounded-2xl border border-white/10"
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
                    zIndex: deck.length - i,
                    opacity: exitDirection && isFront ? 0 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={SPRING}
                  drag={isFront && 'y'}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.7}
                  onDrag={(_, info) => { if (isFront) dragY.set(info.offset.y) }}
                  onDragEnd={handleDragEnd}
                  whileDrag={isFront ? { zIndex: deck.length + 1, cursor: 'grabbing', scale: 1.02 } : {}}
                  onHoverStart={() => { if (isFront) { setHovered(true); setCursorVariant('text') } }}
                  onHoverEnd={() => { setHovered(false); setCursorVariant('default') }}
                  onClick={() => { if (isFront) onCardClick(originalIndex) }}
                >
                  {/* un-transformed wrapper so rounded clipping survives the 3D rotateX */}
                  <div className="absolute inset-0 overflow-hidden rounded-2xl">
                    <CardMedia project={project} isFront={isFront} isMobileDeck={false} />
                    {!isApp && (
                      <div
                        className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-30"
                        style={{ backgroundColor: project.color }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
                    <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">
                      {String(originalIndex + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}
                    </p>
                    <h3 className="font-display text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-white leading-[0.9] mb-3">
                      {project.title}
                    </h3>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: isFront && hovered ? 1 : isFront ? 0.7 : 0, y: isFront && hovered ? 0 : 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-white/50 text-sm mb-4 max-w-lg leading-relaxed">{project.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tags.map((tag) => (
                          <span key={tag} className="px-3 py-1 rounded-full text-[10px] font-mono border border-white/15 text-white/40">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-mono text-sm text-white border border-white/20 px-5 py-2.5 rounded-full hover:bg-white hover:text-black transition-all duration-300 pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isApp ? <Smartphone size={14} /> : <ExternalLink size={14} />}
                        {isApp ? 'App Store' : 'Visit Site'}
                      </a>
                    </motion.div>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </div>

      <motion.button
        onClick={next}
        className="p-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer"
        whileHover={{ scale: 1.1, y: 3 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronDown className="w-5 h-5 text-white/60" />
      </motion.button>

      <div className="flex gap-2">
        {PROJECTS.map((_, t) => (
          <motion.div
            key={t}
            className="rounded-full transition-all duration-300"
            style={{
              width: t === counter % PROJECTS.length ? 20 : 6,
              height: 6,
              backgroundColor: t === counter % PROJECTS.length ? '#fff' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
      <p className="font-mono text-[10px] text-white/20 tracking-wider">Drag up/down or use arrows to navigate</p>
    </div>
  )
}

function MobileDeck() {
  const [deck, setDeck] = useState<Project[]>([...PROJECTS])
  const [counter, setCounter] = useState(0)
  const [exitDirection, setExitDirection] = useState<'up' | 'down' | null>(null)

  const dragY = useMotionValue(0)
  const rotateX = useTransform(dragY, [-200, 0, 200], [10, 0, -10])

  const handleDragEnd = (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
    const oy = info.offset.y
    const vy = info.velocity.y
    if (Math.abs(oy) > 40 || Math.abs(vy) > 400) {
      if (oy < 0 || vy < 0) {
        setExitDirection('up')
        setTimeout(() => {
          setDeck((d) => [...d.slice(1), d[0]])
          setCounter((c) => (c + 1) % PROJECTS.length)
          setExitDirection(null)
        }, 150)
      } else {
        setExitDirection('down')
        setTimeout(() => {
          setDeck((d) => [d[d.length - 1], ...d.slice(0, -1)])
          setCounter((c) => (c - 1 + PROJECTS.length) % PROJECTS.length)
          setExitDirection(null)
        }, 150)
      }
    }
    dragY.set(0)
  }

  return (
    <div className="relative flex flex-col items-center gap-6">
      <div className="relative w-[88vw] aspect-[3/4]" style={{ overflow: 'clip visible' }}>
        <ul className="relative w-full h-full m-0 p-0">
          <AnimatePresence>
            {deck.map((project, i) => {
              const isFront = i === 0
              const brightness = Math.max(0.3, 1 - 0.15 * i)
              const originalIndex = PROJECTS.findIndex((p) => p.id === project.id)
              const isApp = 'isApp' in project && project.isApp
              return (
                <motion.li
                  key={project.id}
                  className="absolute w-full h-full list-none overflow-hidden rounded-2xl border border-white/10"
                  style={{
                    touchAction: 'none',
                    boxShadow: isFront ? '0 20px 40px rgba(0,0,0,0.6)' : '0 10px 20px rgba(0,0,0,0.3)',
                    rotateX: isFront ? rotateX : 0,
                    transformPerspective: 800,
                  }}
                  animate={{
                    top: `${-(5 * i)}%`,
                    scale: 1 - 0.05 * i,
                    filter: `brightness(${brightness})`,
                    zIndex: deck.length - i,
                    opacity: exitDirection && isFront ? 0 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={SPRING}
                  drag={isFront && 'y'}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.7}
                  onDrag={(_, info) => { if (isFront) dragY.set(info.offset.y) }}
                  onDragEnd={handleDragEnd}
                  whileDrag={isFront ? { zIndex: deck.length + 1, scale: 1.02 } : {}}
                >
                  <div className="absolute inset-0 overflow-hidden rounded-2xl">
                    <CardMedia project={project} isFront={isFront} isMobileDeck />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                    <p className="font-mono text-[10px] text-white/30 mb-2 tracking-wider">
                      {String(originalIndex + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}
                    </p>
                    <h3 className="font-display text-3xl font-black tracking-tighter text-white leading-[0.9] mb-3">
                      {project.title}
                    </h3>
                    {isFront && (
                      <>
                        <p className="text-white/50 text-sm mb-4 leading-relaxed">{project.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 rounded-full text-[9px] font-mono border border-white/10 text-white/30">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 font-mono text-sm text-white border border-white/20 px-4 py-2 rounded-full active:bg-white active:text-black transition-all duration-300"
                        >
                          {isApp ? <Smartphone size={14} /> : <ExternalLink size={14} />}
                          {isApp ? 'App Store' : 'Visit Site'}
                        </a>
                      </>
                    )}
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </div>

      <div className="flex gap-2">
        {PROJECTS.map((_, t) => (
          <div
            key={t}
            className="rounded-full transition-all duration-300"
            style={{
              width: t === counter % PROJECTS.length ? 16 : 5,
              height: 5,
              backgroundColor: t === counter % PROJECTS.length ? '#fff' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
      <p className="font-mono text-[10px] text-white/20 tracking-wider">Swipe up/down to browse</p>
    </div>
  )
}

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null)
  const { isMobile } = useDeviceCapability()
  const [projectIndex, setProjectIndex] = useState<number | null>(null)
  const [Modal, setModal] = useState<ComponentType<{ projectIndex: number | null; onClose: () => void }> | null>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    const els = sectionRef.current.querySelectorAll('[data-reveal]')
    gsap.fromTo(
      els,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
      }
    )
  }, [])

  useEffect(() => {
    if (!isMobile) {
      import('@/components/sections/ProjectModal').then((m) => setModal(() => m.default))
    }
  }, [isMobile])

  return (
    <>
      <section ref={sectionRef} id="symphony" className="relative py-16 sm:py-24 min-h-screen flex flex-col overflow-hidden">
        <div className="relative z-10 px-6 md:px-16 mb-6 md:mb-12">
          <p data-reveal className="font-mono text-xs tracking-[0.3em] uppercase text-white/30 mb-3">
            {'// 02. Projects & Work'}
          </p>
          <h2
            data-reveal
            data-section-heading
            className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white mb-4"
          >
            <ScatterText
              className="font-display font-bold"
              scatterRadius={500}
              duration={2}
              stagger={0.05}
              onAssembled={() => {
                const el = document.querySelector('#symphony [data-section-heading]')
                if (el) el.innerHTML = 'The <span class="text-gradient">Symphony</span>'
              }}
            >
              The Symphony
            </ScatterText>
          </h2>
          <p data-reveal className="text-white/40 max-w-lg">
            {isMobile ? 'Swipe through the setlist.' : 'Drag through the setlist. Click any piece to hear its story.'}
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 pt-16 md:pt-8">
          {isMobile ? <MobileDeck /> : <DesktopDeck onCardClick={setProjectIndex} />}
        </div>
      </section>
      {!isMobile && Modal && <Modal projectIndex={projectIndex} onClose={() => setProjectIndex(null)} />}
    </>
  )
}
