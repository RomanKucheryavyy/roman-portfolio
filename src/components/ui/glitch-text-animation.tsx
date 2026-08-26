'use client'

import React, { useState, useEffect, useRef, useCallback, useId } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

const GLITCH_CHARS = '01100101!@#$%^&*()_+-=[]{}|;:,.<>?/\\'
const SCRAMBLE_SPEED = 25 // character shuffle interval (ms)
const SCRAMBLE_TICKS = 12 // shuffle ticks before the word resolves

interface GlitchTextProps {
  text?: string
  highlightWords?: string[]
  /** Applied to the row of words, so type scale and spacing stay the caller's call. */
  className?: string
  /** The scanline-and-border card. Off when the text should sit bare in a section. */
  framed?: boolean
  /** The component's own full-height, centred page shell. Off inside a layout. */
  fullScreen?: boolean
}

interface GlitchWordProps {
  word: string
  isHighlightable: boolean
  isParagraphFocused: boolean
  onHoverStart: () => void
  onHoverEnd: () => void
}

const GlitchWord = ({
  word,
  isHighlightable,
  isParagraphFocused,
  onHoverStart,
  onHoverEnd,
}: GlitchWordProps) => {
  const [displayText, setDisplayText] = useState(word)
  const [isHovered, setIsHovered] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reduceMotion = useReducedMotion()

  // Per-character cipher scramble: letters resolve left to right as ticks accrue.
  const triggerGlitchScramble = useCallback(() => {
    if (reduceMotion) return
    let tick = 0
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      const scrambled = word
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' '
          if (tick / (SCRAMBLE_TICKS / word.length) > index) return char
          return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
        })
        .join('')

      setDisplayText(scrambled)
      tick++

      if (tick >= SCRAMBLE_TICKS) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setDisplayText(word)
      }
    }, SCRAMBLE_SPEED)
  }, [word, reduceMotion])

  const stopGlitchScramble = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setDisplayText(word)
  }, [word])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const start = () => {
    setIsHovered(true)
    onHoverStart()
    triggerGlitchScramble()
  }

  const end = () => {
    setIsHovered(false)
    onHoverEnd()
    stopGlitchScramble()
  }

  const showGlitchLayers = isHovered && !reduceMotion

  return (
    <motion.span
      onMouseEnter={start}
      onMouseLeave={end}
      // Touch has no hover, so a tap plays the scramble once and releases.
      onTouchStart={start}
      onTouchEnd={end}
      onTouchCancel={end}
      className={`relative inline-block font-mono tracking-widest ${
        isHighlightable ? 'cursor-pointer font-bold' : 'cursor-default'
      }`}
      animate={{
        opacity: isParagraphFocused && !isHovered ? 0.35 : 1,
        filter: isParagraphFocused && !isHovered ? 'blur(1px)' : 'blur(0px)',
      }}
    >
      {/* RGB split — red channel, hover only */}
      <AnimatePresence>
        {showGlitchLayers && (
          <motion.span
            initial={{ opacity: 0, x: 0 }}
            animate={{
              opacity: [0, 0.9, 0.2, 0.8, 0],
              x: [-2, 3, -4, 2, 0],
              y: [1, -1, 2, 0],
              skewX: [0, -12, 10, -5, 0],
            }}
            transition={{ duration: 0.3, repeat: Infinity, repeatType: 'mirror' }}
            className="absolute top-0 left-0 text-red-500 pointer-events-none select-none z-0 opacity-80 mix-blend-screen"
            aria-hidden="true"
          >
            {displayText}
          </motion.span>
        )}
      </AnimatePresence>

      {/* RGB split — cyan channel, hover only */}
      <AnimatePresence>
        {showGlitchLayers && (
          <motion.span
            initial={{ opacity: 0, x: 0 }}
            animate={{
              opacity: [0, 0.8, 0.3, 0.9, 0],
              x: [2, -3, 4, -1, 0],
              y: [-1, 2, -1, 0],
              skewX: [0, 15, -8, 6, 0],
            }}
            transition={{ duration: 0.25, repeat: Infinity, repeatType: 'mirror' }}
            className="absolute top-0 left-0 text-cyan-400 pointer-events-none select-none z-0 opacity-80 mix-blend-screen"
            aria-hidden="true"
          >
            {displayText}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Core text */}
      <motion.span
        animate={
          showGlitchLayers
            ? { scale: [1, 1.06, 0.98, 1.04, 1], skewX: [0, -6, 8, -3, 0] }
            : { scale: 1, skewX: 0 }
        }
        transition={{ duration: 0.2, repeat: showGlitchLayers ? Infinity : 0 }}
        className={`relative z-10 block transition-colors duration-150 ${
          isHovered
            ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
            : isHighlightable
              ? 'text-neutral-50 underline decoration-neutral-400/50 underline-offset-4'
              : 'text-neutral-300'
        }`}
      >
        {displayText}
      </motion.span>

      {/* Scanline / CRT sweep */}
      {showGlitchLayers && (
        <span
          className="absolute -inset-x-1 -inset-y-0.5 border-t border-b border-cyan-500/80 bg-cyan-500/10 z-20 pointer-events-none animate-pulse"
          aria-hidden="true"
        />
      )}
    </motion.span>
  )
}

export default function GlitchText({
  text = 'ENGINEERED WITH REACT, FRAMER MOTION, AND TAILWIND CSS FOR ULTRA SMOOTH PERFORMANCE.',
  highlightWords = ['REACT', 'FRAMER', 'TAILWIND', 'PERFORMANCE'],
  className = '',
  framed = true,
  fullScreen = false,
}: GlitchTextProps) {
  const [isParagraphHovered, setIsParagraphHovered] = useState(false)
  const labelId = useId()

  const clean = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '')
  const words = text.split(' ')

  const content = (
    <>
      {/* The animated spans shuffle through junk characters, so assistive tech
          gets the real sentence once and skips the scramble entirely. */}
      <p id={labelId} className="sr-only">
        {text}
      </p>
      <div
        aria-hidden="true"
        className={`relative z-10 flex flex-wrap gap-x-3 gap-y-2 leading-relaxed text-lg sm:text-xl ${className}`}
      >
        {words.map((word, idx) => {
          const isHighlightable = highlightWords.some((hw) => clean(hw) === clean(word))

          return (
            <GlitchWord
              key={`${word}-${idx}`}
              word={word}
              isHighlightable={isHighlightable}
              isParagraphFocused={isParagraphHovered}
              onHoverStart={() => setIsParagraphHovered(true)}
              onHoverEnd={() => setIsParagraphHovered(false)}
            />
          )
        })}
      </div>
    </>
  )

  const body = framed ? (
    <div className="w-full max-w-3xl p-6 sm:p-8 font-mono select-none bg-black rounded-xl border border-white/10 shadow-xl relative overflow-hidden">
      {/* Scanline texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(255,255,255,0.03)_50%)] bg-[length:100%_4px] pointer-events-none" />
      {content}
    </div>
  ) : (
    <div className="font-mono select-none">{content}</div>
  )

  if (!fullScreen) return body

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black">{body}</div>
  )
}
