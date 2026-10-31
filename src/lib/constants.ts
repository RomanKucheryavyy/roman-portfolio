import { CERT_VERIFY } from '@/lib/site-facts'

export const SITE = {
  name: 'Roman Kucheryavyy',
  // His own hero words (Hero.tsx: "Salesforce engineer by day. Full-stack
  // builder by nature."). needs Roman: confirm.
  title: 'Roman Kucheryavyy — Salesforce engineer & full-stack builder',
  description:
    'Salesforce engineer, full-stack developer, and band conductor building at the intersection of precision and creativity.',
  url: 'https://romankucheryavyy.com',
} as const

// In its own dependency-free module, so the chrome can read it alone (links.ts).
export { LINKS } from './links'

/**
 * Roman's own words, as the old design's components carried them, kept here
 * when those components go so the Stage page says them from this record.
 * Verbatim; each names the component it came from.
 */
export const HIS_WORDS = {
  // Hero.tsx: the line under his name.
  tagline: 'Salesforce engineer by day. Full-stack builder by nature. Conductor by calling.',
  // Manifesto.tsx: the interlude line. It set the same words in capitals for
  // its terminal readout; here they are in sentence case.
  manifesto:
    'Precision is not the opposite of art. The same ear that catches a flat trumpet catches a race condition. I ship both.',
  // Conductor.tsx: the music card's two paragraphs.
  about: [
    'Music and code run on the same engine — structure, rhythm, and knowing exactly when to improvise. As head conductor of the FUBC Band, I shape sound the way I shape software: with intention and a little audacity.',
    'Off the clock, my wife and daughter remind me why any of this matters. The best things I build serve people I love.',
  ],
  // Conductor.tsx LIFE_FACTS: the "Music" line.
  music: 'FUBC Band — trumpet, arranger, director',
} as const

/** His photo, as the Conductor card showed it. */
export const PHOTO = '/images/roman.jpg'

export interface Certification {
  id: string
  name: string
  short: string
  date: string
  category: 'developer' | 'consultant' | 'ai' | 'admin'
  /** A public page that proves it. Set from CERT_VERIFY in site-facts.ts, which
   *  is empty until Roman supplies the links; a card links nothing without one.
   *  needs Roman: confirm. */
  verifyUrl?: string
}

/** The one list of Roman's certifications. The résumé and every count on the site read it. */
export const CERTIFICATIONS: readonly Certification[] = (
  [
    { id: 'pd1', name: 'Platform Developer I', short: 'PD1', date: 'Jul 2025', category: 'developer' },
    { id: 'dcc', name: 'Data Cloud Consultant', short: 'DCC', date: 'Mar 2025', category: 'consultant' },
    { id: 'ais', name: 'AI Specialist', short: 'AIS', date: 'Nov 2024', category: 'ai' },
    { id: 'scc', name: 'Sales Cloud Consultant', short: 'SCC', date: 'Aug 2024', category: 'consultant' },
    { id: 'scaa', name: 'Advanced Administrator', short: 'SCAA', date: 'Apr 2024', category: 'admin' },
    { id: 'aia', name: 'AI Associate', short: 'AIA', date: 'Apr 2024', category: 'ai' },
    { id: 'pab', name: 'Platform App Builder', short: 'PAB', date: 'Jan 2024', category: 'developer' },
    { id: 'sca', name: 'Administrator', short: 'SCA', date: 'Dec 2023', category: 'admin' },
  ] as const
).map((cert) => (CERT_VERIFY[cert.id] ? { ...cert, verifyUrl: CERT_VERIFY[cert.id] } : cert))

