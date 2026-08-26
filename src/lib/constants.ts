export const SITE = {
  name: 'Roman Kucheryavyy',
  title: 'Roman Kucheryavyy — Orchestrating Logic & Art',
  description:
    'Salesforce engineer, full-stack developer, and band conductor building at the intersection of precision and creativity.',
  url: 'https://romankucheryavyy.com',
} as const

export const LINKS = {
  linkedin: 'https://www.linkedin.com/in/romakuch/',
  github: 'https://github.com/RomanKucheryavyy',
  email: 'kucheryavyyroman@gmail.com',
} as const

export const CERTIFICATIONS = [
  { id: 'pd1', name: 'Platform Developer I', short: 'PD1', date: 'Jul 2025', category: 'developer' },
  { id: 'dcc', name: 'Data Cloud Consultant', short: 'DCC', date: 'Mar 2025', category: 'consultant' },
  { id: 'ais', name: 'AI Specialist', short: 'AIS', date: 'Nov 2024', category: 'ai' },
  { id: 'scc', name: 'Sales Cloud Consultant', short: 'SCC', date: 'Aug 2024', category: 'consultant' },
  { id: 'scaa', name: 'Advanced Administrator', short: 'SCAA', date: 'Apr 2024', category: 'admin' },
  { id: 'aia', name: 'AI Associate', short: 'AIA', date: 'Apr 2024', category: 'ai' },
  { id: 'pab', name: 'Platform App Builder', short: 'PAB', date: 'Jan 2024', category: 'developer' },
  { id: 'sca', name: 'Administrator', short: 'SCA', date: 'Dec 2023', category: 'admin' },
] as const

/** Client work & shipped products — performed in The Symphony deck. */
export const PROJECTS = [
  {
    id: 'alongside-coffee',
    title: 'Alongside Coffee',
    url: 'https://www.alongsidecoffee.com',
    image: '/images/projects/alongside-coffee.png',
    description:
      'Brewed from scratch — a full-stack e-commerce experience that turns first-time visitors into repeat customers. Custom design system, responsive to the last pixel.',
    tags: ['Web Design', 'E-commerce', 'Branding'],
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
    status: 'Live at sembly.app',
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

export const NAV_ITEMS = [
  { label: 'Measures', href: '#measures' },
  { label: 'Symphony', href: '#symphony' },
  { label: 'Compositions', href: '#compositions' },
  { label: 'Conductor', href: '#conductor' },
  { label: 'Compose', href: '#compose' },
] as const

export const TECH_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Swift',
  'Java', 'Python', 'C', 'SQL', 'Apex',
  'Salesforce', 'Data Cloud', 'CRMA', 'LWC',
  'Node.js', 'Firebase', 'Supabase', 'Git',
] as const
