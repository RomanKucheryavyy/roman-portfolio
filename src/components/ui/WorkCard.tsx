'use client'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { type CSSProperties, type ElementType, type ReactNode } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { counterOf, type Work } from '@/lib/work'
import ExpandableText from './ExpandableText'
import { PANEL } from './Panel'
import { TagList } from './TagPill'
import WorkLink from './WorkLink'

export type WorkCardSize = 'sm' | 'md' | 'lg'

interface WorkCardProps {
  work: Work
  /** Zero-based position in its own collection, for the "03 / 09" counter. */
  index: number
  total: number
  /**
   * sm is the wheel's card (~260px wide): counter, title and link only.
   * md is a phone-width card. lg is the desktop deck and the detail view.
   */
  size?: WorkCardSize
  /**
   * Where the description, tags and link sit: over the screenshot's scrim, or
   * under the screenshot. Overlay is for a card wide enough to read through
   * the scrim (the desktop deck); stacked is for everything narrower, where
   * an overlay would have to crop the screenshot to make room.
   */
  layout?: 'overlay' | 'stacked'
  /** Overlay only: how much of the details the deck is showing on this card. */
  details?: 'shown' | 'dimmed' | 'hidden'
  /** Replaces the screenshot (the deck's 3D iPhone). The colour wash goes with it. */
  media?: ReactNode
  /** Makes the card body a button that opens the piece's detail view. */
  onOpen?: () => void
  /** The piece's program notes (/works/<id>), only when a study is published.
   *  Drawn with the details, so never on the sm card. */
  notesHref?: string
  /** The title's element. A dialog passes its own title so it is labelled by it. */
  titleAs?: ElementType
  imageSizes?: string
  imageLoading?: 'eager' | 'lazy'
  className?: string
  style?: CSSProperties
}

/** Fixed parts of the contract. Change them here and every surface follows. */
const FRAME = cn('group/card relative overflow-hidden', PANEL)
const COUNTER = 'font-mono text-label tracking-wider text-ink-meta'
const TITLE = 'font-display font-black leading-[0.9] tracking-tighter text-white'
// The description's type. The phone clamp around it wears the same, so the
// lines it counts are this text's lines.
const BODY_TYPE = 'text-small leading-relaxed'
const BODY = `${BODY_TYPE} text-ink-body`
const SCRIM = {
  overlay: 'pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent',
  // The deck's big card puts four lines of description, the tags and the link
  // over the screenshot, where a bright one (Alongside's cream) left the copy
  // unreadable. Its lower band holds at 90% black up to 15rem, the height of
  // the details block, whatever the card's size, then fades out.
  overlayLg:
    'pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(0_0_0/0.95)_0,rgb(0_0_0/0.9)_15rem,transparent)]',
  // Ends in the card's own colour, so the screenshot melts into the details
  // panel below it instead of stopping at a visible seam.
  stacked: 'pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent',
}

const TITLE_SIZE: Record<WorkCardSize, string> = {
  sm: 'text-base',
  md: 'text-2xl sm:text-3xl',
  lg: 'text-2xl sm:text-3xl md:text-5xl',
}
const PAD: Record<WorkCardSize, string> = { sm: 'p-3', md: 'p-5', lg: 'p-6 md:p-8' }
const PAD_X: Record<WorkCardSize, string> = { sm: 'px-3', md: 'px-5', lg: 'px-6 md:px-8' }
const PAD_B: Record<WorkCardSize, string> = { sm: 'pb-3', md: 'pb-5', lg: 'pb-6 md:pb-8' }

const DETAILS: Record<NonNullable<WorkCardProps['details']>, string> = {
  shown: 'opacity-100',
  // The front of the deck at rest: readable, then full strength on hover or
  // when keyboard focus lands on the card.
  dimmed:
    'translate-y-2.5 opacity-70 group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-within/card:translate-y-0 group-focus-within/card:opacity-100',
  hidden: 'translate-y-2.5 opacity-0',
}

/** The screenshot's alt text, shared with the deck's Spline poster. */
export function altOf(work: Work) {
  return `${work.title}: ${work.isApp ? 'app' : 'homepage'} screenshot`
}

/**
 * The screenshot, its brand-colour wash and the scrim. Every source PNG is
 * 1280×800, so the frame is 16/10 everywhere and no surface crops one.
 */
function Screenshot({ work, media, sizes, loading, scrim }: {
  work: Work
  media?: ReactNode
  scrim: keyof typeof SCRIM
  sizes: string
  loading?: 'eager' | 'lazy'
}) {
  return (
    <>
      {media ?? (
        <Image
          src={work.image!}
          alt={altOf(work)}
          fill
          sizes={sizes}
          loading={loading}
          draggable={false}
          className="pointer-events-none select-none object-cover"
        />
      )}
      {!media && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply"
          style={{ backgroundColor: work.color }}
        />
      )}
      <div aria-hidden="true" className={SCRIM[scrim]} />
    </>
  )
}

/** The link to a piece's program notes. Stops the pointer so a press on it
 *  never starts a deck drag. */
function NotesLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="pointer-events-auto inline-flex items-center gap-1.5 font-mono text-label text-ink-meta transition-colors hover:text-white"
    >
      Program notes
      <ArrowRight size={12} aria-hidden="true" />
    </Link>
  )
}

function OpenButton({ work, onOpen }: { work: Work; onOpen: () => void }) {
  return (
    <button
      type="button"
      data-open
      onClick={onOpen}
      aria-label={`Open ${work.title}`}
      className="absolute inset-0 z-[1] cursor-[inherit] rounded-xl outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white/70"
    />
  )
}

