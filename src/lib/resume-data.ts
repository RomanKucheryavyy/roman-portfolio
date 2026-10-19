export interface ResumeData {
  name: string
  location: string
  phone: string
  email: string
  linkedin: string
  github: string
  website?: string
  summary: string
  experience: { company: string; location: string; title: string; dates: string; bullets: string[] }[]
  certifications: { name: string; date: string }[]
  education: { school: string; location: string; degree: string; dates: string; gpa?: string }[]
  skills: string[]
  projects: { name: string; tech: string; bullets: string[] }[]
}

export const RESUME_DATA: ResumeData = {
  name: 'Roman Kucheryavyy',
  location: 'Auburn, WA 98092',
  phone: '(253) 802-6464',
  email: 'kucheryavyyroman@gmail.com',
  linkedin: 'https://www.linkedin.com/in/romakuch/',
  github: 'https://github.com/RomanKucheryavyy',
  website: 'https://romankucheryavyy.com',
  summary:
    'Senior Technical Support Engineer at Salesforce (Signature Success) owning an escalation queue for Fortune 500 and strategic enterprise customers. 1,200+ cases resolved at a 4.9/5.0 CSAT with 0% SLA misses, almost entirely in written communication. 8x Salesforce certified, BS in Computer Science, and a builder of production AI products on the Claude API.',
  experience: [
    {
      company: 'Salesforce',
      location: 'Bellevue, WA',
      title: 'Senior Technical Support Engineer, Signature Success',
      dates: 'April 2026 – Present',
      bullets: [
        "Single point of technical accountability for Salesforce's most strategic Signature-tier enterprise customers. Own the escalation queue day to day: 1,214 cases closed at a 4.9/5.0 average CSAT, 0% SLA misses, and 119% of productivity target.",
        'Triage and resolve complex multi-org Sales Cloud issues across Apex, SOQL, API integrations and governor limits, and lead root cause analysis on SEV-1 production incidents.',
        'Partner directly with Salesforce R&D, Engineering and Account Success to drive resolution of platform-level defects, routing what belongs elsewhere and managing recovery for high-risk enterprise accounts.',
        'Champion adoption of Salesforce agentic AI (Agentforce), guiding strategic customers through mission-critical AI implementations and holding a calm, professional tone through contentious escalations.',
      ],
    },
    {
      company: 'Salesforce',
      location: 'Bellevue, WA',
      title: 'Premier Technical Support Engineer, Government Cloud',
      dates: 'November 2023 – April 2026',
      bullets: [
        'Delivered premier-level support for Salesforce Government Cloud customers within strict public-sector SLAs, covering 9 product areas including Security, Data Cloud, CRM Analytics, Developer Support, and Sales Engagement.',
        'Escalated and remediated SEV-1 incidents with engineering, security, and product teams, and guided federal clients through platform best practices and compliance with federal data standards.',
      ],
    },
    {
      company: 'MindTree (supporting Microsoft service partners)',
      location: 'Bellevue, WA',
      title: 'Technical Support Engineer',
      dates: 'May 2021 – November 2023',
      bullets: [
        'Supported federal government agencies on Microsoft products within defined SLAs, partnering with internal support and operations teams to identify and resolve systemic faults.',
      ],
    },
  ],
  certifications: [
    { name: 'Platform Developer I', date: 'Jul 2025' },
    { name: 'Data Cloud Consultant', date: 'Mar 2025' },
    { name: 'AI Specialist', date: 'Nov 2024' },
    { name: 'Sales Cloud Consultant', date: 'Aug 2024' },
    { name: 'Advanced Administrator', date: 'Apr 2024' },
    { name: 'AI Associate', date: 'Apr 2024' },
    { name: 'Platform App Builder', date: 'Jan 2024' },
    { name: 'Administrator', date: 'Dec 2023' },
  ],
  education: [
    {
      school: 'University of Washington',
      location: 'Tacoma, WA',
      degree: 'BS, Computer Science and Systems',
      dates: '2018 – 2020',
      gpa: '3.7',
    },
    {
      school: 'Highline College',
      location: 'Des Moines, WA',
      degree: 'AA, Computer Science',
      dates: '2016 – 2018',
      gpa: '3.58',
    },
  ],
  skills: [
    'Technical Support', 'Escalation Management', 'Queue Ownership', 'SLA Management',
    'Root Cause Analysis', 'Case Management', 'Enterprise B2B Support', 'Partner Support',
    'Technical Documentation', 'Salesforce (Apex, LWC, SOQL, Flow)', 'Sales Cloud', 'Data Cloud',
    'Agentforce', 'Claude API', 'TypeScript', 'React', 'Next.js', 'Python', 'Java', 'SQL', 'REST APIs',
  ],
  projects: [
    {
      name: 'Alongside Events: AI-Powered Event Operations SaaS',
      tech: 'Next.js, TypeScript, Supabase (Postgres + RLS), Claude API, Stripe, Twilio',
      bullets: [
        'Multi-tenant SaaS running real weddings since June 2026, with QR guest ordering, networked thermal printing, SMS and Stripe subscriptions. Claude Haiku powers the AI barista that designs each couple a signature drink, plus automated recap narratives and guest translation.',
        'Every Claude call runs through a usage recorder a unit test enforces, under per-operator rate limits, a monthly spend cap, prompt caching, and cost attribution by feature, event, and day.',
      ],
    },
    {
      name: 'Alongside Brain: Personal AI Knowledge System',
      tech: 'Python, Claude API, Slack API, Obsidian',
      bullets: [
        'Built an always-on AI system: a Slack bot captures notes, reminders and expenses in plain language, Claude routes each into an Obsidian vault, and scheduled digests and pattern detection run 24/7.',
      ],
    },
    {
      name: 'FUBC Coffee iOS App',
      tech: 'Swift, SwiftUI, Firebase, Supabase',
      bullets: [
        'Published a native ordering app with real-time orders, push notifications and digital loyalty cards. 5.0 stars on the App Store.',
      ],
    },
  ],
}
