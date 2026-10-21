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

/** Client work & shipped products — performed in The Symphony deck. */
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
    // repo's own eminence-rentals.png shows it too), yet a url counts it in
    // LIVE_CLIENT_WORK, the "8 live" on / and /works. His status, in his
    // words, goes here; nothing is written for him.
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

/** Original works — the products I compose, own, and operate.
 *  `url` is optional: most of these are private builds, so the card tells the
 *  story instead of linking out. Where one is public, the card links to it. */
export const COMPOSITIONS = [
  {
    id: 'sembly',
    title: 'Sembly',
    tagline: 'Scheduling for worship teams',
    // The card's link pill already reads "sembly.app"; the status no longer repeats it.
    // needs Roman: confirm.
    status: 'Live',
    url: 'https://sembly.app',
    description:
      'The answer to "am I playing this Sunday?" — on the phone that gets asked. Volunteers see the dates they serve, their position, the running order with every song key, and the sheet music; leaders plan a whole month from the same screen. Row-level security in Postgres is the actual boundary, so a volunteer only ever sees the services they are on.',
    stack: ['Next.js', 'Supabase', 'Tailwind', 'PWA'],
    color: '#af52de',
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
  },
  {
    // needs Roman: alongsideevents.com is public (sign-in, pricing, "Your
    // first event is free") and its JSON-LD names him and Anna Kucheryava as
    // founders (fetched 2026-10-13), but with no `url` here the card says
    // "Private build", and the Compositions intro's "most are private builds"
    // counts it. Whether it may be linked as his, and his status and tagline
    // for it, are his to give; nothing changes until he does.
    id: 'alongside-events',
    title: 'Alongside Events',
    tagline: 'The tech stack behind the family coffee cart',
    status: 'Runs the family cart',
    description:
      'QR-code ordering guests scan right at the cart, automated post-event recaps, and fully functional networked thermal label printing — every technical piece a mobile espresso bar needs, composed from scratch and battle-tested at real weddings.',
    stack: ['Next.js', 'TypeScript', 'QR ordering', 'Thermal print server'],
    color: '#ffb800',
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
  },
] as const

export const TECH_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Swift',
  'Java', 'Python', 'C', 'SQL', 'Apex',
  'Salesforce', 'Data Cloud', 'CRMA', 'LWC',
  'Node.js', 'Firebase', 'Supabase', 'Git',
] as const