/** Client work, in the order the Stage's Act I shows it. */
export const PROJECTS = [
  {
    id: 'alongside-coffee',
    title: 'Alongside Coffee',
    url: 'https://www.alongsidecoffee.com',
    image: '/images/projects/alongside-coffee.png',
    // needs Roman: the live alongsidecoffee.com is a booking and inquiry site
    // ("Book the Cart", "Inquire", a Salesforce Web-to-Lead form) with no shop,
    // cart or checkout (fetched 2026-10-13), and the screenshot shows the same.
    // "e-commerce" here and the "E-commerce" tag are his words, kept until he
    // says what the site is now.
    description:
      'Brewed from scratch — a full-stack e-commerce experience that turns first-time visitors into repeat customers. Custom design system, responsive to the last pixel.',
    tags: ['Web Design', 'E-commerce', 'Branding'],
    // source: resume-data.ts:135 at 05a1a6c^ (his résumé before the July 2026 rewrite).
    // needs Roman: confirm it is still the stack.
    stack: ['React', 'Next.js', 'Tailwind', 'Netlify'],
    color: '#C4A265',
  },
  {
    id: 'mark-lutsyuk',
    title: 'Mark Lutsyuk',
    url: 'https://marklutsyuk.com',
    image: '/images/projects/mark-lutsyuk.png',
    description:
      'A portfolio that does the talking. Clean architecture, purposeful animations, and a conversion funnel that quietly guides visitors from curiosity to contact.',
    tags: ['Portfolio', 'Web Design', 'UI/UX'],
    color: '#5B8DEF',
  },
  {
    id: 'fubc-band',
    title: 'FUBC Band',
    url: 'https://www.fubcband.com',
    image: '/images/projects/fubc-band.png',
    description:
      'Where the music lives online. Event listings, media galleries, and a live performance showcase for the band I conduct — built with the same rhythm we play.',
    tags: ['Web Design', 'Music', 'CMS'],
    // source: resume-data.ts:142 at 05a1a6c^ (his résumé before the July 2026 rewrite).
    // needs Roman: confirm it is still the stack.
    stack: ['React', 'Vite', 'Supabase', 'Netlify'],
    color: '#FF6B4A',
  },
  {
    id: 'intext-construction',
    title: 'Intext Construction',
    url: 'https://www.intextconstructionllc.com',
    image: '/images/projects/intext-construction.png',
    description:
      'Solid foundations, digital edition. A professional web presence built for lead generation — service showcase, project portfolio, and a pipeline that converts.',
    tags: ['Web Design', 'Business', 'Lead Gen'],
    color: '#4ADE80',
  },
  {
    id: 'fubc-coffee-web',
    title: 'FUBC Coffee',
    url: 'https://www.fubccoffee.com',
    image: '/images/projects/fubc-coffee-web.png',
    description:
      'From bean to browser. A custom ordering platform with menu management, real-time queue, and a brand experience that pairs well with your morning cup.',
    tags: ['Web App', 'Full-Stack', 'E-commerce'],
    color: '#D97706',
  },
  {
    id: 'nelectric',
    title: 'Nelectric Power Systems',
    url: 'https://nelectricpowersystems.com',
    image: '/images/projects/nelectric.png',
    description:
      'A licensed electrician in three languages. English, Ukrainian, and Russian side by side, a 60-second quote form wired to a real lead pipeline, and a private dashboard that tells the owner which calls the site actually earned.',
    tags: ['Web Design', 'Lead Gen', 'Serverless'],
    color: '#38BDF8',
  },
  {
    // needs Roman: eminencerentals.com carries a fixed bar, "This site is
    // currently under development and not yet live." (fetched 2026-10-13; the
    // repo's own eminence-rentals.png shows it too), yet with a url its card
    // links out like a live site. His status, in his words, goes here;
    // nothing is written for him.
    id: 'eminence-rentals',
    title: 'Eminence Rentals',
    url: 'https://eminencerentals.com',
    image: '/images/projects/eminence-rentals.png',
    description:
      'The art of arrival, booked in five steps. Dates, driver details, a digitally signed waiver, identity verification, and a Rolls-Royce at the door — a full rental desk with no paperwork anywhere in it.',
    tags: ['Web App', 'Booking Flow', 'Full-Stack'],
    color: '#4F8EFF',
  },
  {
    // No `url` yet — the client still owes a phone number and a WA L&I
    // registration, and the build refuses production without them.
    id: 'dtm-plumbing',
    title: 'DanTheMan Plumbing',
    status: 'Launching soon',
    image: '/images/projects/dtm-plumbing.png',
    description:
      'One man, one truck, and a number that actually rings him. Behind the sign painting sits a real lead pipeline: every enquiry is stored before an email is even attempted, so a mail outage flags the lead instead of losing the customer.',
    tags: ['Web Design', 'Lead Pipeline', 'Next.js'],
    color: '#B23A32',
  },
  {
    id: 'fubc-coffee-ios',
    title: 'FUBC Coffee iOS',
    url: 'https://apps.apple.com/us/app/fubc-coffee/id6760352447',
    image: '/images/projects/fubc-coffee-ios.png',
    description:
      "Native Swift from the ground up. Push notifications, real-time ordering, and Apple Pay — because good coffee shouldn't require a complicated checkout.",
    tags: ['iOS', 'Swift', 'Mobile App'],
    stack: ['Swift', 'SwiftUI', 'Firebase', 'Supabase'], // source: resume-data.ts:110 at abb0023
    year: 2026, // source: App Store releaseDate 2026-03-12 (iTunes Lookup id6760352447, checked 2026-10-10)
    color: '#A855F7',
    isApp: true,
  },
] as const

