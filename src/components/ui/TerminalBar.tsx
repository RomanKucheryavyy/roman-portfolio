'use client'
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

const DOT = 'h-2.5 w-2.5 shrink-0 rounded-full'

/**
 * The three window dots. There were four copies (Compose, Conductor, the nav's
 * terminal menu, CodePeek) built three ways. `pulse` beats the green one
 * twice, as Compose does when a message goes out; reduced motion keeps it
 * still.
 */
export function TerminalDots({ pulse = false }: { pulse?: boolean }) {
  const reduced = useReducedMotion()
  return (
    <span className="flex items-center gap-2" aria-hidden="true">
      <span className={`${DOT} bg-[#ff5f57]`} />
      <span className={`${DOT} bg-[#febc2e]`} />
      <motion.span
        className={`${DOT} bg-[#28c840]`}
        animate={pulse && !reduced ? { scale: [1, 1.6, 1, 1.6, 1] } : {}}
        transition={{ duration: 0.8 }}
      />
    </span>
  )
}

interface TerminalBarProps {
  /** The window title, in mono text-label ink-meta. */
  title: ReactNode
  /** Announce title changes (Compose's "message sent — 250 OK"). */
  live?: boolean
  pulse?: boolean
  /** Anything after the title, like a right-aligned status. */
  children?: ReactNode
}

/** A terminal window's title bar: the dots, a title, then whatever else the window needs. */
export function TerminalBar({ title, live = false, pulse = false, children }: TerminalBarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
      <TerminalDots pulse={pulse} />
      <span className="ml-3 font-mono text-label text-ink-meta" aria-live={live ? 'polite' : undefined}>
        {title}
      </span>
      {children}
    </div>
  )
}

export default TerminalBar
