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

/** Original works — the products I compose, own, and operate. */
export const COMPOSITIONS = [
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
    tagline: 'SaaS for mobile event vendors',
    status: 'Runs my own business',
    description:
      'Quotes, invoices, contracts, and a client CRM purpose-built for mobile coffee cart operators — born from running my family’s espresso cart at weddings and corporate events. The business software I wished existed, so I composed it myself.',
    stack: ['Next.js', 'TypeScript', 'Tailwind', 'PDF generation'],
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