/** His own products, in the order the Stage's Act II shows them: Alongside
 *  Events first, which Roman calls one of his biggest projects (his request
 *  of 2026-10-27, "alongside events which are like my biggest projects ...
 *  should be a preview of it"), then Sembly, Praxis and Alongside Brain.
 *  `url` is optional: two of these are private builds, so the entry tells the
 *  story instead of linking out. Where one is public, it links to it.
 *
 *  `preview` (the public ones): screenshots of the live site, desktop and
 *  phone, that the act scrolls inside its browser and phone frames. Taken
 *  from `url` by scripts/capture-products.mjs, on the `captured` date; the
 *  sizes are the files' own (tests/data.spec.ts checks them).
 *
 *  `flow` (the private ones, which have no public screens to show): the
 *  diagram the act draws instead, the product at its centre (`hub`: its
 *  title, and the description's opening line) and its parts around it. Every
 *  part is a thing the description names, its label and note the
 *  description's own words; `links` ([from, to], the product's own `id`
 *  standing for the centre) are only the ones the description states. */
export const COMPOSITIONS = [
  {
    // Linked since Roman's request of 2026-10-27, which asks for a preview of
    // it as one of his biggest projects: alongsideevents.com is public
    // ("All-in-one software for coffee carts": sign-in, pricing, "Your first
    // event is free") and its JSON-LD names him and Anna Kucheryava as
    // founders (fetched 2026-10-13). The status and tagline are his, as they
    // were.
    id: 'alongside-events',
    title: 'Alongside Events',
    tagline: 'The tech stack behind the family coffee cart',
    status: 'Runs the family cart',
    url: 'https://alongsideevents.com',
    description:
      'QR-code ordering guests scan right at the cart, automated post-event recaps, and fully functional networked thermal label printing — every technical piece a mobile espresso bar needs, composed from scratch and battle-tested at real weddings.',
    stack: ['Next.js', 'TypeScript', 'QR ordering', 'Thermal print server'],
    color: '#ffb800',
    // Captured from https://alongsideevents.com on 2026-10-27: its first
    // 2900 CSS px at 1280 wide, and its first 2180 at 390 wide (below those
    // the page pins its "How the night runs" steps for several screens,
    // blank or greyed out in a still), the phone's under a 52px status-bar
    // band (scripts/capture-products.mjs).
    preview: {
      captured: '2026-10',
      desktop: { src: '/images/products/alongside-events-desktop.webp', width: 1280, height: 2900 },
      phone: { src: '/images/products/alongside-events-phone.webp', width: 585, height: 3348 },
    },
  },
  {
    id: 'sembly',
    title: 'Sembly',
    tagline: 'Scheduling for worship teams',
    // Its link already reads "sembly.app"; the status does not repeat it.
    // needs Roman: confirm.
    status: 'Live',
    url: 'https://sembly.app',
    description:
      'The answer to "am I playing this Sunday?" — on the phone that gets asked. Volunteers see the dates they serve, their position, the running order with every song key, and the sheet music; leaders plan a whole month from the same screen. Row-level security in Postgres is the actual boundary, so a volunteer only ever sees the services they are on.',
    stack: ['Next.js', 'Supabase', 'Tailwind', 'PWA'],
    color: '#af52de',
    // Captured from https://sembly.app on 2026-10-27: its first 4000 CSS px
    // at 1280 wide and its first 3000 at 390 wide, the phone's under a 52px
    // status-bar band (scripts/capture-products.mjs).
    preview: {
      captured: '2026-10',
      desktop: { src: '/images/products/sembly-desktop.webp', width: 1280, height: 4000 },
      phone: { src: '/images/products/sembly-phone.webp', width: 585, height: 4578 },
    },
  },
  {
    id: 'praxis',
    title: 'Praxis',
    tagline: 'AI-augmented trading platform',
    status: 'Paper trading daily',
    description:
      'An investment desk that argues with itself. Eighteen investor personas — each with its own rules and an LLM-written thesis — debate every position, an AI portfolio manager sizes the trades, and a Discovery Engine hunts spinoffs, activist stakes, and cyclical bottoms. Executing through Alpaca on paper until it earns the right to real money.',
    stack: ['Next.js', 'TypeScript', 'Claude API', 'Alpaca'],
    color: '#5ac8fa',
    // The parts the description names, around the desk itself (the
    // product, at the centre), and only the links it states: the personas,
    // the portfolio manager and the Discovery Engine are the desk's own
    // parts, each working into it, and the desk executes through Alpaca.
    // needs Roman: which part feeds which inside the desk. An earlier draft
    // drew the personas and the Discovery Engine feeding the portfolio
    // manager, and the manager feeding Alpaca; the description does not say
    // so, so it is not drawn. If that is how it runs, say so and the beams
    // can show it.
    flow: {
      hub: 'An investment desk that argues with itself',
      nodes: [
        { id: 'personas', label: 'Eighteen investor personas', note: 'debate every position' },
        { id: 'discovery', label: 'Discovery Engine', note: 'hunts spinoffs, activist stakes, and cyclical bottoms' },
        { id: 'manager', label: 'AI portfolio manager', note: 'sizes the trades' },
        { id: 'alpaca', label: 'Alpaca', note: 'on paper' },
      ],
      links: [
        ['personas', 'praxis'],
        ['discovery', 'praxis'],
        ['manager', 'praxis'],
        ['praxis', 'alpaca'],
      ],
    },
  },
  {
    id: 'alongside-brain',
    title: 'Alongside Brain',
    tagline: 'Personal AI second brain',
    status: 'On duty 24/7',
    description:
      'An Obsidian vault with a pulse. A Slack bot captures notes, reminders, journal entries, and expenses in plain language; Claude routes every capture where it belongs; scheduled digests and pattern detection keep me honest. Conducting my life around the clock from a desktop in my office.',
    stack: ['Python', 'Claude API', 'Slack API', 'Obsidian'],
    color: '#30d158',
    // The parts the description names, around the vault itself (the
    // product, at the centre), and only the links it states: the Slack bot's
    // captures go to Claude, which routes every capture where it belongs, in
    // the vault; the product's scheduled digests and pattern detection go out
    // to keep him honest.
    // needs Roman: what the digests are made from. An earlier draft drew
    // them coming out of the notes the vault holds; the description does not
    // say so, so it is not drawn.
    flow: {
      hub: 'An Obsidian vault with a pulse',
      nodes: [
        { id: 'slack', label: 'Slack bot', note: 'captures notes, reminders, journal entries, and expenses' },
        { id: 'claude', label: 'Claude', note: 'routes every capture where it belongs' },
        { id: 'digests', label: 'Scheduled digests', note: 'and pattern detection' },
      ],
      links: [
        ['slack', 'claude'],
        ['claude', 'alongside-brain'],
        ['alongside-brain', 'digests'],
      ],
    },
  },
] as const

export const TECH_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Swift',
  'Java', 'Python', 'C', 'SQL', 'Apex',
  'Salesforce', 'Data Cloud', 'CRMA', 'LWC',
  'Node.js', 'Firebase', 'Supabase', 'Git',
] as const
