import type { Product } from '@/lib/content'

/**
 * The sizes of the Products act's previews, shared by the previews
 * themselves (product-previews.tsx, which loads after the page) and the
 * blocks that hold their place until they do (products.tsx), so nothing
 * below moves when they land. Every size here is CSS alone: an aspect ratio
 * or a fixed height, never the content's.
 */

/**
 * A live preview: the browser and the phone together at every width, the
 * browser across the top of the stage and the phone overlapping its lower
 * corner (product-previews.tsx). Below md a taller stage (10:8), so the
 * phone can stand large enough to read as a phone; from md, 3:2.
 */
export const LIVE_BOX = 'aspect-[10/8] w-full md:aspect-[3/2]'

/**
 * A private product's inscription (its parts, in its description's words):
 * a block of fixed height, the words set in the middle of it, as tall as
 * they are at the narrowest width each range has (320px, then 360 or 375
 * where the lines first draw fewer, md, and the split row's column from
 * lg, 504px at 1024) and a line's height more, for a fallback face's
 * metrics. A chain of parts (each passing to the next, I to IV) is shorter
 * than the desk and its parts. tests/products.spec.ts checks that nothing
 * overflows at any width.
 */
const FLOW_BOX = {
  desk: 'h-[37.5rem] min-[375px]:h-[34.5rem] md:h-[38rem] lg:h-[40rem]',
  chain: 'h-[25.5rem] min-[360px]:h-[23.5rem] md:h-[29.5rem] lg:h-[36rem]',
}

/** Whether a flow's links run as one chain: no part passes to, or takes from, more than one other. */
export function isChain(flow: NonNullable<Product['flow']>): boolean {
  const once = (side: 0 | 1) => new Set(flow.links.map((l) => l[side])).size === flow.links.length
  return once(0) && once(1)
}

export const flowBox = (flow: NonNullable<Product['flow']>) => FLOW_BOX[isChain(flow) ? 'chain' : 'desk']

/** The line under a preview: a caption and the Pause / Play button (44px tall, its tap target), on one line. */
export const CAPTION_ROW = 'mt-3 flex h-11 items-center justify-between gap-4 text-xs leading-4 text-muted-foreground md:mt-4'