/**
 * The one card every piece of work is drawn with: the home deck on desktop and
 * phone, the /works wheel and its phone list, the detail view, and the
 * products grid. Surfaces choose a size and a layout; they do not get to choose
 * the crop, the radius, the border, the wash, the counter, the pill or the link.
 */
export default function WorkCard({
  work,
  index,
  total,
  size = 'md',
  layout = 'stacked',
  details = 'shown',
  media,
  onOpen,
  notesHref,
  titleAs: Title = 'h3',
  imageSizes = '(max-width: 768px) 92vw, 50vw',
  imageLoading,
  className,
  style,
}: WorkCardProps) {
  const counter = <p className={COUNTER}>{counterOf(index, total)}</p>

  const notes = notesHref && size !== 'sm' ? <NotesLink href={notesHref} /> : null

  if (!work.image && !media) {
    return <TextCard work={work} counter={counter} notes={notes} Title={Title} className={className} style={style} />
  }

  const scrim = layout === 'overlay' && size === 'lg' ? 'overlayLg' : layout
  const screenshot = (
    <Screenshot work={work} media={media} sizes={imageSizes} loading={imageLoading} scrim={scrim} />
  )

  if (layout === 'overlay') {
    return (
      <article className={cn(FRAME, 'aspect-[16/10] w-full', className)} style={style}>
        <div className="absolute inset-0">{screenshot}</div>
        {onOpen && <OpenButton work={work} onOpen={onOpen} />}
        <div className={cn('pointer-events-none absolute inset-x-0 bottom-0 z-[2]', PAD[size])}>
          {size === 'sm' ? (
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                {counter}
                <Title className={cn(TITLE, TITLE_SIZE.sm, 'mt-1 truncate')}>{work.title}</Title>
              </div>
              <WorkLink work={work} size="sm" />
            </div>
          ) : (
            <>
              <div className="mb-2">{counter}</div>
              <Title className={cn(TITLE, TITLE_SIZE[size], 'mb-3')}>{work.title}</Title>
              <div className={cn('transition-[opacity,transform] duration-200', DETAILS[details])}>
                <p data-card-description className={cn(BODY, 'mb-4 max-w-lg')}>{work.description}</p>
                <TagList tags={work.tags} className="mb-4" />
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                  <WorkLink work={work} />
                  {notes}
                </div>
              </div>
            </>
          )}
        </div>
      </article>
    )
  }

  return (
    <article className={cn(FRAME, 'flex flex-col', className)} style={style}>
      <div className="relative aspect-[16/10] shrink-0">
        {screenshot}
        <div className={cn('pointer-events-none absolute inset-x-0 bottom-0 z-[2] pb-3', PAD_X[size])}>
          <div className="mb-2">{counter}</div>
          <Title className={cn(TITLE, TITLE_SIZE[size])}>{work.title}</Title>
        </div>
      </div>
      {onOpen && <OpenButton work={work} onOpen={onOpen} />}
      <div className={cn('relative z-[2] flex flex-1 flex-col pt-2', PAD_X[size], PAD_B[size])}>
        <p data-card-description className={BODY}>{work.description}</p>
        <div className="mt-auto flex flex-col items-start gap-4 pt-5">
          <TagList tags={work.tags} />
          <WorkLink work={work} />
          {notes}
        </div>
      </div>
    </article>
  )
}

/**
 * Products have no screenshot: they are private builds with nothing public to
 * shoot, and faking one would be worse than none. So the same frame, counter,
 * title, pills and link carry them text-first, with the brand colour as an
 * edge and a wash instead of a tint over an image.
 */
function TextCard({ work, counter, notes, Title, className, style }: {
  work: Work
  counter: ReactNode
  notes: ReactNode
  Title: ElementType
  className?: string
  style?: CSSProperties
}) {
  // Phones clamp the description to four lines; from md up it shows whole.
  const isNarrow = useMediaQuery('(max-width: 767px)')
  return (
    <article
      className={cn(FRAME, 'flex h-full flex-col transition-colors duration-500 hover:border-white/20', className)}
      style={{ borderLeft: `2px solid ${work.color}`, ...style }}
    >
      {/* resting wash on phones, hover-gated where there is a pointer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-700 md:opacity-0 md:group-hover/card:opacity-100"
        style={{ background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${work.color}14, transparent 70%)` }}
      />
      <div className="relative flex h-full flex-col p-5 md:p-7">
        <div className="mb-4 flex items-center justify-between gap-3 md:mb-5">
          {counter}
          {work.status && (
            <p className="flex items-center gap-2 text-right font-mono text-label uppercase tracking-wider text-ink-meta">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: work.color }}
              />
              {work.status}
            </p>
          )}
        </div>
        <Title className={cn(TITLE, 'text-2xl md:text-3xl')}>{work.title}</Title>
        {work.tagline && (
          <p className="mt-2 mb-4 font-mono text-label uppercase tracking-wider text-ink-meta">{work.tagline}</p>
        )}
        <ExpandableText
          lines={4}
          enabled={isNarrow}
          moreLabel="$ cat --more"
          lessLabel="$ cat --less"
          className={BODY_TYPE}
        >
          <p data-card-description className={BODY}>{work.description}</p>
        </ExpandableText>
        <div className="mt-auto flex flex-col items-start gap-4 pt-6">
          <TagList tags={work.tags} />
          <WorkLink work={work} />
          {notes}
        </div>
      </div>
    </article>
  )
}
