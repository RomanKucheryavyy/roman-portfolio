export const SITE = {
  name: 'Roman Kucheryavyy',
  title: 'Roman Kucheryavyy — Orchestrating Logic & Art',
  description: 'Senior Technical Support Engineer at Salesforce. Developer. Designer. Musician. Orchestrating Logic and Art.',
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

export const PROJECTS = [
  {
    id: 'alongside-coffee',
    title: 'Alongside Coffee',
    url: 'https://www.alongsidecoffee.com',
    description: 'Full-stack e-commerce experience for a premium coffee brand. Custom design, responsive build, and brand identity.',
    tags: ['Web Design', 'E-commerce', 'Branding'],
    color: '#C4A265',
  },
  {
    id: 'mark-lutsyuk',
    title: 'Mark Lutsyuk',
    url: 'https://marklutsyuk.com',
    description: 'Personal portfolio and professional presence for a creative professional. Clean, modern, conversion-focused.',
    tags: ['Portfolio', 'Web Design', 'UI/UX'],
    color: '#5B8DEF',
  },
  {
    id: 'fubc-band',
    title: 'FUBC Band',
    url: 'https://www.fubcband.com',
    description: 'Official website for the FUBC Band. Event listings, media gallery, and live performance showcase.',
    tags: ['Web Design', 'Music', 'CMS'],
    color: '#FF6B4A',
  },
  {
    id: 'intext-construction',
    title: 'Intext Construction',
    url: 'https://www.intextconstructionllc.com',
    description: 'Professional web presence for a construction company. Service showcase, portfolio, and lead generation.',
    tags: ['Web Design', 'Business', 'Lead Gen'],
    color: '#4ADE80',
  },
  {
    id: 'fubc-coffee-web',
    title: 'FUBC Coffee',
    url: 'https://www.fubccoffee.com',
    description: 'Custom web application for a coffee ordering platform. Menu management, ordering system, and brand experience.',
    tags: ['Web App', 'Full-Stack', 'E-commerce'],
    color: '#D97706',
  },
  {
    id: 'fubc-coffee-ios',
    title: 'FUBC Coffee iOS',
    url: 'https://apps.apple.com/us/app/fubc-coffee/id6760352447',
    description: 'Native iOS application built with Swift. Push notifications, real-time ordering, and Apple Pay integration.',
    tags: ['iOS', 'Swift', 'Mobile App'],
    color: '#A855F7',
    isApp: true,
  },
] as const

export const NAV_ITEMS = [
  { label: 'Measures', href: '#arsenal' },
  { label: 'Symphony', href: '#projects' },
  { label: 'Conductor', href: '#about' },
  { label: 'Compose', href: '#contact' },
] as const

export const TECH_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Swift',
  'Java', 'Python', 'C', 'SQL', 'Apex',
  'Salesforce', 'Data Cloud', 'CRMA', 'LWC',
  'Node.js', 'Firebase', 'Supabase', 'Git',
] as const
