import type { OldMastersFigure } from '@/components/ui/old-masters-preloader'
import { CAST } from './cast'

/**
 * The intro's gate, as plain values: app/page.tsx (a server component)
 * renders INTRO_GATE inline, and intro.tsx and the tests read the rest. See
 * intro.tsx for when the intro shows and what the attribute means.
 */

/** How long a shown intro stays away, in ms. */
export const INTRO_WINDOW_MS = 12 * 60 * 60 * 1000
/** The localStorage key holding when the intro last showed (ms since the epoch). */
export const INTRO_KEY = 'rk:intro'
/** How long the gate waits for the intro to mount before showing the page anyway. */
export const INTRO_FAILSAFE_MS = 8000

/**
 * The inline gate. Plain ES5 in a string: it runs while the body is parsed,
 * before React or any chunk. Any error leaves the attribute off, so the page
 * shows. Besides the rules in intro.tsx it stands aside for a browser that
 * asks to save data or reports a 2G connection (Network Information API;
 * Safari has none, so it is never asked there): the stage and its statues
 * are about a megabyte, and the page would wait for them. Not for "3g":
 * that is Chrome's estimate from recent round trips, and an ordinary phone
 * connection (or a busy machine) often reads as one.
 */
export const INTRO_GATE = `(function(){var d=document.documentElement;try{var c=navigator.connection;if(location.hash||matchMedia('(prefers-reduced-motion: reduce)').matches||(c&&(c.saveData||/2g$/.test(c.effectiveType||''))))return;var force=/[?&]intro(?:[=&]|$)/.test(location.search),last=0,now=Date.now();try{last=Number(localStorage.getItem('${INTRO_KEY}'))||0}catch(e){}if(!force&&last<=now&&now-last<${INTRO_WINDOW_MS})return;d.setAttribute('data-intro','');setTimeout(function(){if(d.getAttribute('data-intro')==='')d.removeAttribute('data-intro')},${INTRO_FAILSAFE_MS})}catch(e){d.removeAttribute('data-intro')}})();`

/**
 * The gate's own test of the connection, for code that runs after it (the
 * hero's painting, hero-painting.tsx): a browser that asks to save data or
 * reports a 2G connection.
 */
export function savesData(): boolean {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  return !!c && (!!c.saveData || /2g$/.test(c.effectiveType || ''))
}

/**
 * Phones (the component drops its `phone: false` figures below 640px) and
 * any screen taller than it is wide: the cast's sizes are fractions of the
 * height and its places fractions of the width, so on a tall screen the
 * figures stand on each other. There Apollo stands alone, and nothing else
 * is fetched.
 */
export const TALL_QUERY = '(max-width: 639px), (max-aspect-ratio: 11/10)'

/**
 * The cast, arranged for this word. "ROMAN" is short, so it is set huge
 * along the floor, in front of both figures; the faces stand clear above it
 * and below the copy at the top centre, one on either side of it: Hercules
 * on the left looking in, Apollo on the right looking up, his arm reaching
 * out past the edge of the screen (the photograph cuts it off, and the cut
 * must not show: x 82 keeps it off screen from 1024 to 1920 wide). On
 * phones and tall screens (TALL_QUERY), Apollo alone, his face near the
 * middle.
 *
 * The files are pre-keyed (cast.ts), so the component's own key is set low:
 * it keeps the files' edge rather than cutting it a second time.
 */
const KEY = { threshold: 0.08, softness: 0.08 } as const
export const INTRO_FIGURES: { wide: OldMastersFigure[]; tall: OldMastersFigure[] } = {
  wide: [
    // Cut at the belly in the file itself, and stood 4% below the floor.
    { src: CAST.hercules.src, alt: CAST.hercules.alt, x: 19, y: 104, h: 56, depth: 0.8, ...KEY },
    // x is the least: intro-stage.tsx moves him further out on a wider screen (pastEdge).
    { src: CAST.apollo.src, alt: CAST.apollo.alt, x: 82, y: 100, h: 62, depth: 0.85, ...KEY },
  ],
  tall: [{ src: CAST.apollo.src, alt: CAST.apollo.alt, x: 80, y: 100, h: 56, depth: 0.85, ...KEY }],
}

/** Every file the intro shows on this screen: the gate fetches them before the stage asks. */
export function introFiles(tall: boolean): string[] {
  return [...(tall ? INTRO_FIGURES.tall : INTRO_FIGURES.wide).map((f) => f.src), CAST.david.src]
}
