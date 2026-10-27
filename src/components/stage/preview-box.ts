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
 * A "how it works" panel: a fixed height per layout that holds the longer
 * diagram at that layout's narrowest width (320px below md, where it needs
 * 552px; 1024px for lg, 495px; 1280px for xl, 418px), close to the live
 * previews' own height from md. tests/products.spec.ts checks that nothing
 * overflows.
 */
export const FLOW_BOX = 'h-[36rem] md:h-[28rem] lg:h-[32rem] xl:h-[28rem]'

/** The line under either: a caption and the Pause / Play button, two lines of text at most. */
export const CAPTION_ROW = 'mt-5 flex h-8 items-center justify-between gap-4 text-xs leading-4 text-muted-foreground md:mt-6'
