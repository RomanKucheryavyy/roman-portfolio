import { MOVEMENTS, keyColor, movementOf, type MovementId } from '@/lib/score'

/**
 * The code comment between two movements, over a hairline that runs from the
 * key of the movement just finished into the key of the one beginning.
 *
 * `movement` is the one being entered; its caption comes from score.ts. The
 * caption is still: it used to drift 40px on a ScrollTrigger scrub of its
 * own, sit at a different opacity on phones than on desktop, and draw its
 * hairline in a sixth palette of hex colours nothing else used.
 */
export default function SectionTransition({ movement }: { movement: MovementId }) {
  const { caption, key } = movementOf(movement)
  const i = MOVEMENTS.findIndex((m) => m.id === movement)
  const from = MOVEMENTS[Math.max(0, i - 1)].key
  return (
    <div className="relative w-full overflow-hidden" style={{ height: '60px' }} aria-hidden="true" data-transition={movement}>
      <span className="absolute inset-x-0 bottom-1/2 mb-2 text-center font-mono text-label tracking-wider text-ink-faint">
        {caption}
      </span>
      <div
        className="absolute inset-x-0 top-1/2 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${keyColor(from)}, ${keyColor(key)}, transparent)`,
          opacity: 0.2,
        }}
      />
    </div>
  )
}
