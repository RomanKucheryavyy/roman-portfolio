#!/usr/bin/env node
/**
 * Fetches the cast of the Roman intro (src/components/stage/intro.tsx), three
 * of the four photographs kedhareswer/old-masters-preloader stages by default
 * (not its figure holding flowers, which Roman asked to remove), all
 * from Unsplash (free to use under the Unsplash License), and writes them to
 * public/images/cast/ as WebP:
 *
 * - The two figures, PRE-KEYED: an alpha channel from each pixel's
 *   luminance through the component's own transfer (omTransfer with
 *   threshold 0.2, softness 0.16, subject "light": alpha = 6.25 L - 0.75,
 *   L the Rec. 709 luma of the sRGB values, as its SVG filter computes it),
 *   so a browser that ignores the component's CSS mask (Safari's support for
 *   `mask: url(#svg-mask)` on HTML is unreliable, and Roman is on an iPhone)
 *   still shows only the statue. Each is cropped to the statue (less black
 *   ground to carry) and scaled to 1600px tall.
 * - The backdrop (Michelangelo's David), opaque, 1200px wide at a modest
 *   quality: the component shows it grayscale, darkened and blurred.
 *
 * The Hercules needs more than the key: the photograph's lower edge shows
 * his genitals. Its crop stops at the belly (66% of the photo's height, well
 * above them) and the last stretch fades out, so the file the site serves
 * does not contain them at all; the page also stands its foot below the
 * floor.
 *
 * The credits are the component's (its DEFAULT_FIGURES comment); the alt
 * texts the page gives them are its too (src/components/stage/cast.ts).
 *
 *   node scripts/fetch-cast.mjs            # all three
 *   node scripts/fetch-cast.mjs hercules   # one
 *
 * Needs network access to images.unsplash.com, and sharp (Next installs it
 * as its own optional dependency). Prints each file's size; set the sizes
 * in src/components/stage/cast.ts if they change, and look at the files
 * before committing them.
 */
import { mkdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = path.join(ROOT, 'public', 'images', 'cast')

/** omTransfer(0.2, 0.16, "light") in the component, to its two decimals. */
const SLOPE = 6.25
const INTERCEPT = -0.75

/**
 * The cast. `photo` is the Unsplash id; `crop` is the part kept, as
 * fractions of the photograph (left, top, right, bottom edges); `fade` the
 * fraction of the kept height, at its foot, over which the alpha runs out.
 */
const CAST = [
  {
    id: 'apollo',
    photo: '1574359587026-daf1bfd26baa',
    credit: 'Nayani Teixeira',
    kind: 'figure',
    // The left fifth and the top tenth are black ground.
    crop: { left: 0.22, top: 0.11, right: 1, bottom: 1 },
  },
  {
    id: 'hercules',
    photo: '1567522874215-d5e2f1bee83d',
    credit: 'Şafak Atalay',
    kind: 'figure',
    // The statue fills the left two thirds. It is cut at the belly, well
    // above the groin, and fades out over the last twentieth, which the
    // page stands below the floor.
    crop: { left: 0.04, top: 0.02, right: 0.68, bottom: 0.66 },
    fade: 0.05,
  },
  {
    id: 'david-backdrop',
    photo: '1601887389937-0b02c26b602c',
    credit: 'Jack Hunter',
    kind: 'backdrop',
  },
]

const FIGURE_HEIGHT = 1600
/** Gaussian sigma, in output px, of the copy the key reads. */
const KEY_BLUR = 1.6
const ALPHA_FLOOR = 0.04
const BACKDROP_WIDTH = 1200

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

async function download(photo, width) {
  // fit=max never upscales: a photograph narrower than `width` comes whole.
  const url = `https://images.unsplash.com/photo-${photo}?fm=jpg&q=92&fit=max&w=${width}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function figure(entry) {
  const source = await download(entry.photo, 3600)
  const meta = await sharp(source).metadata()
  const { left, top, right, bottom } = entry.crop
  const region = {
    left: Math.round(meta.width * left),
    top: Math.round(meta.height * top),
    width: Math.round(meta.width * (right - left)),
    height: Math.round(meta.height * (bottom - top)),
  }
  const scaled = await sharp(source).extract(region).resize({ height: FIGURE_HEIGHT }).removeAlpha().toBuffer()
  // A 3px median takes out the film grain, which would cost more bytes than
  // the marble; at 1600px tall it is not visible.
  const { data, info } = await sharp(scaled).median(3).raw().toBuffer({ resolveWithObject: true })
  // The key reads a softened copy: the photographs' grain would otherwise
  // speckle the edge (and the alpha would weigh more than the picture).
  const soft = await sharp(scaled).blur(KEY_BLUR).raw().toBuffer()
  const { width, height } = info
  const out = Buffer.alloc(width * height * 4)
  const fadeFrom = entry.fade ? height * (1 - entry.fade) : height
  for (let y = 0; y < height; y++) {
    const foot = y < fadeFrom ? 1 : 1 - smoothstep(fadeFrom, height - 1, y)
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const r = soft[i * 3] / 255
      const g = soft[i * 3 + 1] / 255
      const b = soft[i * 3 + 2] / 255
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
      let alpha = clamp01(SLOPE * luma + INTERCEPT)
      alpha *= foot
      // Below a sliver of coverage, none: specks of ground, not marble.
      if (alpha < ALPHA_FLOOR) alpha = 0
      out[i * 4] = data[i * 3]
      out[i * 4 + 1] = data[i * 3 + 1]
      out[i * 4 + 2] = data[i * 3 + 2]
      out[i * 4 + 3] = Math.round(alpha * 255)
    }
  }
  const file = path.join(OUT, `${entry.id}.webp`)
  await sharp(out, { raw: { width, height, channels: 4 } })
    .webp({ quality: 70, alphaQuality: 40, effort: 6, smartSubsample: true })
    .toFile(file)
  return { file, width, height }
}

async function backdrop(entry) {
  const source = await download(entry.photo, 2400)
  const file = path.join(OUT, `${entry.id}.webp`)
  const { width, height } = await sharp(source).resize({ width: BACKDROP_WIDTH }).webp({ quality: 50, effort: 6 }).toFile(file)
  return { file, width, height }
}

const only = process.argv.slice(2)
const unknown = only.filter((id) => !CAST.some((c) => c.id === id))
if (unknown.length) {
  console.error(`fetch-cast: no cast member ${unknown.join(', ')} (have ${CAST.map((c) => c.id).join(', ')})`)
  process.exit(1)
}

mkdirSync(OUT, { recursive: true })
for (const entry of CAST) {
  if (only.length && !only.includes(entry.id)) continue
  const { file, width, height } = entry.kind === 'figure' ? await figure(entry) : await backdrop(entry)
  const kb = (statSync(file).size / 1024).toFixed(1)
  console.log(`${path.relative(ROOT, file)}  ${width}x${height}  ${kb} KB  (photo ${entry.photo}, ${entry.credit})`)
}
