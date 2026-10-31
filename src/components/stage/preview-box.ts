/**
 * The sizes of the Products act's previews, shared by the previews
 * themselves (product-previews.tsx, which loads after the page) and the
 * blocks that hold their place until they do (products.tsx), so nothing
 * below moves when they land. Every size here is CSS alone: an aspect ratio
 * or a fixed height, never the content's.
 */

/**
 * A live preview: below md the phone alone (the iPhone frame is 200×400),
 * from md the browser and the phone together, on a 3:2 stage: the browser
 * frame across 88% of it at the top, the phone across 27% at the bottom
 * corner, overlapping it.
 */
export const LIVE_BOX = 'mx-auto aspect-[1/2] w-[min(62vw,15.5rem)] md:mx-0 md:aspect-[3/2] md:w-full'

/**
 * A private product's diagram panel: from md the live previews' own 3:2
 * stage, so the rows keep one rhythm; below md, a fixed height that holds
 * the taller diagram at 320px wide, with room for its beams around the
 * hub's two lines of 18px Cormorant. tests/products.spec.ts checks that
 * nothing overflows and every beam shows at any width.
 */
export const FLOW_BOX = 'h-[37rem] md:h-auto md:aspect-[3/2]'

/** The line under either: a caption and the Pause / Play button, two lines of text at most. */
export const CAPTION_ROW = 'mt-5 flex h-8 items-center justify-between gap-4 text-xs leading-4 text-muted-foreground md:mt-6'
