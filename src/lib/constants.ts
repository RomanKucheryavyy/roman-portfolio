export const SITE = {
  name: 'Roman Kucheryavyy',
  title: 'Roman Kucheryavyy — Engineer & Builder',
  description:
    'Engineer in Auburn, WA. Salesforce by day; nights are for AI-powered products — an autonomous trading platform, event-business SaaS, and a personal second brain.',
  url: 'https://romankucheryavyy.com',
} as const

export const LINKS = {
  linkedin: 'https://www.linkedin.com/in/romakuch/',
  github: 'https://github.com/RomanKucheryavyy',
  email: 'kucheryavyyroman@gmail.com',
} as const

export const NAV_ITEMS = [
  { label: 'Work', href: '#work' },
  { label: 'Clients', href: '#clients' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
] as const

/** Products I design, build, and operate myself. */
export const FEATURED = [
  {
    id: 'praxis',
    title: 'Praxis',
    tagline: 'AI-augmented trading platform',
    year: '2026',
    status: 'Paper trading daily',
    description:
      'A multi-agent investing desk: a council of 18 investor personas — each with its own rules and an LLM-written thesis — debates every position, while an AI portfolio manager synthesizes their views into sized trade proposals. A Discovery Engine scans for spinoffs, activist positions, and cyclical bottoms; trades execute through Alpaca with guardrailed autonomy. The goal: beat the S&P 500 over twelve months of paper trading before a single real dollar moves.',
    stack: ['Next.js', 'React', 'TypeScript', 'Claude API', 'Alpaca'],
  },
  {
    id: 'alongside-events',
    title: 'Alongside Events',
    tagline: 'SaaS for mobile event vendors',
    year: '2026',
    status: 'Runs my own business',
    description:
      'Multi-tenant business platform for mobile coffee cart operators — quotes, invoices, contracts, and a client CRM purpose-built for weddings and corporate events. It started as the internal toolset for Alongside Coffee, the espresso cart company my family runs, and is growing into a product for operators like us.',
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'PDF generation'],
  },
  {
    id: 'alongside-brain',
    title: 'Alongside Brain',
    tagline: 'Personal AI second brain',
    year: '2026',
    status: 'Running 24/7',
    description:
      'An always-on knowledge system: an Obsidian vault as the source of truth, and a Slack bot that captures anything in plain language — notes, reminders, journal entries, expenses — and routes it with Claude. Scheduled digests, Gmail and Calendar sync, and pattern detection across daily logs keep it honest. It runs around the clock on a desktop in my office.',
    stack: ['Python', 'Claude API', 'Slack API', 'Obsidian'],
  },
] as const

/** Sites and apps shipped for real businesses. */
export const CLIENT_WORK = [
  {
    id: 'alongside-coffee',
    title: 'Alongside Coffee',
    url: 'https://www.alongsidecoffee.com',
    image: '/images/projects/alongside-coffee.png',
    description:
      'Brand site for my own mobile espresso cart company — booking, packages, and a premium brand identity.',
    tags: ['Web Design', 'Branding', 'My Business'],
  },
  {
    id: 'fubc-coffee-web',
    title: 'FUBC Coffee',
    url: 'https://www.fubccoffee.com',
    image: '/images/projects/fubc-coffee-web.png',
    description:
      'Custom coffee ordering platform — menu management, ordering system, and brand experience.',
    tags: ['Web App', 'Full-Stack', 'E-commerce'],
  },
  {
    id: 'fubc-coffee-ios',
    title: 'FUBC Coffee for iOS',
    url: 'https://apps.apple.com/us/app/fubc-coffee/id6760352447',
    image: '/images/projects/fubc-coffee-ios.png',
    description:
      'Native iOS companion app built with Swift — push notifications, real-time ordering, Apple Pay.',
    tags: ['iOS', 'Swift', 'App Store'],
  },
  {
    id: 'fubc-band',
    title: 'FUBC Band',
    url: 'https://www.fubcband.com',
    image: '/images/projects/fubc-band.png',
    description:
      'Official site for the band I direct — events, media gallery, and live performance showcase.',
    tags: ['Web Design', 'Music', 'CMS'],
  },
  {
    id: 'mark-lutsyuk',
    title: 'Mark Lutsyuk',
    url: 'https://marklutsyuk.com',
    image: '/images/projects/mark-lutsyuk.png',
    description:
      'Personal portfolio and professional presence for a creative professional — clean and conversion-focused.',
    tags: ['Portfolio', 'Web Design', 'UI/UX'],
  },
  {
    id: 'intext-construction',
    title: 'Intext Construction',
    url: 'https://www.intextconstructionllc.com',
    image: '/images/projects/intext-construction.png',
    description:
      'Professional web presence for a construction company — service showcase, portfolio, lead generation.',
    tags: ['Web Design', 'Business', 'Lead Gen'],
  },
] as const

export const TIMELINE = [
  { year: '2016', label: 'Computer Science @ Highline College' },
  { year: '2018', label: 'Computer Science @ UW Tacoma' },
  { year: '2021', label: 'Microsoft' },
  { year: '2023', label: 'Salesforce — Gov Cloud, Premier Support' },
  { year: 'Now', label: 'Building AI products after hours' },
] as const

export const CERTIFICATIONS = [
  { id: 'pd1', name: 'Platform Developer I', date: 'Jul 2025' },
  { id: 'dcc', name: 'Data Cloud Consultant', date: 'Mar 2025' },
  { id: 'ais', name: 'AI Specialist', date: 'Nov 2024' },
  { id: 'scc', name: 'Sales Cloud Consultant', date: 'Aug 2024' },
  { id: 'scaa', name: 'Advanced Administrator', date: 'Apr 2024' },
  { id: 'aia', name: 'AI Associate', date: 'Apr 2024' },
  { id: 'pab', name: 'Platform App Builder', date: 'Jan 2024' },
  { id: 'sca', name: 'Administrator', date: 'Dec 2023' },
] as const

export const SKILL_GROUPS = [
  {
    label: 'Languages',
    items: ['TypeScript', 'JavaScript', 'Python', 'Swift', 'Java', 'SQL', 'Apex'],
  },
  {
    label: 'Web',
    items: ['React', 'Next.js', 'Tailwind CSS', 'Node.js', 'Supabase', 'Firebase'],
  },
  {
    label: 'Salesforce',
    items: ['Gov Cloud', 'Data Cloud', 'LWC', 'CRM Analytics', '8× certified'],
  },
  {
    label: 'AI & Automation',
    items: ['Claude API', 'Multi-agent systems', 'Slack bots', 'Alpaca API'],
  },
] as const
