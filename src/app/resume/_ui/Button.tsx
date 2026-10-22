'use client'
import Link from 'next/link'
import type { ComponentPropsWithoutRef, MouseEvent, ReactNode, Ref } from 'react'
import { PILL_OUTLINE } from './pill'
import { cn } from '@/lib/utils'

/**
 * The one button. Adapted from Interfaces Button (21st.dev 11855, jshguo):
 * its variant map and its single disabled opacity, without cva or a Radix
 * Slot. `href` renders a next/link in the same skin instead of `asChild`.
 *
 * The pending state borrows Loading Button's stacked faces (21st.dev 23536)
 * as a pattern only: both faces sit in one grid cell, so the button is as wide
 * as its widest face and never jumps when "Send" becomes "Sending…". The
 * hidden face is `invisible`, which also takes it out of the accessibility
 * tree, so the accessible name is whichever face shows (or `aria-label`). A
 * pending button is aria-disabled rather than disabled, so it keeps keyboard
 * focus, and a status line beside it announces the pending label.
 */
const VARIANT = {
  solid:
    'rounded-full bg-white px-5 py-2.5 font-mono text-small font-semibold uppercase tracking-wider text-black transition-opacity hover:opacity-80 disabled:opacity-50',
  paper:
    'rounded-full bg-black px-5 py-2.5 font-mono text-small font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-80 disabled:opacity-50',
  outline: `${PILL_OUTLINE} disabled:opacity-50`,
} as const

export type ButtonVariant = keyof typeof VARIANT

interface ButtonOwnProps {
  variant?: ButtonVariant
  /** Shows `pendingLabel` in place of the children, at the same width. */
  pending?: boolean
  /** The pending face, and what the status line announces. */
  pendingLabel?: ReactNode
  className?: string
  children: ReactNode
}

type ButtonAsButton = ButtonOwnProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof ButtonOwnProps> & {
    href?: undefined
    ref?: Ref<HTMLButtonElement>
  }

type ButtonAsLink = ButtonOwnProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof ButtonOwnProps> & {
    href: ComponentPropsWithoutRef<typeof Link>['href']
    ref?: Ref<HTMLAnchorElement>
  }

export type ButtonProps = ButtonAsButton | ButtonAsLink

const FACE = 'col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5'

function Faces({ pending, pendingLabel, children }: Pick<ButtonOwnProps, 'pending' | 'pendingLabel' | 'children'>) {
  const showPending = Boolean(pending && pendingLabel)
  return (
    <span className="inline-grid">
      <span className={cn(FACE, showPending && 'invisible')}>{children}</span>
      {pendingLabel ? <span className={cn(FACE, !showPending && 'invisible')}>{pendingLabel}</span> : null}
    </span>
  )
}

export function Button(props: ButtonProps) {
  const { variant = 'solid', pending = false, pendingLabel, className, children } = props
  const classes = cn('inline-flex cursor-pointer items-center justify-center', VARIANT[variant], className)
  const faces = (
    <Faces pending={pending} pendingLabel={pendingLabel}>
      {children}
    </Faces>
  )
  // Outside the control: a button's children are presentational, so a live
  // region inside it may never be exposed.
  const status = pendingLabel ? (
    <span role="status" className="sr-only">
      {pending ? pendingLabel : ''}
    </span>
  ) : null

  if (props.href !== undefined) {
    const { variant: _v, pending: _p, pendingLabel: _l, className: _c, children: _ch, onClick, ...rest } = props
    return (
      <>
        <Link
          {...rest}
          aria-busy={pending || undefined}
          aria-disabled={pending || undefined}
          className={classes}
          onClick={(e: MouseEvent<HTMLAnchorElement>) => {
            if (pending) {
              e.preventDefault()
              return
            }
            onClick?.(e)
          }}
        >
          {faces}
        </Link>
        {status}
      </>
    )
  }

  const { variant: _v, pending: _p, pendingLabel: _l, className: _c, children: _ch, onClick, type = 'button', ...rest } = props
  return (
    <>
      <button
        {...rest}
        type={type}
        aria-busy={pending || undefined}
        aria-disabled={pending || rest['aria-disabled'] || undefined}
        className={classes}
        onClick={(e) => {
          // Swallow a second press (and a second submit) while pending.
          if (pending) {
            e.preventDefault()
            return
          }
          onClick?.(e)
        }}
      >
        {faces}
      </button>
      {status}
    </>
  )
}

export default Button
