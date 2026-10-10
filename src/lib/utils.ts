import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge only knows Tailwind's own font-size names. Without this it
 * reads `text-label` as a colour, and `cn('text-label text-white/50')` would
 * silently drop one of the two.
 */
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ['label', 'small', 'body', 'lead'] } },
})

/**
 * The shadcn class helper. Components from that ecosystem expect it at
 * `@/lib/utils`, so it lives here under that exact name even though the rest of
 * this codebase writes its class strings inline.
 *
 * clsx flattens conditionals; tailwind-merge then resolves collisions so a
 * caller's `px-6` beats a component's own `px-4` instead of both landing in the
 * class list and letting stylesheet order decide.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
